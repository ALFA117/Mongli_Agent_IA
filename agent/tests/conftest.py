"""Shared fixtures for all agent tests."""
import sys
from pathlib import Path

import pandas as pd
import pytest

# Allow imports from agent/ root
sys.path.insert(0, str(Path(__file__).parent.parent))


@pytest.fixture
def sample_df():
    """Realistic 12-wallet DataFrame covering all archetypes."""
    return pd.DataFrame({
        "address": [
            "0xaaaa000000000000000000000000000000000001",
            "0xbbbb000000000000000000000000000000000002",
            "0xcccc000000000000000000000000000000000003",
            "0xdddd000000000000000000000000000000000004",
            "0xeeee000000000000000000000000000000000005",
            "0xffff000000000000000000000000000000000006",
            "0x1111000000000000000000000000000000000007",
            "0x2222000000000000000000000000000000000008",
            "0x3333000000000000000000000000000000000009",
            "0x4444000000000000000000000000000000000010",
            "0x5555000000000000000000000000000000000011",
            "0x6666000000000000000000000000000000000012",
        ],
        "tx_count":              [5,  2,  15, 1,  8,  3,  12, 4,  7,  9,  1,  6],
        "total_volume_mnt":      [45000, 8000, 120000, 500, 30000, 5000,
                                  25000, 15000, 60000, 12000, 200, 8500],
        "max_single_tx":         [30000, 6000, 80000, 500, 20000, 4000,
                                  18000, 10000, 45000, 8000, 200, 6000],
        "avg_tx_value":          [9000, 4000, 8000, 500, 3750, 1667,
                                  2083, 3750, 8571, 1333, 200, 1417],
        "unique_counterparties": [4, 2, 8, 1, 5, 3, 6, 4, 7, 3, 1, 2],
        "defi_interactions":     [3, 0, 5, 0, 2, 1, 4, 2, 3, 1, 0, 0],
        "gas_used_avg":          [85000, 21000, 150000, 21000, 65000, 35000,
                                  120000, 50000, 90000, 45000, 21000, 30000],
        "is_contract_caller":    [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0],
        "volume_concentration":  [0.67, 0.75, 0.67, 1.0, 0.67, 0.80,
                                  0.72, 0.67, 0.75, 0.67, 1.0, 0.71],
    })


@pytest.fixture
def sample_signal():
    return {
        "wallet":       "0xd3aD4c7e8F9b2A1c3E5D7f0B8e2a4C6d8F0B2e4A",
        "signal_type":  "SMART_MONEY_IN",
        "confidence":   87,
        "cluster":      "smart_money",
        "reasoning":    "Wallet classified as smart_money. Moved 45,200 MNT.",
        "features":     {"total_volume_mnt": 45200.0, "defi_interactions": 3.0},
        "on_chain_hash": "0x" + "a1b2c3" * 10 + "d4e5",
    }
