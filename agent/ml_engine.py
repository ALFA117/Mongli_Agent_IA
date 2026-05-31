"""
ML Engine — anomaly detection and smart money scoring over collector DataFrames.
"""
import hashlib
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

CLUSTER_LABELS = {0: "retail", 1: "whale", 2: "bot", 3: "smart_money", 4: "new"}

FEATURES = ["value_mnt", "gas"]


class MLEngine:
    def __init__(self):
        self.scaler = StandardScaler()
        self.iso = IsolationForest(contamination=0.05, random_state=42)
        self.kmeans = KMeans(n_clusters=5, random_state=42, n_init="auto")
        self._fitted = False

    def _prepare(self, df: pd.DataFrame) -> np.ndarray:
        X = df[FEATURES].fillna(0).values.astype(float)
        return self.scaler.fit_transform(X)

    def fit(self, df: pd.DataFrame):
        X = self._prepare(df)
        self.iso.fit(X)
        self.kmeans.fit(X)
        self._fitted = True

    def analyze(self, df: pd.DataFrame) -> list[dict]:
        if df.empty:
            return []
        X = self._prepare(df)
        if not self._fitted:
            self.fit(df)

        anomaly_scores = self.iso.decision_function(X)  # lower = more anomalous
        clusters = self.kmeans.predict(X)

        signals = []
        for i, row in df.iterrows():
            confidence = self._score_to_confidence(anomaly_scores[i])
            cluster = CLUSTER_LABELS.get(int(clusters[i]), "unknown")
            signal_type = self._classify_signal(row, cluster, anomaly_scores[i])
            reasoning = self._build_reasoning(row, cluster, confidence)
            data = {
                "wallet": row.get("from", ""),
                "signal_type": signal_type,
                "confidence": confidence,
                "reasoning": reasoning,
                "cluster": cluster,
            }
            data["on_chain_hash"] = self._hash(data)
            signals.append(data)

        return [s for s in signals if s["confidence"] >= 50]

    @staticmethod
    def _score_to_confidence(score: float) -> int:
        # IsolationForest: negative scores = outliers. Map [-0.5, 0.5] → [90, 10]
        clamped = max(-0.5, min(0.5, score))
        return int(90 - (clamped + 0.5) * 80)

    @staticmethod
    def _classify_signal(row: pd.Series, cluster: str, score: float) -> str:
        if cluster == "smart_money" and score < -0.1:
            return "SMART_MONEY_IN"
        if cluster == "whale":
            return "WHALE_MOVE"
        return "ANOMALY"

    @staticmethod
    def _build_reasoning(row: pd.Series, cluster: str, confidence: int) -> str:
        return (
            f"Wallet classified as {cluster}. "
            f"Transferred {row.get('value_mnt', 0):.2f} MNT. "
            f"Confidence: {confidence}%."
        )

    @staticmethod
    def _hash(data: dict) -> str:
        payload = json.dumps({k: v for k, v in data.items() if k != "on_chain_hash"}, sort_keys=True)
        return "0x" + hashlib.sha256(payload.encode()).hexdigest()
