# Architecture — Mongli_Agent_IA

## System overview

Mongli_Agent_IA is a three-layer system: a Solidity contract layer on Mantle, a Python agent layer, and a React frontend layer. All layers are independently deployable and testable.

---

## Component breakdown

### Layer 1 — Smart Contract (`contracts/MongliSignals.sol`)

The source of truth for all AI-generated signals. Deployed on Mantle Mainnet / Sepolia Testnet.

| Function | Description |
|---|---|
| `recordSignal()` | Writes a new signal on-chain. Only callable by the agent wallet. |
| `getSignalsByWallet()` | Returns all signals associated with a wallet address. |
| `getRecentSignals()` | Returns the latest N global signals. |
| `getAgentStats()` | Returns total signals and tracked accuracy. |

Events emitted: `SignalRecorded(uint256 indexed signalId, address indexed wallet, string signalType, uint256 confidence)`

Access control: `onlyAgent` modifier — only the address set at deploy time can write signals.

---

### Layer 2 — Python Agent (`agent/`)

Runs as a daemon with APScheduler jobs. Modules are decoupled and independently testable with mock data.

#### `collector.py`
- Polls Mantle RPC every `SCAN_INTERVAL_SECONDS` seconds via web3.py
- Fetches transactions from wallets with balance > `WHALE_THRESHOLD_MNT`
- Tracks DeFi protocol interactions: Merchant Moe, Agni Finance, Fluxion
- Outputs normalized pandas DataFrames

#### `ml_engine.py`
- Receives DataFrames from the collector
- Runs IsolationForest for outlier detection
- Runs KMeans for wallet classification
- Computes SmartMoney Score (hybrid rule + ML)
- Returns structured signal dicts with `signal_type`, `confidence`, `reasoning`, `on_chain_hash`

#### `signal_writer.py`
- Receives signals with `confidence >= MIN_CONFIDENCE_THRESHOLD`
- Builds and signs transactions to call `MongliSignals.recordSignal()`
- Implements exponential backoff retry on tx failure
- Writes a local JSONL log for backtesting

#### `telegram_bot.py`
- Maintains subscriber list in memory (upgradeable to SQLite)
- Broadcasts alerts when a new signal is written on-chain
- Handles `/start`, `/watch`, `/top5`, `/stats`, `/help`

#### `main.py`
- Entry point — initializes all modules, wires APScheduler jobs, starts Telegram bot polling

---

### Layer 3 — React Dashboard (`frontend/`)

Public-facing SPA deployed to Vercel.

| Page | Content |
|---|---|
| `/` — Live Feed | Real-time signal table, agent status indicator, signal counter |
| `/wallet` — Wallet Explorer | Address lookup, signal history, SmartMoney score |
| `/analytics` — Analytics | Signal type charts (24h/7d/30d), confidence distribution, top 10 wallets |

All on-chain reads go through ethers.js directly — no backend proxy needed for read-only data.

---

## Data flow (happy path)

```
1. collector.py fetches block N from Mantle RPC
2. ml_engine.py analyzes wallet activity → signal with confidence 85
3. signal_writer.py sends tx → MongliSignals.recordSignal(wallet, "SMART_MONEY_IN", 85, hash)
4. Mantle confirms tx → SignalRecorded event emitted
5. telegram_bot.py detects new signal → pushes alert to all subscribers
6. React dashboard reads contract events via ethers.js → updates Live Feed table
```

---

## Network configuration

| Setting | Value |
|---|---|
| Mainnet RPC | https://rpc.mantle.xyz |
| Mainnet Chain ID | 5000 |
| Testnet RPC | https://rpc.sepolia.mantle.xyz |
| Testnet Chain ID | 5003 |
| Explorer | https://explorer.mantle.xyz |

---

## Security model

- `AGENT_PRIVATE_KEY` is only used by `signal_writer.py` — never exposed in the frontend
- Contract uses `onlyAgent` to prevent unauthorized signal injection
- `dataHash` is keccak256 of the full analysis JSON — tamper-evident
- `.env` is gitignored; `.env.example` contains only placeholder values
