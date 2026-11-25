<div align="center">

<img src="frontend/public/favicon.svg" alt="Mongli Agent IA logo" width="96" />

# Mongli Agent IA

### An AI agent that flags smart-money, whale and anomaly moves on Mantle — and writes every signal on-chain with an auditable hash.

[![Live dashboard](https://img.shields.io/badge/Dashboard-mongli--agent--ia.vercel.app-0f6b4b?style=for-the-badge&logo=vercel&logoColor=white)](https://mongli-agent-ia.vercel.app)
[![Turing Test 2026](https://img.shields.io/badge/Turing_Test_2026-AI_Alpha_%26_Data-1f4fa0?style=for-the-badge)](#-hackathon)
[![CI](https://img.shields.io/github/actions/workflow/status/ALFA117/Mongli_Agent_IA/ci.yml?style=for-the-badge&label=CI)](https://github.com/ALFA117/Mongli_Agent_IA/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-555?style=for-the-badge)](LICENSE)

![Python](https://img.shields.io/badge/Python_3.12-3776AB?logo=python&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?logo=scikitlearn&logoColor=white)
![web3.py](https://img.shields.io/badge/web3.py-F16822)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![Telegram](https://img.shields.io/badge/Telegram_bot-26A5E4?logo=telegram&logoColor=white)
![Solidity](https://img.shields.io/badge/Solidity_0.8.20-363636?logo=solidity&logoColor=white)
![Hardhat](https://img.shields.io/badge/Hardhat-FFF100?logo=hardhat&logoColor=black)
![React](https://img.shields.io/badge/React_18-20232A?logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Mantle](https://img.shields.io/badge/Mantle-L2-000000)

<br/>

<img src="docs/img/hero.jpg" alt="Mongli Agent IA dashboard on a laptop and a phone: latest sample signal, signal mix and sample signal list" width="100%" />

**[▶ Open the dashboard](https://mongli-agent-ia.vercel.app)** · **[How it works](#-how-it-works)** · **[Run it](#-run-it-locally)** · **[AI pipeline](docs/ai-pipeline.md)**

</div>

---

> [!IMPORTANT]
> **Current status: demo data.** The `MongliSignals` contract is not deployed yet, so the public dashboard runs on a **sample set of signals** — wallets and hashes are placeholders, not Mantle records. Every screen says so with a *Demo* banner. The agent, contract and API are in this repo and run locally; deployment steps are tracked in [PENDING.md](PENDING.md).

## 🎯 The problem

On-chain "alpha" bots tell you a wallet is smart money, but you can't check *why* they said it or *when*. Their calls are off-chain and can be rewritten after the fact.

## 💡 The idea

An autonomous agent polls Mantle every 30 s, builds a 9-feature profile per wallet, scores it with three models and, when confidence is **≥ 70 %**, calls `recordSignal(wallet, type, confidence, dataHash)` on a Solidity contract. The `dataHash` is the `keccak256` of the full off-chain analysis, so anyone can later check that the reasoning shown matches what was recorded on-chain.

```
Signal #24 · SMART_MONEY_IN · 93 %
"Wallet classified as smart_money. Moved 73,973 MNT across 2 txs. Interacted with 4 DeFi
 protocol(s). Reached 6 unique counterparties. SmartMoney score: 88/100."
```
<sub>Example from the dashboard's sample set.</sub>

## ✨ The dashboard

<table>
<tr>
<td width="50%"><img src="docs/img/modal.jpg" alt="Signal details modal: Smart Money In, 93 percent confidence, agent reasoning, target wallet and data hash" /><p align="center"><sub><b>Signal details:</b> confidence, the agent's reasoning, wallet and data hash.</sub></p></td>
<td width="50%"><img src="docs/img/wallet.jpg" alt="Wallet explorer: a sample wallet with SmartMoney score 80, 5 signals, 88 percent average confidence and its signal history" /><p align="center"><sub><b>Wallet explorer:</b> SmartMoney score ring and full history; supports <code>?address=</code> deep links.</sub></p></td>
</tr>
<tr>
<td width="50%"><img src="docs/img/analytics.jpg" alt="Analytics: key figures, signal activity per day, breakdown by type, confidence bands and most-flagged wallets" /><p align="center"><sub><b>Analytics:</b> activity, type mix, confidence bands and most-flagged wallets (24h / 7d / 30d).</sub></p></td>
<td width="50%"><img src="docs/img/tres.jpg" alt="Three phones: live feed, signal details and analytics" /><p align="center"><sub><b>Mobile:</b> bottom tab bar for Feed, Wallets and Analytics.</sub></p></td>
</tr>
</table>

## 🧠 How it works

```mermaid
flowchart LR
    M["Mantle RPC"] -->|every 30 s| C["collector.py: 9 features per wallet"]
    C --> ML["ml_engine.py"]
    ML --> IF["IsolationForest: anomaly"]
    ML --> KM["KMeans: 5 archetypes"]
    ML --> SS["SmartMoney score 0-100"]
    IF --> B["Blend: 55 pct anomaly, 45 pct score"]
    SS --> B
    B -->|confidence 70 or more| W["signal_writer.py"]
    W --> SC["MongliSignals.sol on Mantle"]
    W --> T["Telegram bot"]
    SC --> API["FastAPI"]
    API --> D["React dashboard"]
```

| Model | Role |
|:--|:--|
| **IsolationForest** (`n=200`, `contamination=0.06`) | Flags wallets whose patterns are statistical outliers |
| **KMeans** (`k=5`) | Archetype: retail · whale · smart_money · bot · new_wallet |
| **SmartMoney score** | Rule-based 0–100: avg tx value, DeFi interactions, frequency, counterparties, contract calls |

Details, the full original diagram and the project tree: **[docs/ai-pipeline.md](docs/ai-pipeline.md)** · [docs/architecture.md](docs/architecture.md) · backtesting method: [docs/backtesting_results.md](docs/backtesting_results.md).

## 🛠️ Stack

| Layer | Technology |
|:--|:--|
| Agent | Python 3.12 · web3.py · pandas · NumPy · scikit-learn · APScheduler |
| API & alerts | FastAPI (`/signals`, `/signals/{wallet}`, `/stats`) · python-telegram-bot (`/top5`, `/stats`, …) |
| Contract | Solidity 0.8.20 (`MongliSignals.sol`) · Hardhat · Mantle Sepolia (5003) / Mainnet (5000) |
| Dashboard | React 18 · Vite · Tailwind CSS · Recharts · ethers · React Router |
| Ops | Docker Compose · Fly.io config · GitHub Actions (pytest, Hardhat tests, Vite build) · Vercel |

## ⛓️ Contract

| Network | Chain ID | Address |
|:--|:--:|:--|
| Mantle Sepolia (testnet) | 5003 | *not deployed yet* |
| Mantle Mainnet | 5000 | *not deployed yet* |

## 🚀 Run it locally

```bash
git clone https://github.com/ALFA117/Mongli_Agent_IA.git
cd Mongli_Agent_IA
cp .env.example .env      # fill in your keys
make install              # Python + frontend + contracts deps
```

<details>
<summary><b>Deploy, agent, API and dashboard</b></summary>

```bash
make deploy-testnet   # deploy MongliSignals to Mantle Sepolia (fund the wallet at faucet.sepolia.mantle.xyz first)
make agent            # run the agent (or: docker compose up -d)
make api              # FastAPI at http://localhost:8000/docs
make frontend         # dashboard at http://localhost:5173
make test             # agent smoke test (CI also runs pytest and Hardhat tests)
```

| Variable | Description |
|:--|:--|
| `DEPLOYER_PRIVATE_KEY` | Wallet that deploys the contract |
| `AGENT_PRIVATE_KEY` | Wallet that writes signals on-chain |
| `CONTRACT_ADDRESS` | Filled after deploy |
| `TELEGRAM_BOT_TOKEN` | From @BotFather |
| `SCAN_INTERVAL_SECONDS` | Polling interval (default: 30) |
| `MIN_CONFIDENCE_THRESHOLD` | Min confidence to write a signal (default: 70) |

All variables: [`.env.example`](.env.example). Without `VITE_CONTRACT_ADDRESS` the dashboard runs in demo mode.

</details>

## 🏆 Hackathon

Built for **Turing Test 2026** (Mantle Network) — **AI Alpha & Data** track. Submission draft: [SUBMISSION.md](SUBMISSION.md) · remaining steps: [PENDING.md](PENDING.md) · contributing: [CONTRIBUTING.md](CONTRIBUTING.md).

## 📄 License

[MIT](LICENSE)

---

<div align="center">

**AI-generated alpha you can audit.**

</div>
