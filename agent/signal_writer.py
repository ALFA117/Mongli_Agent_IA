"""
Signal writer — broadcasts high-confidence signals to MongliSignals.sol on Mantle
and persists a local JSONL log for backtesting and audit.
"""
import json
import logging
import time
from pathlib import Path

from web3 import Web3

from config import cfg, LOGS_DIR

log = logging.getLogger(__name__)

LOG_FILE = LOGS_DIR / "signals.jsonl"

ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "targetWallet", "type": "address"},
            {"internalType": "string",  "name": "signalType",   "type": "string"},
            {"internalType": "uint256", "name": "confidenceScore","type": "uint256"},
            {"internalType": "bytes32", "name": "dataHash",      "type": "bytes32"},
        ],
        "name": "recordSignal",
        "outputs": [{"internalType": "uint256", "name": "signalId", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function",
    }
]


class SignalWriter:
    """
    Writes qualifying signals to the MongliSignals smart contract.
    Falls back to dry-run logging when contract / key is not configured.
    """

    def __init__(self):
        self.w3       = Web3(Web3.HTTPProvider(cfg.active_rpc))
        self.account  = self._load_account()
        self.contract = self._load_contract()
        self.dry_run  = not (self.account and self.contract)

        if self.dry_run:
            log.warning("SignalWriter in DRY-RUN mode (no key/contract configured)")

    # ── Public API ───────────────────────────────────────────────────────────

    def write(self, signal: dict, retries: int = 3) -> str | None:
        """
        Write a signal on-chain if confidence ≥ threshold.
        Returns the tx hash on success, None otherwise.
        """
        if signal["confidence"] < cfg.min_confidence:
            return None

        tx_hash = "dry-run"
        if not self.dry_run:
            tx_hash = self._send_with_retry(signal, retries)

        self._log_local(signal, tx_hash=tx_hash or "failed")
        return tx_hash

    def write_batch(self, signals: list[dict]) -> list[str | None]:
        """Write multiple signals, respecting a short delay to avoid nonce conflicts."""
        results = []
        for sig in signals:
            results.append(self.write(sig))
            if not self.dry_run:
                time.sleep(1.2)
        return results

    # ── On-chain interaction ─────────────────────────────────────────────────

    def _send_with_retry(self, signal: dict, retries: int) -> str | None:
        for attempt in range(retries):
            try:
                return self._send(signal)
            except Exception as exc:
                wait = 2 ** attempt
                log.error("Attempt %d/%d failed: %s — retrying in %ds", attempt + 1, retries, exc, wait)
                time.sleep(wait)
        return None

    def _send(self, signal: dict) -> str:
        data_hash = bytes.fromhex(signal["on_chain_hash"].lstrip("0x"))
        data_hash = data_hash[:32].ljust(32, b"\x00")

        nonce = self.w3.eth.get_transaction_count(self.account.address)
        tx = self.contract.functions.recordSignal(
            Web3.to_checksum_address(signal["wallet"]),
            signal["signal_type"],
            int(signal["confidence"]),
            data_hash,
        ).build_transaction({
            "from":  self.account.address,
            "nonce": nonce,
            "gas":   220_000,
        })

        signed  = self.account.sign_transaction(tx)
        tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction).hex()
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=90)

        if receipt["status"] != 1:
            raise RuntimeError(f"Tx reverted: {tx_hash}")

        log.info("Signal on-chain: %s | conf=%d | type=%s",
                 tx_hash[:20], signal["confidence"], signal["signal_type"])
        return tx_hash

    # ── Local persistence ────────────────────────────────────────────────────

    @staticmethod
    def _log_local(signal: dict, tx_hash: str):
        record = {**signal, "on_chain_tx": tx_hash, "outcome": "PENDING"}
        with LOG_FILE.open("a", encoding="utf-8") as f:
            f.write(json.dumps(record, default=str) + "\n")

    # ── Helpers ──────────────────────────────────────────────────────────────

    def _load_account(self):
        if not cfg.agent_private_key:
            return None
        try:
            return self.w3.eth.account.from_key(cfg.agent_private_key)
        except Exception as e:
            log.error("Invalid AGENT_PRIVATE_KEY: %s", e)
            return None

    def _load_contract(self):
        if not cfg.contract_address or not self.account:
            return None
        try:
            return self.w3.eth.contract(
                address=Web3.to_checksum_address(cfg.contract_address),
                abi=ABI,
            )
        except Exception as e:
            log.error("Could not load contract: %s", e)
            return None
