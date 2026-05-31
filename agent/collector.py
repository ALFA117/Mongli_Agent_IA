"""
Data collector — polls Mantle Network and builds feature-rich wallet DataFrames.
Supports both live RPC mode and mock mode for development/testing.
"""
import logging
import time
from dataclasses import dataclass, field
from typing import Optional

import pandas as pd
from web3 import Web3

from config import cfg

log = logging.getLogger(__name__)

# ── Wallet feature schema ────────────────────────────────────────────────────
@dataclass
class WalletFeatures:
    address:               str
    tx_count:              int   = 0
    total_volume_mnt:      float = 0.0
    max_single_tx:         float = 0.0
    avg_tx_value:          float = 0.0
    unique_counterparties: int   = 0
    defi_interactions:     int   = 0
    gas_used_avg:          float = 0.0
    is_contract_caller:    bool  = False
    volume_concentration:  float = 0.0   # max_single_tx / total_volume (0-1)
    block_number:          int   = 0
    raw_txs:               list  = field(default_factory=list, repr=False)

    def to_dict(self) -> dict:
        return {
            "address":               self.address,
            "tx_count":              self.tx_count,
            "total_volume_mnt":      self.total_volume_mnt,
            "max_single_tx":         self.max_single_tx,
            "avg_tx_value":          self.avg_tx_value,
            "unique_counterparties": self.unique_counterparties,
            "defi_interactions":     self.defi_interactions,
            "gas_used_avg":          self.gas_used_avg,
            "is_contract_caller":    int(self.is_contract_caller),
            "volume_concentration":  self.volume_concentration,
        }


class MantleCollector:
    """
    Fetches the latest N blocks from Mantle RPC and groups transactions
    by sender wallet, extracting features for the ML engine.
    """

    ML_FEATURES = [
        "tx_count", "total_volume_mnt", "max_single_tx", "avg_tx_value",
        "unique_counterparties", "defi_interactions", "gas_used_avg",
        "is_contract_caller", "volume_concentration",
    ]

    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(cfg.active_rpc))
        self._defi_addresses = {a.lower() for a in cfg.defi_protocols}
        self._block_cache: dict[int, list] = {}

        if self.w3.is_connected():
            log.info("Connected to Mantle RPC: %s", cfg.active_rpc)
        else:
            log.warning("Cannot reach RPC %s — using mock mode", cfg.active_rpc)

    # ── Public API ───────────────────────────────────────────────────────────

    def collect(self, blocks: int | None = None) -> pd.DataFrame:
        """
        Collect transactions from the last `blocks` blocks and return
        a DataFrame of wallet features ready for the ML engine.
        """
        n = blocks or cfg.blocks_per_scan
        if not self.w3.is_connected():
            log.debug("RPC offline — returning mock features")
            return self._mock_features()

        try:
            latest = self.w3.eth.block_number
            txs    = self._fetch_blocks(latest - n + 1, latest)
            return self._build_features(txs, latest)
        except Exception as exc:
            log.error("collect() failed: %s — fallback to mock", exc)
            return self._mock_features()

    def collect_whale_txs(self) -> pd.DataFrame:
        """Shortcut: collect and filter to whale-level wallets only."""
        df = self.collect()
        return df[df["total_volume_mnt"] >= cfg.whale_threshold].reset_index(drop=True)

    def get_wallet_balance(self, address: str) -> float:
        try:
            bal = self.w3.eth.get_balance(Web3.to_checksum_address(address))
            return float(self.w3.from_wei(bal, "ether"))
        except Exception:
            return 0.0

    # ── Internal helpers ─────────────────────────────────────────────────────

    def _fetch_blocks(self, start: int, end: int) -> list[dict]:
        txs = []
        for bn in range(start, end + 1):
            if bn in self._block_cache:
                txs.extend(self._block_cache[bn])
                continue
            try:
                block = self.w3.eth.get_block(bn, full_transactions=True)
                rows  = [self._tx_to_row(tx, block["timestamp"]) for tx in block.transactions]
                self._block_cache[bn] = rows
                txs.extend(rows)
            except Exception as exc:
                log.warning("Failed to fetch block %d: %s", bn, exc)
        # Keep cache small
        if len(self._block_cache) > 50:
            oldest = min(self._block_cache)
            del self._block_cache[oldest]
        return txs

    def _tx_to_row(self, tx, timestamp: int) -> dict:
        to_addr = (tx.get("to") or "").lower()
        return {
            "hash":         tx["hash"].hex(),
            "from":         tx["from"].lower(),
            "to":           to_addr,
            "value_mnt":    float(self.w3.from_wei(tx["value"], "ether")),
            "gas":          tx.get("gas", 21000),
            "gas_price":    tx.get("gasPrice", 0),
            "is_defi":      to_addr in self._defi_addresses,
            "has_input":    len(tx.get("input", b"")) > 2,
            "timestamp":    timestamp,
        }

    def _build_features(self, txs: list[dict], block_number: int) -> pd.DataFrame:
        if not txs:
            return pd.DataFrame(columns=self.ML_FEATURES + ["address"])

        raw = pd.DataFrame(txs)
        records = []

        for addr, group in raw.groupby("from"):
            vol    = group["value_mnt"].sum()
            max_tx = group["value_mnt"].max()
            defi   = int(group["is_defi"].sum())

            feat = WalletFeatures(
                address               = addr,
                tx_count              = len(group),
                total_volume_mnt      = round(vol, 4),
                max_single_tx         = round(max_tx, 4),
                avg_tx_value          = round(vol / len(group), 4),
                unique_counterparties = group["to"].nunique(),
                defi_interactions     = defi,
                gas_used_avg          = round(group["gas"].mean(), 0),
                is_contract_caller    = bool(group["has_input"].any()),
                volume_concentration  = round(max_tx / vol, 4) if vol > 0 else 0.0,
                block_number          = block_number,
            )
            records.append(feat.to_dict() | {"address": addr})

        return pd.DataFrame(records).reset_index(drop=True)

    # ── Mock data (offline / testing) ────────────────────────────────────────

    @staticmethod
    def _mock_features() -> pd.DataFrame:
        import numpy as np
        rng = np.random.default_rng(int(time.time()) % 1000)
        n   = rng.integers(12, 22)

        # Guarantee a mix of whale / smart-money / retail wallets
        volumes = np.concatenate([
            rng.uniform(15_000, 120_000, n // 3),   # whales
            rng.uniform( 5_000,  40_000, n // 3),   # smart money
            rng.uniform(   100,   4_000, n - 2*(n//3)),  # retail
        ])
        rng.shuffle(volumes)

        return pd.DataFrame({
            "address": [
                f"0x{rng.integers(0, 2**32):08x}"
                f"{rng.integers(0, 2**32):08x}"
                f"{rng.integers(0, 2**16):04x}"
                for _ in range(n)
            ],
            "tx_count":              rng.integers(1, 18, n),
            "total_volume_mnt":      volumes.round(2),
            "max_single_tx":         (volumes * rng.uniform(0.3, 0.9, n)).round(2),
            "avg_tx_value":          (volumes / rng.integers(1, 10, n)).round(2),
            "unique_counterparties": rng.integers(1, 9, n),
            "defi_interactions":     rng.integers(0, 6, n),
            "gas_used_avg":          rng.uniform(21_000, 250_000, n).round(0),
            "is_contract_caller":    rng.integers(0, 2, n),
            "volume_concentration":  rng.uniform(0.1, 1.0, n).round(4),
        })
