#!/usr/bin/env python
"""
Mongli_Agent_IA CLI - test and demo each module independently.

Usage:
  python cli.py collect  [--blocks N]   Collect wallet features from Mantle RPC
  python cli.py analyze  [--mock]        Run ML pipeline (use --mock for offline)
  python cli.py signal                   Generate + write one test signal (dry-run)
  python cli.py backtest                 Evaluate signal log outcomes
  python cli.py api      [--port N]      Start the FastAPI server
"""
import argparse
import logging
import sys

logging.basicConfig(
    level=logging.WARNING,
    format="%(levelname)s %(name)s - %(message)s",
)


# ── Commands ─────────────────────────────────────────────────────────────────

def cmd_collect(args):
    from collector import MantleCollector
    from config import cfg

    print(f"\n{'-'*58}")
    print(f"  Mongli Collector")
    print(f"  RPC     : {cfg.active_rpc}")
    print(f"  Scanning: last {args.blocks} blocks")
    print(f"{'-'*58}")

    c  = MantleCollector()
    df = c.collect(blocks=args.blocks)

    if df.empty:
        print("  No transactions found in the scanned blocks.\n")
        return

    print(f"  Wallets : {len(df)}")
    print(f"  Whales  : {(df['total_volume_mnt'] >= cfg.whale_threshold).sum()}")
    print()

    cols = ["address", "total_volume_mnt", "tx_count", "defi_interactions", "is_contract_caller"]
    print(df[cols].to_string(index=False))
    print()


def cmd_analyze(args):
    from collector import MantleCollector
    from ml_engine import MLEngine

    c  = MantleCollector()
    ml = MLEngine()

    if args.mock:
        df = c._mock_features()
        source = "mock data"
    else:
        df = c.collect()
        source = "live RPC"

    signals = ml.analyze(df)

    print(f"\n{'-'*58}")
    print(f"  Mongli ML Engine  [{source}]")
    print(f"  Input   : {len(df)} wallets")
    print(f"  Signals : {len(signals)} (confidence >= 50%)")
    print(f"{'-'*58}")

    for s in signals:
        bar  = "#" * (s["confidence"] // 10) + "." * (10 - s["confidence"] // 10)
        addr = f"{s['wallet'][:8]}...{s['wallet'][-4:]}"
        print(f"  [{s['signal_type']:18}] {bar} {s['confidence']:3}%  {addr}  ({s['cluster']})")

    if not signals:
        print("  No qualifying signals generated.\n")
    else:
        print(f"\n  Best: {max(signals, key=lambda x: x['confidence'])['signal_type']} "
              f"({max(s['confidence'] for s in signals)}% confidence)")
    print()


def cmd_signal(args):
    from collector import MantleCollector
    from ml_engine import MLEngine
    from signal_writer import SignalWriter

    c  = MantleCollector()
    ml = MLEngine()
    w  = SignalWriter()

    df      = c._mock_features()
    signals = ml.analyze(df)

    if not signals:
        print("\n  No signals generated from mock data.\n")
        return

    best   = max(signals, key=lambda s: s["confidence"])
    result = w.write(best)

    print(f"\n{'-'*58}")
    print(f"  Mongli Signal Emitted")
    print(f"{'-'*58}")
    print(f"  Type        : {best['signal_type']}")
    print(f"  Wallet      : {best['wallet'][:12]}...{best['wallet'][-4:]}")
    print(f"  Confidence  : {best['confidence']}%")
    print(f"  Cluster     : {best['cluster']}")
    print(f"  TX / mode   : {result or 'dry-run (no key configured)'}")
    print(f"  Hash        : {best['on_chain_hash'][:22]}...")
    print(f"  Reasoning   : {best['reasoning'][:70]}...")
    print(f"{'-'*58}")
    print(f"  Log written to: agent/logs/signals.jsonl\n")


def cmd_backtest(args):
    from backtesting import run_backtest

    print(f"\n{'-'*58}")
    print(f"  Mongli Backtesting")
    print(f"{'-'*58}")

    stats = run_backtest()
    if not stats:
        print("  No signals in log yet. Run: python cli.py signal\n")
        return

    print(f"  Total signals : {stats['total']}")
    print(f"  True Positive : {stats['tp']}")
    print(f"  False Positive: {stats['fp']}")
    print(f"  Pending       : {stats['pending']}")
    print(f"  Accuracy      : {stats['accuracy']}%")
    print(f"  Avg Confidence: {stats['avg_confidence']}%")
    print()
    for t, d in stats["by_type"].items():
        acc = f"{round(d['tp']/(d['tp']+d['fp'])*100,1)}%" if (d['tp']+d['fp'])>0 else "-"
        print(f"  {t:20} total={d['total']:3}  tp={d['tp']}  fp={d['fp']}  acc={acc}")
    print()


def cmd_api(args):
    import uvicorn
    from api import app

    print(f"\n{'-'*58}")
    print(f"  Mongli FastAPI")
    print(f"  http://0.0.0.0:{args.port}")
    print(f"  Docs: http://localhost:{args.port}/docs")
    print(f"{'-'*58}\n")

    uvicorn.run(app, host="0.0.0.0", port=args.port, log_level="info")


# ── Entrypoint ────────────────────────────────────────────────────────────────

def main():
    p = argparse.ArgumentParser(
        prog="python cli.py",
        description="Mongli_Agent_IA - test each module from the terminal",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
examples:
  python cli.py collect --blocks 10   scan 10 blocks from Mantle Sepolia
  python cli.py analyze --mock        run ML on generated mock data
  python cli.py signal                emit one signal (dry-run if no key)
  python cli.py backtest              evaluate signal log accuracy
  python cli.py api --port 8000       start REST API server
        """,
    )
    sub = p.add_subparsers(dest="cmd", required=True)

    p_collect = sub.add_parser("collect", help="Collect wallet features from Mantle RPC")
    p_collect.add_argument("--blocks", type=int, default=5, metavar="N")
    p_collect.set_defaults(func=cmd_collect)

    p_analyze = sub.add_parser("analyze", help="Run ML pipeline on collected/mock data")
    p_analyze.add_argument("--mock", action="store_true", help="Use generated mock data instead of live RPC")
    p_analyze.set_defaults(func=cmd_analyze)

    p_signal = sub.add_parser("signal", help="Generate and emit one test signal")
    p_signal.set_defaults(func=cmd_signal)

    p_backtest = sub.add_parser("backtest", help="Run backtesting analysis on signal log")
    p_backtest.set_defaults(func=cmd_backtest)

    p_api = sub.add_parser("api", help="Start the FastAPI server")
    p_api.add_argument("--port", type=int, default=8000)
    p_api.set_defaults(func=cmd_api)

    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
