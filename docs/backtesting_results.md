# Backtesting Results — Mongli_Agent_IA

> Auto-updated hourly by `agent/backtesting.py`. Last manual update: 2026-05-31.

---

## Methodology

### Signal emission
A signal is emitted when:
1. Wallet confidence ≥ 70% (blend of IsolationForest + SmartMoney score)
2. Signal is written on-chain via `MongliSignals.recordSignal()`
3. Full analysis JSON is logged locally in `agent/logs/signals.jsonl`

### Outcome classification

| Outcome | Criteria |
|---|---|
| **TP (True Positive)** | Wallet reappears within 24h with ≥ 20% higher volume |
| **FP (False Positive)** | 24h window expires without reappearance |
| **PENDING** | Still within the 24h evaluation window |

The `backtesting.py` script runs hourly, reads `signals.jsonl`, evaluates outcomes, and writes updated results back to this file.

### On-chain verification
Every signal in the log has an `on_chain_tx` hash. Verify any entry at:
```
https://explorer.sepolia.mantle.xyz/tx/<on_chain_tx>
```

Call `getSignalsByWallet(wallet)` on the deployed contract to cross-reference.

---

## Overall Results

| Metric | Value |
|---|---|
| Total signals | 0 (contract not yet deployed) |
| True Positives | — |
| False Positives | — |
| Pending | — |
| **Accuracy** | — |
| Avg Confidence | — |

_Results will populate after `make deploy-testnet` and the agent starts recording on-chain._

---

## By Signal Type

| Type | Total | TP | FP | Accuracy |
|---|---|---|---|---|
| SMART_MONEY_IN | — | — | — | — |
| WHALE_MOVE | — | — | — | — |
| ANOMALY | — | — | — | — |

---

## SmartMoney Score Distribution (mock test run)

Run `make test` to verify the pipeline locally. Sample output from mock data:

```
20 wallets analysed
8 signals generated (≥50% confidence)

[SMART_MONEY_IN] conf=71%  cluster=whale       22,811 MNT · 5 DeFi · 7 counterparties
[SMART_MONEY_IN] conf=64%  cluster=smart_money 73,973 MNT · 2 DeFi · 5 counterparties
[SMART_MONEY_IN] conf=61%  cluster=whale       26,965 MNT · 4 DeFi · 4 counterparties
[SMART_MONEY_IN] conf=55%  cluster=whale       16,641 MNT · 5 DeFi · 2 counterparties
```

---

## Signal Log (last 20)

| # | Type | Wallet | Conf | Outcome | TX |
|---|------|--------|------|---------|-----|

_Log populates after first agent run with a funded wallet._
