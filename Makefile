# Mongli_Agent_IA — Developer Commands
# Run `make help` to see all commands

.PHONY: help install agent frontend api backtest deploy-testnet deploy-mainnet compile lint clean

PYTHON := py -3.13
NODE   := node

help:
	@echo ""
	@echo "  Mongli_Agent_IA — Makefile commands"
	@echo "  ─────────────────────────────────────"
	@echo "  make install          Install all dependencies"
	@echo "  make agent            Run the AI agent (main.py)"
	@echo "  make api              Run FastAPI only (port 8000)"
	@echo "  make frontend         Run React dashboard (port 5173)"
	@echo "  make backtest         Run backtesting analysis"
	@echo "  make compile          Compile Solidity contracts"
	@echo "  make deploy-testnet   Deploy to Mantle Sepolia"
	@echo "  make deploy-mainnet   Deploy to Mantle Mainnet"
	@echo "  make test             Smoke test all agent modules"
	@echo "  make clean            Remove build artifacts"
	@echo ""

# ── Installation ──────────────────────────────────────────────────────────────

install:
	@echo "→ Installing Python dependencies..."
	pip install -r agent/requirements.txt --prefer-binary
	@echo "→ Installing frontend dependencies..."
	cd frontend && npm install
	@echo "→ Installing Hardhat dependencies..."
	cd contracts && npm install
	@echo "✓ All dependencies installed"

# ── Run ───────────────────────────────────────────────────────────────────────

agent:
	cd agent && $(PYTHON) main.py

api:
	cd agent && uvicorn api:app --reload --host 0.0.0.0 --port 8000

frontend:
	cd frontend && npm run dev

backtest:
	cd agent && $(PYTHON) backtesting.py

# ── Contracts ─────────────────────────────────────────────────────────────────

compile:
	cd contracts && npx hardhat compile --force

deploy-testnet:
	@echo "→ Deploying to Mantle Sepolia Testnet (chain 5003)..."
	cd contracts && npx hardhat run scripts/deploy.js --network mantleTestnet

deploy-mainnet:
	@echo "→ Deploying to Mantle Mainnet (chain 5000)..."
	@echo "→ WARNING: This spends real MNT. Confirm with: make deploy-mainnet-confirm"
	@echo "   Run: cd contracts && npx hardhat run scripts/deploy.js --network mantle"

# ── Testing ───────────────────────────────────────────────────────────────────

test:
	@echo "→ Running agent smoke tests..."
	cd agent && $(PYTHON) -c "\
from collector import MantleCollector; \
from ml_engine import MLEngine; \
from signal_writer import SignalWriter; \
c = MantleCollector(); \
df = c._mock_features(); \
ml = MLEngine(); \
sigs = ml.analyze(df); \
w = SignalWriter(); \
print(f'OK  collector: {len(df)} wallets'); \
print(f'OK  ml_engine: {len(sigs)} signals'); \
print(f'OK  writer:    dry_run={w.dry_run}'); \
print('ALL TESTS PASSED'); \
"

# ── Build ─────────────────────────────────────────────────────────────────────

build-frontend:
	cd frontend && npm run build

# ── Clean ─────────────────────────────────────────────────────────────────────

clean:
	cd frontend && rm -rf dist node_modules
	cd contracts && rm -rf artifacts cache node_modules
	find agent -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
