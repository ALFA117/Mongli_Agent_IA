"""
Signal writer — sends high-confidence signals to MongliSignals.sol on Mantle.
"""
import json
import logging
import os
import time
from pathlib import Path

from dotenv import load_dotenv
from web3 import Web3

load_dotenv()

logger = logging.getLogger(__name__)

RPC_URL = os.getenv("MANTLE_RPC_URL", "https://rpc.mantle.xyz")
AGENT_KEY = os.getenv("AGENT_PRIVATE_KEY", "")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS", "")
MIN_CONFIDENCE = int(os.getenv("MIN_CONFIDENCE_THRESHOLD", 70))
LOG_PATH = Path(__file__).parent / "logs" / "signals.jsonl"

ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "targetWallet", "type": "address"},
            {"internalType": "string", "name": "signalType", "type": "string"},
            {"internalType": "uint256", "name": "confidenceScore", "type": "uint256"},
            {"internalType": "bytes32", "name": "dataHash", "type": "bytes32"},
        ],
        "name": "recordSignal",
        "outputs": [{"internalType": "uint256", "name": "signalId", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function",
    }
]


class SignalWriter:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(RPC_URL))
        self.account = self.w3.eth.account.from_key(AGENT_KEY) if AGENT_KEY else None
        self.contract = (
            self.w3.eth.contract(
                address=Web3.to_checksum_address(CONTRACT_ADDRESS), abi=ABI
            )
            if CONTRACT_ADDRESS
            else None
        )
        LOG_PATH.parent.mkdir(exist_ok=True)

    def write(self, signal: dict, retries: int = 3) -> str | None:
        if signal["confidence"] < MIN_CONFIDENCE:
            return None
        if not self.contract or not self.account:
            logger.warning("Contract or agent key not configured — skipping on-chain write")
            self._log_local(signal, tx_hash="dry-run")
            return None

        data_hash = bytes.fromhex(signal["on_chain_hash"].lstrip("0x"))
        data_hash_b32 = data_hash[:32].ljust(32, b"\x00")

        for attempt in range(retries):
            try:
                nonce = self.w3.eth.get_transaction_count(self.account.address)
                tx = self.contract.functions.recordSignal(
                    Web3.to_checksum_address(signal["wallet"]),
                    signal["signal_type"],
                    signal["confidence"],
                    data_hash_b32,
                ).build_transaction({
                    "from": self.account.address,
                    "nonce": nonce,
                    "gas": 200_000,
                })
                signed = self.account.sign_transaction(tx)
                tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction).hex()
                self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
                logger.info("Signal written on-chain: %s", tx_hash)
                self._log_local(signal, tx_hash=tx_hash)
                return tx_hash
            except Exception as exc:
                logger.error("Attempt %d failed: %s", attempt + 1, exc)
                time.sleep(2 ** attempt)
        return None

    def _log_local(self, signal: dict, tx_hash: str):
        record = {**signal, "on_chain_tx": tx_hash, "outcome": "PENDING"}
        with LOG_PATH.open("a") as f:
            f.write(json.dumps(record) + "\n")
