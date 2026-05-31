"""
ML Engine — anomaly detection + wallet clustering + SmartMoney scoring.

Pipeline:
  1. IsolationForest  → outlier score (anomalous behaviour)
  2. KMeans (k=5)     → wallet archetype cluster
  3. SmartMoney Score → heuristic conviction score (0-100)
  4. Signal emission  → structured dict with reasoning + on-chain hash
"""
import hashlib
import json
import logging
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

from config import cfg, MODELS_DIR

log = logging.getLogger(__name__)

# ── Constants ────────────────────────────────────────────────────────────────
FEATURES = [
    "tx_count", "total_volume_mnt", "max_single_tx", "avg_tx_value",
    "unique_counterparties", "defi_interactions", "gas_used_avg",
    "is_contract_caller", "volume_concentration",
]

CLUSTER_LABELS = {
    0: "retail",
    1: "whale",
    2: "smart_money",
    3: "bot",
    4: "new_wallet",
}

MODEL_PATH   = MODELS_DIR / "ml_models.pkl"
SCALER_PATH  = MODELS_DIR / "scaler.pkl"
MIN_ROWS_FIT = 10   # minimum rows needed to fit models


# ── Engine ───────────────────────────────────────────────────────────────────
class MLEngine:
    """
    Stateful ML engine. Persists fitted models to disk so they survive
    restarts and improve over time as more data is seen.
    """

    def __init__(self):
        self.scaler  = StandardScaler()
        self.iso     = IsolationForest(contamination=0.06, n_estimators=200, random_state=42)
        self.kmeans  = KMeans(n_clusters=5, n_init="auto", random_state=42)
        self._fitted = False
        self._load_models()

    # ── Public API ───────────────────────────────────────────────────────────

    def analyze(self, df: pd.DataFrame) -> list[dict]:
        """
        Run the full pipeline on a DataFrame of wallet features.
        Returns a list of signal dicts (only those with confidence ≥ 50).
        """
        if df.empty:
            return []

        df = self._prepare(df)
        X  = self._extract_matrix(df)

        if not self._fitted:
            if len(df) < MIN_ROWS_FIT:
                log.debug("Not enough rows to fit (%d < %d)", len(df), MIN_ROWS_FIT)
                return []
            self._fit(X)

        X_scaled      = self.scaler.transform(X)
        anomaly_scores = self.iso.decision_function(X_scaled)
        clusters       = self.kmeans.predict(X_scaled)

        signals = []
        for i, row in df.iterrows():
            confidence   = self._anomaly_to_confidence(anomaly_scores[i])
            cluster_id   = int(clusters[i])
            cluster_name = CLUSTER_LABELS.get(cluster_id, "unknown")
            smart_score  = self._smart_money_score(row)
            final_conf   = self._blend_confidence(confidence, smart_score, cluster_name)
            signal_type  = self._classify(row, cluster_name, anomaly_scores[i], smart_score)
            reasoning    = self._build_reasoning(row, cluster_name, final_conf, smart_score)

            payload = {
                "wallet":      row["address"],
                "signal_type": signal_type,
                "confidence":  final_conf,
                "cluster":     cluster_name,
                "reasoning":   reasoning,
                "features":    {f: round(float(row[f]), 4) for f in FEATURES},
            }
            payload["on_chain_hash"] = _keccak(payload)

            if final_conf >= 50:
                signals.append(payload)

        self._save_models()
        log.info("ML analyzed %d wallets → %d signals", len(df), len(signals))
        return signals

    def retrain(self, df: pd.DataFrame) -> bool:
        """Force a full refit on new data. Call periodically for fresh models."""
        if len(df) < MIN_ROWS_FIT:
            return False
        df = self._prepare(df)
        X  = self._extract_matrix(df)
        self._fit(X)
        self._save_models()
        log.info("Models retrained on %d rows", len(df))
        return True

    # ── Feature engineering ──────────────────────────────────────────────────

    @staticmethod
    def _prepare(df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        for f in FEATURES:
            if f not in df.columns:
                df[f] = 0
        df[FEATURES] = df[FEATURES].fillna(0).astype(float)
        return df

    def _extract_matrix(self, df: pd.DataFrame) -> np.ndarray:
        return df[FEATURES].values

    # ── Model lifecycle ──────────────────────────────────────────────────────

    def _fit(self, X: np.ndarray):
        X_scaled = self.scaler.fit_transform(X)
        self.iso.fit(X_scaled)
        self.kmeans.fit(X_scaled)
        self._fitted = True

    def _save_models(self):
        try:
            joblib.dump({"iso": self.iso, "kmeans": self.kmeans}, MODEL_PATH)
            joblib.dump(self.scaler, SCALER_PATH)
        except Exception as e:
            log.warning("Could not save models: %s", e)

    def _load_models(self):
        try:
            if MODEL_PATH.exists() and SCALER_PATH.exists():
                d = joblib.load(MODEL_PATH)
                self.iso     = d["iso"]
                self.kmeans  = d["kmeans"]
                self.scaler  = joblib.load(SCALER_PATH)
                self._fitted = True
                log.info("Loaded persisted ML models from %s", MODELS_DIR)
        except Exception as e:
            log.warning("Could not load models: %s", e)

    # ── Scoring ──────────────────────────────────────────────────────────────

    @staticmethod
    def _anomaly_to_confidence(score: float) -> int:
        """
        IsolationForest decision_function:
          negative = anomalous  →  high confidence signal
          positive = normal     →  low confidence
        Map [-0.5, 0.5] → [90, 10]
        """
        clamped = max(-0.5, min(0.5, score))
        return int(round(90 - (clamped + 0.5) * 80))

    @staticmethod
    def _smart_money_score(row: pd.Series) -> int:
        """
        Rule-based SmartMoney conviction (0-100).

        High score = concentrated large positions + DeFi interaction +
                     reasonable frequency (not bot) + multi-counterparty.
        """
        score = 0

        # Position size (concentrated capital deployment)
        avg = row.get("avg_tx_value", 0)
        if avg >= 20_000:   score += 35
        elif avg >= 5_000:  score += 25
        elif avg >= 1_000:  score += 12

        # DeFi protocol interaction
        defi = row.get("defi_interactions", 0)
        if defi >= 3:   score += 25
        elif defi >= 1: score += 15

        # Not a bot (reasonable tx count)
        count = row.get("tx_count", 0)
        if 2 <= count <= 15: score += 15

        # Multiple counterparties (active, not self-circular)
        cp = row.get("unique_counterparties", 0)
        if cp >= 4:   score += 15
        elif cp >= 2: score += 8

        # Calls smart contracts (protocol interaction)
        if row.get("is_contract_caller", 0):
            score += 10

        return min(score, 100)

    @staticmethod
    def _blend_confidence(anomaly_conf: int, smart_score: int, cluster: str) -> int:
        """Weighted blend of anomaly detector + rule-based SmartMoney score."""
        weight_anomaly = 0.55
        weight_smart   = 0.45
        blended = anomaly_conf * weight_anomaly + smart_score * weight_smart

        # Cluster bonus: smart_money cluster bumps confidence
        if cluster == "smart_money":
            blended = min(blended * 1.12, 100)
        elif cluster == "bot":
            blended *= 0.7   # bots get penalised

        return int(round(blended))

    # ── Signal classification ────────────────────────────────────────────────

    @staticmethod
    def _classify(row: pd.Series, cluster: str, anomaly_score: float, smart: int) -> str:
        if smart >= 60 and cluster in ("smart_money", "whale"):
            return "SMART_MONEY_IN"
        if row.get("total_volume_mnt", 0) >= cfg.whale_threshold * 3:
            return "WHALE_MOVE"
        if anomaly_score < -0.15:
            return "ANOMALY"
        if smart >= 45:
            return "SMART_MONEY_IN"
        return "ANOMALY"

    # ── Reasoning text ───────────────────────────────────────────────────────

    @staticmethod
    def _build_reasoning(row: pd.Series, cluster: str, confidence: int, smart: int) -> str:
        parts = [f"Wallet classified as {cluster}."]

        vol = row.get("total_volume_mnt", 0)
        if vol > 0:
            parts.append(f"Moved {vol:,.0f} MNT across {int(row.get('tx_count', 0))} txs.")

        defi = int(row.get("defi_interactions", 0))
        if defi > 0:
            parts.append(f"Interacted with {defi} DeFi protocol(s).")

        cp = int(row.get("unique_counterparties", 0))
        if cp > 1:
            parts.append(f"Reached {cp} unique counterparties.")

        parts.append(f"SmartMoney score: {smart}/100. Final confidence: {confidence}%.")
        return " ".join(parts)


# ── Helpers ──────────────────────────────────────────────────────────────────

def _keccak(payload: dict) -> str:
    """Deterministic SHA-256 of the signal payload (excluding the hash field)."""
    data = {k: v for k, v in payload.items() if k != "on_chain_hash"}
    serialised = json.dumps(data, sort_keys=True, default=str)
    return "0x" + hashlib.sha256(serialised.encode()).hexdigest()
