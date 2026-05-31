"""Tests for collector.py — feature extraction and mock data generation."""
import pandas as pd
import pytest

from collector import MantleCollector, WalletFeatures


class TestMockFeatures:
    def test_returns_dataframe(self):
        df = MantleCollector._mock_features()
        assert isinstance(df, pd.DataFrame)

    def test_has_required_columns(self):
        df = MantleCollector._mock_features()
        required = MantleCollector.ML_FEATURES + ["address"]
        for col in required:
            assert col in df.columns, f"Missing column: {col}"

    def test_row_count_in_range(self):
        for _ in range(5):
            df = MantleCollector._mock_features()
            assert 10 <= len(df) <= 25

    def test_has_whale_wallets(self):
        """At least one wallet should be above the whale threshold (10k MNT)."""
        df = MantleCollector._mock_features()
        assert (df["total_volume_mnt"] >= 10_000).any(), \
            "Mock data should contain whale-level wallets"

    def test_volume_positive(self):
        df = MantleCollector._mock_features()
        assert (df["total_volume_mnt"] > 0).all()

    def test_concentration_bounded(self):
        df = MantleCollector._mock_features()
        assert (df["volume_concentration"] >= 0).all()
        assert (df["volume_concentration"] <= 1).all()

    def test_is_contract_caller_binary(self):
        df = MantleCollector._mock_features()
        assert df["is_contract_caller"].isin([0, 1]).all()

    def test_addresses_unique(self):
        df = MantleCollector._mock_features()
        assert df["address"].nunique() == len(df)


class TestWalletFeatures:
    def test_to_dict_contains_all_features(self):
        wf = WalletFeatures(address="0xtest")
        d = wf.to_dict()
        for feat in MantleCollector.ML_FEATURES:
            assert feat in d

    def test_default_values(self):
        wf = WalletFeatures(address="0xtest")
        assert wf.tx_count == 0
        assert wf.total_volume_mnt == 0.0
        assert wf.is_contract_caller is False
