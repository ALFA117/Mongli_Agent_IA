# Mongli_Agent_IA

> **AI-powered smart money tracking agent on Mantle Network**

[![Live Demo](https://img.shields.io/badge/Dashboard-Live-00ff88?style=flat-square&logo=vercel)](https://mongli-agent-ia.vercel.app)
[![Network](https://img.shields.io/badge/Network-Mantle-black?style=flat-square)](https://mantle.xyz)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
[![Hackathon](https://img.shields.io/badge/Turing%20Test%202026-AI%20Alpha%20%26%20Data-blue?style=flat-square)](https://dorahacks.io)
[![CI](https://github.com/ALFA117/Mongli_Agent_IA/actions/workflows/ci.yml/badge.svg)](https://github.com/ALFA117/Mongli_Agent_IA/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/Python-3.12+-blue?style=flat-square)](agent/requirements.txt)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?style=flat-square)](contracts/src/MongliSignals.sol)

---

## What it does

**Mongli_Agent_IA** is a fully autonomous on-chain intelligence agent that monitors "smart money" wallets on the Mantle Network (EVM Layer 2) in real time. It processes transaction streams using a three-model ML pipeline, identifies high-conviction wallets before major moves, and writes every signal directly to a Solidity smart contract — making AI-generated alpha permanently verifiable on-chain.

Every alert has a `keccak256` data hash of the full off-chain analysis object, enabling anyone to independently audit the agent's reasoning. Users receive instant alerts via a Telegram bot, and all signals are visualised through a public React dashboard with electric-green HUD aesthetics.

The project competes in the **AI Alpha & Data** track of Turing Test 2026 (sponsored by Mirana Ventures) and simultaneously bids for Grand Champion and Best UI/UX.

---

## Live Demo

| Resource | URL |
|---|---|
| **Dashboard** | https://mongli-agent-ia.vercel.app |
| **GitHub** | https://github.com/ALFA117/Mongli_Agent_IA |
| **Contract (Testnet)** | _(deploy pending — see below)_ |
| **Contract (Mainnet)** | _(deploy pending)_ |
| **Telegram Bot** | @MongliAgentBot _(active during hackathon)_ |

---

## Architecture

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

---

## Deployed Contract

| Network | Chain ID | Address | Explorer |
|---|---|---|---|
| Mantle Sepolia (testnet) | 5003 | _(post-deploy)_ | https://explorer.sepolia.mantle.xyz |
| Mantle Mainnet | 5000 | _(post-deploy)_ | https://explorer.mantle.xyz |

---

## How the AI works

The ML pipeline runs three complementary models on every scan:

### 1. IsolationForest — Anomaly Detection
Detects wallets whose transaction patterns are statistical outliers across 9 features. A negative decision function score indicates unusual behaviour (potential smart-money move before it's public). Parameters: `contamination=0.06`, `n_estimators=200`.

### 2. KMeans Clustering — Wallet Archetypes
Groups wallets into five archetypes:
- **retail** — low volume, infrequent
- **whale** — high volume, concentrated
- **smart_money** — DeFi-active, multi-counterparty, moderate frequency
- **bot** — high frequency, low value, repetitive
- **new_wallet** — recent first appearance

### 3. SmartMoney Score — Rule-Based Heuristic
A domain-knowledge scorer (0–100) based on:

| Signal | Max points |
|---|---|
| High avg tx value (≥$20k MNT) | 35 |
| DeFi protocol interactions | 25 |
| Tx frequency in smart range (2–15) | 15 |
| Multiple unique counterparties | 15 |
| Contract caller | 10 |

**Final confidence** = `0.55 × anomaly_score + 0.45 × smart_score`. Signals ≥70% confidence are written on-chain. The `dataHash` field (keccak256 of the full analysis JSON) makes every signal independently auditable.

---

## Setup Instructions

### Prerequisites
- Python 3.12+ · Node.js 18+ · Git

### 1 — Clone and configure

```bash
git clone https://github.com/ALFA117/Mongli_Agent_IA.git
cd Mongli_Agent_IA
cp .env.example .env
# Edit .env with your keys
```

### 2 — Install all dependencies

```bash
make install
# or manually:
pip install -r agent/requirements.txt
cd frontend && npm install
cd contracts && npm install
```

### 3 — Deploy the smart contract (Mantle Sepolia first)

```bash
# Fund wallet: https://faucet.sepolia.mantle.xyz
make deploy-testnet
# Copy CONTRACT_ADDRESS from output into your .env
```

### 4 — Run the agent

```bash
make agent
# Or with Docker:
docker compose up -d
```

### 5 — Run the dashboard locally

```bash
make frontend   # http://localhost:5173
```

### 6 — Run the REST API

```bash
make api        # http://localhost:8000/docs
```

---

## Environment Variables

See [`.env.example`](.env.example) for all variables. Key ones:

| Variable | Description |
|---|---|
| `DEPLOYER_PRIVATE_KEY` | Wallet that deploys the contract |
| `AGENT_PRIVATE_KEY` | Wallet that writes signals on-chain |
| `CONTRACT_ADDRESS` | Filled after deploy |
| `TELEGRAM_BOT_TOKEN` | From @BotFather |
| `SCAN_INTERVAL_SECONDS` | Polling interval (default: 30) |
| `MIN_CONFIDENCE_THRESHOLD` | Min confidence to write signal (default: 70) |

---

## Backtesting Results

See [`docs/backtesting_results.md`](docs/backtesting_results.md) for full methodology and signal log.

| Period | Signals | TP | FP | Accuracy |
|---|---|---|---|---|
| Testnet launch | TBD | — | — | — |

_Results auto-updated hourly by `backtesting.py`._

---

## Project Structure

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

---

## Hackathon Submission

**Track:** AI Alpha & Data (Mirana Ventures)
**Also competing:** Grand Champion · Best UI/UX · Implementation Prize (×20)

### DoraHacks Submission Checklist
- [ ] Contract deployed and verified on Mantle
- [ ] Dashboard public URL included
- [ ] GitHub repo public (MIT)
- [ ] Video demo ≥ 2 min uploaded
- [ ] Contract address in submission form

### How this answers the track questions
- **Data source:** Primary Mantle on-chain data via web3.py RPC polling
- **AI role:** Three-model pipeline (anomaly detection + clustering + scoring) with verifiable on-chain hash
- **Value on Mantle:** Signals permanently recorded on-chain via `MongliSignals.sol`, accessible to any dApp

---

*Built for Turing Test 2026 — Mantle Network Hackathon*
