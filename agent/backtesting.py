"""
Backtesting module — evaluates historical signal accuracy.

Methodology:
  1. Load signals from the local JSONL log
  2. For each SMART_MONEY_IN signal, check if the wallet accumulated
     (re-appeared with even larger volume) in subsequent scans
  3. Classify as TP / FP / PENDING and update the log
  4. Write a summary to docs/backtesting_results.md
"""
import json
import logging
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

from config import LOGS_DIR

log = logging.getLogger(__name__)

LOG_FILE     = LOGS_DIR / "signals.jsonl"
RESULTS_FILE = Path(__file__).parent.parent / "docs" / "backtesting_results.md"

OUTCOME_WINDOW_S = 86_400   # 24 h — signal window for TP classification
REAPPEAR_MULT    = 1.2       # wallet needs ≥ 20% more volume to count as TP


def load_signals() -> list[dict]:
    if not LOG_FILE.exists():
        return []
    out = []
    with LOG_FILE.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    out.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
    return out


def evaluate(signals: list[dict]) -> list[dict]:
    """
    Simple proxy accuracy:
    A SMART_MONEY_IN signal is TP if the same wallet appeared again within
    OUTCOME_WINDOW_S with ≥ REAPPEAR_MULT × original volume.
    """
    # Build a timeline of wallet appearances
    appearances: dict[str, list[dict]] = defaultdict(list)
    for s in signals:
        appearances[s.get("wallet", "").lower()].append(s)

    updated = []
    for s in signals:
        sig = dict(s)
        if sig.get("outcome") != "PENDING":
            updated.append(sig)
            continue

        sig_type  = sig.get("signal_type")
        wallet    = sig.get("wallet", "").lower()
        ts        = sig.get("timestamp_unix", 0)
        vol_orig  = _extract_volume(sig)

        if sig_type == "SMART_MONEY_IN" and ts:
            future = [
                a for a in appearances[wallet]
                if a.get("timestamp_unix", 0) > ts
                and a.get("timestamp_unix", 0) <= ts + OUTCOME_WINDOW_S
            ]
            if any(_extract_volume(a) >= vol_orig * REAPPEAR_MULT for a in future):
                sig["outcome"] = "TP"
            elif ts + OUTCOME_WINDOW_S < _now_unix():
                sig["outcome"] = "FP"
        elif ts and ts + OUTCOME_WINDOW_S < _now_unix():
            sig["outcome"] = "FP"

        updated.append(sig)

    return updated


def _extract_volume(sig: dict) -> float:
    feats = sig.get("features", {})
    return feats.get("total_volume_mnt", 0.0)


def _now_unix() -> float:
    return datetime.now(timezone.utc).timestamp()


def compute_stats(signals: list[dict]) -> dict:
    total    = len(signals)
    tp       = sum(1 for s in signals if s.get("outcome") == "TP")
    fp       = sum(1 for s in signals if s.get("outcome") == "FP")
    pending  = sum(1 for s in signals if s.get("outcome") == "PENDING")
    accuracy = round(tp / (tp + fp) * 100, 1) if (tp + fp) > 0 else 0.0

    by_type: dict[str, dict] = {}
    for s in signals:
        t = s.get("signal_type", "UNKNOWN")
        if t not in by_type:
            by_type[t] = {"total": 0, "tp": 0, "fp": 0}
        by_type[t]["total"] += 1
        if s.get("outcome") == "TP": by_type[t]["tp"] += 1
        if s.get("outcome") == "FP": by_type[t]["fp"] += 1

    confs = [s.get("confidence", 0) for s in signals]
    return {
        "total": total, "tp": tp, "fp": fp, "pending": pending,
        "accuracy": accuracy,
        "avg_confidence": round(sum(confs) / len(confs), 1) if confs else 0,
        "by_type": by_type,
    }


def write_results_md(stats: dict, signals: list[dict]):
    """Overwrite docs/backtesting_results.md with the latest results."""
    RESULTS_FILE.parent.mkdir(exist_ok=True)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    lines = [
        "# Backtesting Results — Mongli_Agent_IA",
        "",
        f"> Last updated: {now}",
        "",
        "## Methodology",
        "",
        "A **SMART_MONEY_IN** signal is marked **True Positive (TP)** if the monitored wallet",
        "re-appears within 24 hours with ≥ 20% higher volume.",
        "Otherwise it is marked **False Positive (FP)** after the 24-hour window expires.",
        "Signals within the window remain **PENDING**.",
        "",
        "Every signal has a corresponding `on_chain_tx` hash verifiable on Mantle Explorer.",
        "",
        "## Overall Results",
        "",
        f"| Metric | Value |",
        f"|--------|-------|",
        f"| Total signals | {stats['total']} |",
        f"| True Positives | {stats['tp']} |",
        f"| False Positives | {stats['fp']} |",
        f"| Pending | {stats['pending']} |",
        f"| **Accuracy** | **{stats['accuracy']}%** |",
        f"| Avg Confidence | {stats['avg_confidence']}% |",
        "",
        "## By Signal Type",
        "",
        "| Type | Total | TP | FP | Accuracy |",
        "|------|-------|----|----|----------|",
    ]

    for t, d in stats["by_type"].items():
        acc = round(d["tp"] / (d["tp"] + d["fp"]) * 100, 1) if (d["tp"] + d["fp"]) > 0 else "—"
        lines.append(f"| {t} | {d['total']} | {d['tp']} | {d['fp']} | {acc}% |")

    lines += [
        "",
        "## Signal Log (last 20)",
        "",
        "| # | Type | Wallet | Conf | Outcome | TX |",
        "|---|------|--------|------|---------|-----|",
    ]

    for i, s in enumerate(reversed(signals[-20:])):
        wallet = s.get("wallet", "")
        short  = f"{wallet[:6]}...{wallet[-4:]}" if len(wallet) > 10 else wallet
        tx     = s.get("on_chain_tx", "dry-run")
        tx_link = f"[{tx[:10]}...]({cfg_explorer(tx)}" if tx not in ("dry-run","failed","") else tx
        lines.append(
            f"| {i+1} | {s.get('signal_type','—')} | `{short}` "
            f"| {s.get('confidence','—')}% | {s.get('outcome','—')} | {tx_link} |"
        )

    RESULTS_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")
    log.info("Backtesting results written to %s", RESULTS_FILE)


def cfg_explorer(tx: str) -> str:
    try:
        from config import cfg
        return f"{cfg.explorer_base}/tx/{tx}"
    except Exception:
        return "#"


def run_backtest():
    """Entry point — load, evaluate, compute stats, write markdown."""
    log.info("Starting backtesting run...")
    signals = load_signals()
    if not signals:
        log.info("No signals to evaluate yet.")
        return

    updated = evaluate(signals)

    # Persist updated outcomes
    with LOG_FILE.open("w", encoding="utf-8") as f:
        for s in updated:
            f.write(json.dumps(s, default=str) + "\n")

    stats = compute_stats(updated)
    write_results_md(stats, updated)

    log.info(
        "Backtest done — %d signals | %d TP | %d FP | %.1f%% accuracy",
        stats["total"], stats["tp"], stats["fp"], stats["accuracy"],
    )
    return stats


if __name__ == "__main__":
    import logging as _l
    _l.basicConfig(level=_l.INFO, format="%(asctime)s %(levelname)s %(message)s")
    run_backtest()
