"""
FastAPI REST API — exposes agent data to the React dashboard and external consumers.

Endpoints:
  GET /              — health + agent stats
  GET /signals       — recent signals (from local log)
  GET /signals/{wallet} — signals for a specific wallet
  GET /stats         — signal statistics
  POST /models/retrain  — trigger ML model retraining
"""
import json
import logging
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config import cfg, LOGS_DIR

log = logging.getLogger(__name__)

LOG_FILE = LOGS_DIR / "signals.jsonl"

# ── Pydantic models ──────────────────────────────────────────────────────────

class Signal(BaseModel):
    wallet:       str
    signal_type:  str
    confidence:   int
    cluster:      str = ""
    reasoning:    str = ""
    on_chain_hash:str = ""
    on_chain_tx:  str = ""
    outcome:      str = "PENDING"

class StatsResponse(BaseModel):
    total_signals:   int
    smart_money_in:  int
    whale_moves:     int
    anomalies:       int
    avg_confidence:  float
    pending:         int

class HealthResponse(BaseModel):
    status:           str
    contract_address: str
    chain_id:         int
    is_testnet:       bool
    signal_count:     int

# ── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Mongli Agent IA — REST API",
    description="On-chain AI signal intelligence for Mantle Network",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helpers ──────────────────────────────────────────────────────────────────

def _load_signals() -> list[dict]:
    if not LOG_FILE.exists():
        return []
    signals = []
    with LOG_FILE.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    signals.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
    return signals


# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/", response_model=HealthResponse)
async def health():
    signals = _load_signals()
    return HealthResponse(
        status           = "ok",
        contract_address = cfg.contract_address or "not-set",
        chain_id         = cfg.chain_id,
        is_testnet       = cfg.is_testnet,
        signal_count     = len(signals),
    )


@app.get("/signals", response_model=list[Signal])
async def get_signals(
    limit:  int = Query(20, ge=1, le=200),
    offset: int = Query(0,  ge=0),
    type:   Optional[str] = Query(None, description="Filter by signal type"),
):
    signals = _load_signals()
    if type:
        signals = [s for s in signals if s.get("signal_type") == type]
    signals = signals[-limit - offset: len(signals) - offset if offset else None]
    signals.reverse()
    return [Signal(**{k: s.get(k, "") for k in Signal.model_fields}) for s in signals[:limit]]


@app.get("/signals/{wallet}", response_model=list[Signal])
async def get_wallet_signals(wallet: str):
    wallet = wallet.lower()
    signals = [s for s in _load_signals() if s.get("wallet", "").lower() == wallet]
    if not signals:
        raise HTTPException(404, detail="No signals found for this wallet")
    signals.reverse()
    return [Signal(**{k: s.get(k, "") for k in Signal.model_fields}) for s in signals]


@app.get("/stats", response_model=StatsResponse)
async def get_stats():
    signals = _load_signals()
    if not signals:
        return StatsResponse(total_signals=0, smart_money_in=0,
                             whale_moves=0, anomalies=0, avg_confidence=0, pending=0)
    confs = [s.get("confidence", 0) for s in signals]
    return StatsResponse(
        total_signals  = len(signals),
        smart_money_in = sum(1 for s in signals if s.get("signal_type") == "SMART_MONEY_IN"),
        whale_moves    = sum(1 for s in signals if s.get("signal_type") == "WHALE_MOVE"),
        anomalies      = sum(1 for s in signals if s.get("signal_type") == "ANOMALY"),
        avg_confidence = round(sum(confs) / len(confs), 1),
        pending        = sum(1 for s in signals if s.get("outcome") == "PENDING"),
    )


@app.post("/models/retrain")
async def retrain_models():
    """Trigger ML model retraining on latest collected data."""
    # Import here to avoid circular import at module load
    from collector import MantleCollector
    from ml_engine import MLEngine

    collector = MantleCollector()
    engine    = MLEngine()
    df        = collector.collect(blocks=20)

    if engine.retrain(df):
        return {"status": "ok", "rows": len(df)}
    return {"status": "skipped", "reason": "not enough data", "rows": len(df)}
