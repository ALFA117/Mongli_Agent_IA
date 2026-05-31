"""
Telegram bot — push alerts to subscribers and handle commands.

Commands:
  /start    Subscribe to live alerts
  /stop     Unsubscribe
  /top5     Latest 5 signals
  /stats    Agent statistics
  /watch    Set wallet to monitor
  /help     Help text
"""
import json
import logging
from pathlib import Path

from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

from config import cfg, LOGS_DIR

log = logging.getLogger(__name__)

LOG_FILE = LOGS_DIR / "signals.jsonl"

# In-memory state (upgradeable to SQLite)
_subscribers:    set[int]  = set()
_session_signals: list[dict] = []


# ── State helpers ────────────────────────────────────────────────────────────

def register_signal(signal: dict):
    """Called by main.py whenever a new signal is emitted."""
    _session_signals.insert(0, signal)
    if len(_session_signals) > 100:
        _session_signals.pop()


def get_subscribers() -> set[int]:
    return _subscribers.copy()


def _load_log_signals(n: int = 5) -> list[dict]:
    if not LOG_FILE.exists():
        return _session_signals[:n]
    signals = []
    with LOG_FILE.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    signals.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
    return list(reversed(signals))[:n]


# ── Formatters ───────────────────────────────────────────────────────────────

def _fmt_signal(s: dict) -> str:
    wallet = s.get("wallet", "")
    short  = f"{wallet[:6]}...{wallet[-4:]}" if len(wallet) > 10 else wallet
    tx     = s.get("on_chain_tx", "dry-run")
    conf   = s.get("confidence", 0)
    stype  = s.get("signal_type", "UNKNOWN")
    reason = s.get("reasoning", "")[:120]

    bars   = "█" * (conf // 10) + "░" * (10 - conf // 10)
    link   = f"https://explorer.sepolia.mantle.xyz/tx/{tx}" if tx not in ("dry-run", "failed") else "—"

    return (
        f"*MONGLI ALERT*\n"
        f"━━━━━━━━━━━━━━━\n"
        f"Type: `{stype}`\n"
        f"Wallet: `{short}`\n"
        f"Confidence: {bars} {conf}%\n"
        f"Reasoning: {reason}\n"
        f"━━━━━━━━━━━━━━━\n"
        f"[View on Mantle Explorer]({link})"
    )


# ── Handlers ─────────────────────────────────────────────────────────────────

async def cmd_start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    cid = update.effective_chat.id
    _subscribers.add(cid)
    await update.message.reply_text(
        "*Mongli Agent IA*\nSubscribed to live on-chain AI signals.\n\n"
        "/top5 — recent signals\n"
        "/stats — agent statistics\n"
        "/help  — all commands",
        parse_mode="Markdown",
    )


async def cmd_stop(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    _subscribers.discard(update.effective_chat.id)
    await update.message.reply_text("Unsubscribed. Use /start to re-subscribe.")


async def cmd_top5(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    signals = _load_log_signals(5)
    if not signals:
        await update.message.reply_text("No signals recorded yet.")
        return
    for s in signals:
        try:
            await update.message.reply_text(_fmt_signal(s), parse_mode="Markdown",
                                             disable_web_page_preview=True)
        except Exception as e:
            log.warning("Failed to send signal: %s", e)


async def cmd_stats(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    signals = _load_log_signals(500)
    total   = len(signals)
    sm      = sum(1 for s in signals if s.get("signal_type") == "SMART_MONEY_IN")
    wh      = sum(1 for s in signals if s.get("signal_type") == "WHALE_MOVE")
    an      = sum(1 for s in signals if s.get("signal_type") == "ANOMALY")
    confs   = [s.get("confidence", 0) for s in signals]
    avg_c   = round(sum(confs) / len(confs), 1) if confs else 0

    text = (
        f"*Mongli Agent — Stats*\n"
        f"━━━━━━━━━━━━━━━\n"
        f"Total signals: `{total}`\n"
        f"Smart Money In: `{sm}`\n"
        f"Whale Moves: `{wh}`\n"
        f"Anomalies: `{an}`\n"
        f"Avg confidence: `{avg_c}%`\n"
        f"Subscribers: `{len(_subscribers)}`"
    )
    await update.message.reply_text(text, parse_mode="Markdown")


async def cmd_help(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "*Mongli Agent IA Commands*\n"
        "/start — Subscribe to alerts\n"
        "/stop  — Unsubscribe\n"
        "/top5  — 5 most recent signals\n"
        "/stats — Agent statistics\n"
        "/help  — This message",
        parse_mode="Markdown",
    )


# ── Broadcast ────────────────────────────────────────────────────────────────

async def broadcast(app: Application, signal: dict):
    """Send alert to all subscribers."""
    if not _subscribers:
        return
    text = _fmt_signal(signal)
    for cid in list(_subscribers):
        try:
            await app.bot.send_message(
                chat_id=cid,
                text=text,
                parse_mode="Markdown",
                disable_web_page_preview=True,
            )
        except Exception as exc:
            log.warning("Failed to send to %d: %s", cid, exc)


# ── App factory ───────────────────────────────────────────────────────────────

def build_app() -> Application | None:
    if not cfg.telegram_bot_token:
        log.warning("TELEGRAM_BOT_TOKEN not set — bot disabled")
        return None
    app = Application.builder().token(cfg.telegram_bot_token).build()
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("stop",  cmd_stop))
    app.add_handler(CommandHandler("top5",  cmd_top5))
    app.add_handler(CommandHandler("stats", cmd_stats))
    app.add_handler(CommandHandler("help",  cmd_help))
    return app
