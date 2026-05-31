"""
Mongli_Agent_IA — entry point.

Starts:
  - APScheduler scan loop (every SCAN_INTERVAL_SECONDS)
  - Telegram bot polling (optional, needs TELEGRAM_BOT_TOKEN)
  - FastAPI server (optional, runs in a thread)
"""
import asyncio
import logging
import sys
import threading

import uvicorn
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from config import cfg
from collector import MantleCollector
from ml_engine import MLEngine
from signal_writer import SignalWriter
from telegram_bot import broadcast, build_app, register_signal
from backtesting import run_backtest

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(cfg_log_path()),
    ],
)
log = logging.getLogger("mongli.main")


def cfg_log_path():
    from config import LOGS_DIR
    return LOGS_DIR / "agent.log"


# ── Singletons ───────────────────────────────────────────────────────────────
collector = MantleCollector()
ml        = MLEngine()
writer    = SignalWriter()


# ── Scan job ─────────────────────────────────────────────────────────────────

async def scan(tg_app=None):
    """One scan iteration: collect → ML → write → alert."""
    log.info("=== Scan started ===")
    try:
        df      = collector.collect_whale_txs()
        signals = ml.analyze(df)

        log.info("Signals this scan: %d (above threshold=%d)", len(signals), cfg.min_confidence)

        for signal in signals:
            tx = writer.write(signal)
            register_signal(signal)

            if tg_app and tx:
                await broadcast(tg_app, signal)

            log.info(
                "SIGNAL  type=%-16s  conf=%3d%%  wallet=%s  tx=%s",
                signal["signal_type"],
                signal["confidence"],
                signal["wallet"][:12],
                (tx or "dry-run")[:20],
            )

    except Exception as exc:
        log.error("Scan failed: %s", exc, exc_info=True)


# ── FastAPI thread ────────────────────────────────────────────────────────────

def _start_api():
    from api import app
    uvicorn.run(app, host=cfg.api_host, port=cfg.api_port, log_level="warning")


# ── Main ──────────────────────────────────────────────────────────────────────

async def main():
    log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    log.info("  Mongli_Agent_IA starting")
    log.info("  Network : %s (chain %d)", "Testnet" if cfg.is_testnet else "Mainnet", cfg.chain_id)
    log.info("  RPC     : %s", cfg.active_rpc)
    log.info("  Contract: %s", cfg.contract_address or "NOT SET (dry-run)")
    log.info("  Interval: %ds", cfg.scan_interval_s)
    log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    # Start FastAPI in background thread
    api_thread = threading.Thread(target=_start_api, daemon=True)
    api_thread.start()
    log.info("API running on http://%s:%d", cfg.api_host, cfg.api_port)

    # Build Telegram app (optional)
    tg_app = build_app()

    # Scheduler
    scheduler = AsyncIOScheduler()
    scheduler.add_job(scan, "interval", seconds=cfg.scan_interval_s, args=[tg_app])
    scheduler.add_job(run_backtest, "interval", hours=1)   # hourly backtesting
    scheduler.start()
    log.info("Scheduler started (scan every %ds)", cfg.scan_interval_s)

    # Run first scan immediately
    await scan(tg_app)

    if tg_app:
        async with tg_app:
            await tg_app.start()
            await tg_app.updater.start_polling()
            log.info("Telegram bot polling active")
            try:
                await asyncio.Event().wait()
            finally:
                await tg_app.updater.stop()
                await tg_app.stop()
    else:
        log.info("Telegram bot not configured — running headless")
        await asyncio.Event().wait()


if __name__ == "__main__":
    asyncio.run(main())
