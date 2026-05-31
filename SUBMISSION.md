# DoraHacks Submission — Mongli_Agent_IA
## Turing Test 2026 · Mantle Network Hackathon

> Copy-paste this content into the DoraHacks submission form.
> Fill in the `[PENDING]` fields after deploying the contract.

---

## Project Name
Mongli_Agent_IA

## Short Description (≤150 chars)
AI agent that detects smart money moves on Mantle Network in real time and records every signal permanently on-chain with a verifiable hash.

## Full Description

**Mongli_Agent_IA** is a fully autonomous on-chain intelligence agent for the Mantle Network. It continuously monitors wallet activity, runs a three-model ML pipeline to identify "smart money" behaviour, and writes every signal to a Solidity smart contract — making AI-generated alpha permanently auditable on-chain.

**What makes it unique:**
Every alert includes a `keccak256` hash of the full off-chain analysis JSON. Anyone can independently verify the agent's reasoning by comparing the hash stored on-chain with the source data. This is AI transparency at the protocol level.

**Technical stack:**
- **Data:** Mantle RPC (web3.py) — primary on-chain source
- **ML Pipeline:** IsolationForest (n=200, contamination=0.06) + KMeans (k=5) + rule-based SmartMoney Score heuristic
- **On-chain:** MongliSignals.sol — signal registry verified on Mantle
- **Alerts:** Telegram bot, FastAPI REST, React dashboard

---

## Demo & Links

| Resource | URL |
|---|---|
| Dashboard | https://mongli-agent-ia.vercel.app |
| GitHub | https://github.com/ALFA117/Mongli_Agent_IA |
| Contract (Testnet) | `[PENDING — add after deploy-testnet]` |
| Contract (Mainnet) | `[PENDING — add after deploy-mainnet]` |
| Video Demo | `[PENDING — upload to YouTube/Loom]` |

---

## Track Selection

- [x] **AI Alpha & Data** (Mirana Ventures) — primary track
- [x] **Implementation Prize** (×20 slots) — contract deployed on Mantle
- [x] **Grand Champion** — aspirational, cross-track
- [x] **Best UI/UX** — HUD glassmorphism dashboard

---

## Track-Specific Questions (AI Alpha & Data)

### What data sources does the project use?
**Primary:** Mantle Network on-chain data via web3.py RPC polling.
- Transaction data: sender, receiver, value, gas, calldata
- 9 features extracted per wallet per scan window
- Polling interval: 30 seconds (configurable)
- Protocol detection: Merchant Moe, Agni Finance, Fluxion AMM

No external price feeds or centralised APIs are used as primary data sources.

### What role does AI play?
A three-model ML pipeline runs on every scan:

1. **IsolationForest** (`n_estimators=200, contamination=0.06`) — statistical outlier detection across 9 on-chain features
2. **KMeans** (`k=5`) — wallet archetype clustering (retail / whale / smart_money / bot / new_wallet)
3. **SmartMoney Score** — rule-based heuristic (0–100) scoring position size, DeFi interaction, counterparty diversity, and protocol usage

Final confidence = `0.55 × anomaly_score + 0.45 × smart_score`. Only signals ≥70% are written on-chain.

Models are persisted with joblib and retrained on new data each hour.

### How does the project generate verifiable value on Mantle?
Every signal is stored on `MongliSignals.sol` with:
- `wallet` address that triggered the signal
- `signalType` (SMART_MONEY_IN / WHALE_MOVE / ANOMALY)
- `confidenceScore` (0–100)
- `dataHash` — `keccak256` of the full off-chain analysis JSON

This creates a permanent, tamper-evident audit trail. Any dApp, researcher, or trader can call `getSignalsByWallet()` or `getRecentSignals()` to query the agent's intelligence history directly from the blockchain.

### How does the project contribute to the Mantle ecosystem?
1. **Liquidity intelligence** — identifies smart money flows before they move markets
2. **Open protocol** — MongliSignals.sol is publicly callable; other dApps can integrate
3. **Trust layer** — verifiable AI signals improve trader confidence in on-chain data
4. **MIT licensed** — fully open source for community forking and improvement

---

## Contract Address

- **Testnet (Mantle Sepolia, chain 5003):** `[PENDING]`
- **Mainnet (Mantle, chain 5000):** `[PENDING]`
- **Explorer:** https://explorer.mantle.xyz

---

## Implementation Checklist

- [ ] Smart contract deployed on Mantle Mainnet or Testnet
- [ ] Contract verified on Mantle Explorer
- [ ] At least one AI-invocable on-chain function (`recordSignal`)
- [ ] Public frontend demo
- [ ] Contract address in this submission
- [ ] Video demo ≥ 2 minutes
- [ ] Public GitHub repository (MIT license)

---

## Video Script Outline (2-minute demo)

```
[0:00–0:15]  Opening — Dashboard URL, show the live HUD
[0:15–0:40]  Live Feed — scroll through signals, explain confidence scores
[0:40–1:00]  Wallet Explorer — enter a sample address, show SmartMoney Score ring
[1:00–1:20]  Analytics — show charts, explain the ML breakdown
[1:20–1:40]  Contract on Mantle Explorer — show MongliSignals.sol, call getRecentSignals()
[1:40–2:00]  Architecture overview — show README diagram, explain 3-layer system
```

---

*Mongli_Agent_IA — Built for Turing Test 2026, Mantle Network*
