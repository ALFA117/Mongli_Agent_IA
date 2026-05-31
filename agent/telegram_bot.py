"""
Telegram bot — subscribes users and pushes signal alerts.
"""
import logging
import os

from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

load_dotenv()

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
logger = logging.getLogger(__name__)

_subscribers: set[int] = set()
_recent_signals: list[dict] = []  # populated by main.py


def register_signal(signal: dict):
    _recent_signals.insert(0, signal)
    if len(_recent_signals) > 50:
        _recent_signals.pop()


async def cmd_start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    _subscribers.add(update.effective_chat.id)
    await update.message.reply_text(
        "Subscribed to Mongli Agent alerts.\n"
        "Use /top5 to see recent signals, /help for all commands."
    )


async def cmd_top5(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not _recent_signals:
        await update.message.reply_text("No signals yet.")
        return
    lines = []
    for s in _recent_signals[:5]:
        lines.append(
            f"• {s['signal_type']} | {s['wallet'][:10]}... | {s['confidence']}%"
        )
    await update.message.reply_text("\n".join(lines))


async def cmd_stats(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        f"Total signals (session): {len(_recent_signals)}\n"
        f"Subscribers: {len(_subscribers)}"
    )


async def cmd_help(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "/start — Subscribe to alerts\n"
        "/top5 — 5 most recent signals\n"
        "/stats — Agent statistics\n"
        "/help — This message"
    )


async def broadcast(app: Application, signal: dict):
    text = (
        "🔴 MONGLI AGENT ALERT\n"
        "━━━━━━━━━━━━━━━━━\n"
        f"Tipo: {signal['signal_type']}\n"
        f"Wallet: {signal['wallet'][:6]}...{signal['wallet'][-4:]}\n"
        f"Confianza: {signal['confidence']}%\n"
        f"Razonamiento: {signal['reasoning']}\n"
        "━━━━━━━━━━━━━━━━━"
    )
    for chat_id in list(_subscribers):
        try:
            await app.bot.send_message(chat_id=chat_id, text=text)
        except Exception as exc:
            logger.warning("Failed to send to %s: %s", chat_id, exc)


def build_app() -> Application:
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("top5", cmd_top5))
    app.add_handler(CommandHandler("stats", cmd_stats))
    app.add_handler(CommandHandler("help", cmd_help))
    return app
