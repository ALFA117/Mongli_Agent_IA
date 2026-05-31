# Contributing to Mongli_Agent_IA

Thanks for your interest in contributing. This project is an AI agent for on-chain smart money detection on the Mantle Network.

---

## Quick Start

```bash
git clone https://github.com/ALFA117/Mongli_Agent_IA.git
cd Mongli_Agent_IA
cp .env.example .env
make install
```

---

## Project Structure

```
agent/      Python AI agent (collector, ML engine, API, bot)
contracts/  Solidity smart contract (Hardhat)
frontend/   React dashboard (Vite + Tailwind)
docs/       Architecture + backtesting methodology
```

---

## Running Tests

```bash
# All tests (recommended before submitting a PR)
make test

# Python agent only (46 tests)
cd agent && python -m pytest tests/ -v

# Solidity contract only (21 tests)
cd contracts && npx hardhat test

# Frontend build check
cd frontend && npm run build
```

All three must pass before a PR is merged.

---

## Development Workflow

### Agent

```bash
# Test each module independently with the CLI
cd agent
python cli.py analyze --mock   # ML pipeline on mock data
python cli.py signal           # generate one test signal
python cli.py backtest         # evaluate signal log
python cli.py api --port 8000  # start REST API
```

### Frontend

```bash
cd frontend
npm run dev    # dev server on http://localhost:5173
npm run build  # production build
```

### Contracts

```bash
cd contracts
npx hardhat compile            # compile MongliSignals.sol
npx hardhat test               # run contract tests
npx hardhat run scripts/deploy.js --network mantleTestnet  # deploy
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Required for | Notes |
|---|---|---|
| `DEPLOYER_PRIVATE_KEY` | Contract deploy | Never commit |
| `AGENT_PRIVATE_KEY` | Signal writing | Can be same as deployer |
| `CONTRACT_ADDRESS` | Agent + frontend | Filled after deploy |
| `TELEGRAM_BOT_TOKEN` | Telegram alerts | From @BotFather |

---

## Contributing Guidelines

- **Agent:** New ML features go in `ml_engine.py`. Add tests in `agent/tests/test_ml_engine.py`.
- **Contract:** Any ABI-breaking changes require updating the ABI in `frontend/src/lib/contract.js`.
- **Frontend:** All pages use the component library in `frontend/src/components/`. Stick to the existing design tokens (accent `#00ff88`, fonts Orbitron/JetBrains Mono).
- **Tests:** Every new public function should have at least one test.
- **No secrets:** Never commit `.env` files or private keys.

---

## Code Style

- **Python:** Standard library conventions, no formatter enforced (PEP 8 preferred)
- **Solidity:** Natspec comments on public functions
- **JavaScript/JSX:** Functional components, Tailwind utility classes only
- **Comments:** Only when the *why* is non-obvious

---

## License

MIT — all contributions are licensed under the same terms.
