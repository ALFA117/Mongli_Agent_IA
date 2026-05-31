"""
Data collector — polls Mantle RPC and returns normalized DataFrames
for the ML engine.
"""
import os
import pandas as pd
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()

RPC_URL = os.getenv("MANTLE_RPC_URL", "https://rpc.mantle.xyz")
WHALE_THRESHOLD = int(os.getenv("WHALE_THRESHOLD_MNT", 10_000))


class MantleCollector:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(RPC_URL))
        assert self.w3.is_connected(), f"Cannot connect to {RPC_URL}"

    def get_latest_block_txs(self) -> pd.DataFrame:
        block = self.w3.eth.get_block("latest", full_transactions=True)
        rows = []
        for tx in block.transactions:
            rows.append({
                "hash": tx["hash"].hex(),
                "from": tx["from"],
                "to": tx.get("to", ""),
                "value_mnt": self.w3.from_wei(tx["value"], "ether"),
                "gas": tx["gas"],
                "block_number": block["number"],
                "timestamp": block["timestamp"],
            })
        return pd.DataFrame(rows)

    def get_wallet_balance(self, address: str) -> float:
        balance_wei = self.w3.eth.get_balance(Web3.to_checksum_address(address))
        return float(self.w3.from_wei(balance_wei, "ether"))

    def collect_whale_txs(self) -> pd.DataFrame:
        """Return transactions where sender or receiver balance > WHALE_THRESHOLD."""
        df = self.get_latest_block_txs()
        whale_mask = df["value_mnt"] >= WHALE_THRESHOLD
        return df[whale_mask].reset_index(drop=True)
