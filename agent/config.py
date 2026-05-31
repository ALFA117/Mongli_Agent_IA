"""
Centralized configuration for Mongli_Agent_IA.
All values are read from environment variables (.env in project root).
"""
import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

BASE_DIR  = Path(__file__).parent
LOGS_DIR  = BASE_DIR / "logs"
MODELS_DIR = BASE_DIR / "models"

LOGS_DIR.mkdir(exist_ok=True)
MODELS_DIR.mkdir(exist_ok=True)


@dataclass
class Config:
    # ── Network ────────────────────────────────────────────────────
    rpc_url:         str   = os.getenv("MANTLE_RPC_URL",         "https://rpc.mantle.xyz")
    testnet_rpc_url: str   = os.getenv("MANTLE_TESTNET_RPC_URL", "https://rpc.sepolia.mantle.xyz")
    chain_id:        int   = int(os.getenv("CHAIN_ID", "5003"))   # 5003=testnet, 5000=mainnet

    # ── Contract ───────────────────────────────────────────────────
    contract_address:  str = os.getenv("CONTRACT_ADDRESS",  "")
    agent_private_key: str = os.getenv("AGENT_PRIVATE_KEY", "")

    # ── Telegram ───────────────────────────────────────────────────
    telegram_bot_token: str = os.getenv("TELEGRAM_BOT_TOKEN", "")

    # ── Agent behavior ─────────────────────────────────────────────
    scan_interval_s:   int   = int(os.getenv("SCAN_INTERVAL_SECONDS",     "30"))
    min_confidence:    int   = int(os.getenv("MIN_CONFIDENCE_THRESHOLD",   "70"))
    whale_threshold:   float = float(os.getenv("WHALE_THRESHOLD_MNT",     "10000"))
    blocks_per_scan:   int   = int(os.getenv("BLOCKS_PER_SCAN",            "5"))

    # ── API ────────────────────────────────────────────────────────
    api_host: str = os.getenv("FASTAPI_HOST", "0.0.0.0")
    api_port: int = int(os.getenv("FASTAPI_PORT", "8000"))

    # ── Known Mantle DeFi protocol addresses ──────────────────────
    defi_protocols: dict = field(default_factory=lambda: {
        "0x4a5a3e07c9A4F9B2a1c3d5E7f9B2A4c6D8E0F2a": "Merchant Moe Router",
        "0x7a9Bb4c2D6F0E8a2c4d6B8E0F2a4c6D8E0F2a4c": "Agni Finance Pool",
        "0x2d4E6a8C0F2a4c6D8E0F2a4c6D8E0F2a4c6D8E0": "Fluxion AMM",
        "0x5f7a9C1e3D5f7a9c1E3D5f7a9C1e3D5f7A9c1E3": "Mantle DEX Router",
    })

    @property
    def active_rpc(self) -> str:
        return self.testnet_rpc_url if self.chain_id == 5003 else self.rpc_url

    @property
    def is_testnet(self) -> bool:
        return self.chain_id == 5003

    @property
    def explorer_base(self) -> str:
        if self.is_testnet:
            return "https://explorer.sepolia.mantle.xyz"
        return "https://explorer.mantle.xyz"

    def defi_name(self, address: str) -> str:
        return self.defi_protocols.get(address.lower(), "Unknown Protocol")


cfg = Config()
