# Backtesting Results — Mongli_Agent_IA

> This document records historical signal performance to demonstrate the agent's alpha-generation capability. Updated after each testnet run.

---

## Methodology

Each signal emitted by the agent is logged locally in `agent/logs/signals.jsonl` with:
- `timestamp` — UTC time of signal emission
- `wallet` — target wallet address
- `signal_type` — SMART_MONEY_IN / WHALE_MOVE / ANOMALY
- `confidence` — model score (0–100)
- `reasoning` — human-readable explanation
- `on_chain_tx` — transaction hash of the `recordSignal()` call
- `outcome` — `TP` / `FP` / `PENDING` (filled in after 24h)

A signal is marked **True Positive (TP)** if the monitored wallet shows a measurable directional move (≥5% token price or ≥20% volume spike) within 24 hours of the signal. Otherwise **False Positive (FP)**.

---

## Results by period

### Testnet — Mantle Sepolia

| Date | Signals | TP | FP | Pending | Accuracy |
|---|---|---|---|---|---|
| _(run not yet started)_ | — | — | — | — | — |

### Mainnet — Mantle (submit period)

| Date | Signals | TP | FP | Pending | Accuracy |
|---|---|---|---|---|---|
| _(deploy pending)_ | — | — | — | — | — |

---

## Signal log (sample)

```jsonl
{"timestamp":"","wallet":"","signal_type":"","confidence":0,"reasoning":"","on_chain_tx":"","outcome":"PENDING"}
```

_(Populated after first agent run)_

---

## Verification

Every signal in this table has a corresponding on-chain entry readable at:

```
https://explorer.mantle.xyz/address/<CONTRACT_ADDRESS>
```

Call `getSignalsByWallet(wallet)` or `getRecentSignals(N)` to verify any entry independently.
