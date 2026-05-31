# Technical Architecture — Mongli_Agent_IA

## Overview

Three decoupled layers. Each runs independently and communicates via the Mantle blockchain and a local JSONL log.

```
Layer 1: Smart Contract  (Mantle EVM)
Layer 2: Python Agent    (cloud / local)
Layer 3: React Dashboard (Vercel)
```

---

## Layer 1 — Smart Contract

**File:** `contracts/src/MongliSignals.sol`
**Compiler:** Solidity 0.8.20, EVM target: paris
**Optimizer:** enabled, 200 runs

### Storage layout

```solidity
struct Signal {
    uint256 id;
    address targetWallet;
    string  signalType;       // "SMART_MONEY_IN" | "WHALE_MOVE" | "ANOMALY"
    uint256 confidenceScore;  // 0–100
    bytes32 dataHash;         // keccak256 of off-chain analysis JSON
    uint256 timestamp;        // block.timestamp
}

Signal[]                          private _signals;
mapping(address => uint256[])     private _signalsByWallet;
```

### Access control

`onlyAgent` modifier on `recordSignal()` — only the wallet set at deployment can write. All read functions are public.

### Events

```solidity
event SignalRecorded(
    uint256 indexed signalId,
    address indexed targetWallet,
    string  signalType,
    uint256 confidenceScore
);
```

---

## Layer 2 — Python Agent

### Module dependency graph

```
main.py
  ├── config.py          (env vars, paths, DeFi addresses)
  ├── collector.py       (Mantle RPC → DataFrame)
  │     └── web3.py
  ├── ml_engine.py       (DataFrame → signals)
  │     ├── sklearn.IsolationForest
  │     ├── sklearn.KMeans
  │     └── SmartMoneyScore (heuristic)
  ├── signal_writer.py   (signals → MongliSignals.sol)
  │     └── web3.py
  ├── telegram_bot.py    (signals → subscribers)
  │     └── python-telegram-bot
  ├── api.py             (JSONL log → REST)
  │     └── FastAPI
  └── backtesting.py     (JSONL log → TP/FP → docs/)
```

### Scheduler jobs (APScheduler)

| Job | Interval | What |
|---|---|---|
| `scan()` | 30s | collect → ML → write → alert |
| `run_backtest()` | 1h | evaluate outcomes, update docs |

### Feature engineering (9 features per wallet)

| Feature | Type | Description |
|---|---|---|
| `tx_count` | int | Number of transactions in scan window |
| `total_volume_mnt` | float | Sum of all transaction values (MNT) |
| `max_single_tx` | float | Largest single transaction value |
| `avg_tx_value` | float | total_volume / tx_count |
| `unique_counterparties` | int | Distinct `to` addresses |
| `defi_interactions` | int | Txs to known DeFi protocol addresses |
| `gas_used_avg` | float | Average gas used |
| `is_contract_caller` | bool | Any tx has non-trivial calldata |
| `volume_concentration` | float | max_single_tx / total_volume (0–1) |

### Signal classification logic

```python
if smart_score >= 60 and cluster in ("smart_money", "whale"):
    signal_type = "SMART_MONEY_IN"
elif total_volume >= whale_threshold × 3:
    signal_type = "WHALE_MOVE"
elif anomaly_score < -0.15:
    signal_type = "ANOMALY"
elif smart_score >= 45:
    signal_type = "SMART_MONEY_IN"
else:
    signal_type = "ANOMALY"
```

### Confidence blending

```
confidence = 0.55 × anomaly_confidence + 0.45 × smart_money_score

Anomaly confidence:
  IsolationForest score ∈ [-0.5, 0.5] → mapped to [90, 10]
  (more negative = more anomalous = higher confidence)

Smart Money Score (0–100):
  avg_tx_value ≥ 20k MNT  → +35
  defi_interactions ≥ 3   → +25
  tx_count ∈ [2, 15]      → +15
  unique_counterparties ≥ 4 → +15
  is_contract_caller       → +10

Cluster bonus:
  cluster == "smart_money" → × 1.12
  cluster == "bot"         → × 0.70
```

---

## Layer 3 — React Dashboard

**URL:** https://mongli-agent-ia.vercel.app
**Stack:** React 18 + Vite 5 + Tailwind CSS 3 + Recharts 2 + ethers.js 6

### Data flow

```
ethers.JsonRpcProvider(MANTLE_RPC)
  → MongliSignals.getRecentSignals(20)
  → normalize → state
  → render (auto-refresh 30s)
```

### Pages

| Route | Component | Data source |
|---|---|---|
| `/` | LiveFeed | `getRecentSignals(20)` + `totalSignals()` |
| `/wallet` | WalletExplorer | `getSignalsByWallet(addr)` |
| `/analytics` | Analytics | `getRecentSignals(100)` |

### Design system tokens

| Token | Value | Use |
|---|---|---|
| `accent` | `#00ff88` | Smart money signals, primary CTA |
| `sig-whale` | `#38bdf8` | Whale move signals |
| `sig-anomaly` | `#fbbf24` | Anomaly signals |
| `base` | `#020d18` | Body background |
| Font display | Orbitron 600–900 | Headings, stat numbers |
| Font mono | JetBrains Mono 400–600 | All data, addresses, labels |

---

## Network Configuration

| Parameter | Testnet | Mainnet |
|---|---|---|
| Chain ID | 5003 | 5000 |
| RPC | https://rpc.sepolia.mantle.xyz | https://rpc.mantle.xyz |
| Explorer | https://explorer.sepolia.mantle.xyz | https://explorer.mantle.xyz |
| Native token | MNT | MNT |

---

## Security Model

- `AGENT_PRIVATE_KEY` never exposed in frontend; only used by `signal_writer.py`
- `onlyAgent` modifier prevents unauthorised signal injection on-chain
- `dataHash` is SHA-256 of full analysis JSON — tamper-evident audit trail
- `.env` is gitignored; all secrets documented via `.env.example` only
- Docker container runs as non-root (Python 3.12-slim base)
