"""
Mongli_Agent_IA — entry point.

Starts the APScheduler monitoring loop and the Telegram bot.
"""
import asyncio
import logging
import os

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from dotenv import load_dotenv

from collector import MantleCollector
from ml_engine import MLEngine
from signal_writer import SignalWriter
from telegram_bot import broadcast, build_app, register_signal

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

SCAN_INTERVAL = int(os.getenv("SCAN_INTERVAL_SECONDS", 30))

collector = MantleCollector()
ml = MLEngine()
writer = SignalWriter()


async def scan(tg_app):
    logger.info("Scanning Mantle block...")
    try:
        df = collector.collect_whale_txs()
        signals = ml.analyze(df)
        for signal in signals:
            tx = writer.write(signal)
            register_signal(signal)
            if tx:
                await broadcast(tg_app, signal)
                logger.info("Signal on-chain: %s", tx)
    except Exception as exc:
        logger.error("Scan error: %s", exc)


async def main():
    tg_app = build_app()
    scheduler = AsyncIOScheduler()
    scheduler.add_job(scan, "interval", seconds=SCAN_INTERVAL, args=[tg_app])
    scheduler.start()
    logger.info("Mongli_Agent_IA started. Scan interval: %ds", SCAN_INTERVAL)
    async with tg_app:
        await tg_app.start()
        await tg_app.updater.start_polling()
        try:
            await asyncio.Event().wait()
        finally:
            await tg_app.updater.stop()
            await tg_app.stop()


if __name__ == "__main__":
    asyncio.run(main())
