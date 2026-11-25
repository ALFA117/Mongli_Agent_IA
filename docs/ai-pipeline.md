# How the AI works

Moved from the main [README](../README.md). See also [architecture.md](architecture.md) and [backtesting_results.md](backtesting_results.md).

The ML pipeline runs three complementary models on every scan:

## 1. IsolationForest — Anomaly Detection
Detects wallets whose transaction patterns are statistical outliers across 9 features. A negative decision function score indicates unusual behaviour (potential smart-money move before it's public). Parameters: `contamination=0.06`, `n_estimators=200`.

## 2. KMeans Clustering — Wallet Archetypes
Groups wallets into five archetypes:
- **retail** — low volume, infrequent
- **whale** — high volume, concentrated
- **smart_money** — DeFi-active, multi-counterparty, moderate frequency
- **bot** — high frequency, low value, repetitive
- **new_wallet** — recent first appearance

## 3. SmartMoney Score — Rule-Based Heuristic
A domain-knowledge scorer (0–100) based on:

| Signal | Max points |
|---|---|
| High avg tx value (≥$20k MNT) | 35 |
| DeFi protocol interactions | 25 |
| Tx frequency in smart range (2–15) | 15 |
| Multiple unique counterparties | 15 |
| Contract caller | 10 |

**Final confidence** = `0.55 × anomaly_score + 0.45 × smart_score`. Signals ≥70% confidence are written on-chain. The `dataHash` field (keccak256 of the full analysis JSON) makes every signal independently auditable.

## Original architecture diagram


```
┌─────────────────────────────────────────────────────────────────────┐
│                         MANTLE NETWORK                              │
│  Blocks · Transactions · DeFi Protocol Events                       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  web3.py  (every 30s)
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  collector.py   — 9-feature wallet DataFrame                         │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ tx_count · total_volume_mnt · max_single_tx · avg_tx_value   │   │
│  │ unique_counterparties · defi_interactions · gas_used_avg      │   │
│  │ is_contract_caller · volume_concentration                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ml_engine.py — Three-model pipeline                                │
│                                                                     │
│  1. IsolationForest(n=200, contamination=0.06)                      │
│     → Anomaly score: outlier wallets with unusual patterns          │
│                                                                     │
│  2. KMeans(k=5)                                                     │
│     → Cluster: retail · whale · smart_money · bot · new_wallet      │
│                                                                     │
│  3. SmartMoney Score (rule-based heuristic, 0–100)                  │
│     → Position size + DeFi interaction + counterparties + timing    │
│                                                                     │
│  Blend: 55% anomaly × 45% smart score → final confidence (0–100)   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  confidence ≥ 70%
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  signal_writer.py  →  MongliSignals.sol  (on Mantle)                │
│  recordSignal(wallet, signalType, confidence, dataHash)             │
│  SignalRecorded event emitted · timestamp stored on-chain           │
└──────┬──────────────────────────────────────────┬───────────────────┘
       │                                          │
       ▼                                          ▼
┌──────────────┐                     ┌────────────────────────────────┐
│ telegram_bot │  → live alerts      │  FastAPI  (port 8000)          │
│ /top5 /stats │    to subscribers   │  GET /signals · /stats         │
└──────────────┘                     └────────────────┬───────────────┘
                                                      │
                                                      ▼
                                     ┌────────────────────────────────┐
                                     │  React Dashboard  (Vercel)     │
                                     │  LiveFeed · WalletExplorer     │
                                     │  Analytics · SVG Score Ring    │
                                     └────────────────────────────────┘
```


## Project structure


```
Mongli_Agent_IA/
├── agent/
│   ├── config.py           ← Centralized settings from .env
│   ├── collector.py        ← Mantle RPC polling, 9-feature extraction
│   ├── ml_engine.py        ← IsolationForest + KMeans + SmartMoney Score
│   ├── signal_writer.py    ← On-chain signal recording
│   ├── telegram_bot.py     ← Subscriber alerts
│   ├── api.py              ← FastAPI REST endpoints
│   ├── backtesting.py      ← TP/FP evaluation
│   ├── main.py             ← Entry point + scheduler
│   └── Dockerfile
├── contracts/
│   ├── src/MongliSignals.sol  ← Signal registry on Mantle
│   ├── hardhat.config.js
│   └── scripts/deploy.js
├── frontend/               ← React + Vite + Tailwind HUD dashboard
├── docs/
│   ├── architecture.md
│   └── backtesting_results.md
├── docker-compose.yml
├── Makefile
└── .env.example
```


