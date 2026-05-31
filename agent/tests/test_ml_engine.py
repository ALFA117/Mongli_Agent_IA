"""Tests for ml_engine.py — pipeline, scoring, and signal emission."""
import hashlib
import json

import pandas as pd
import pytest

from ml_engine import MLEngine, _keccak, FEATURES


VALID_SIGNAL_TYPES = {"SMART_MONEY_IN", "WHALE_MOVE", "ANOMALY"}


class TestAnalyzePipeline:
    def test_returns_list(self, sample_df):
        ml = MLEngine()
        result = ml.analyze(sample_df)
        assert isinstance(result, list)

    def test_empty_df_returns_empty(self):
        ml = MLEngine()
        result = ml.analyze(pd.DataFrame())
        assert result == []

    def test_all_signals_have_required_keys(self, sample_df):
        ml = MLEngine()
        signals = ml.analyze(sample_df)
        required = {"wallet", "signal_type", "confidence", "cluster",
                    "reasoning", "features", "on_chain_hash"}
        for s in signals:
            assert required.issubset(s.keys()), f"Missing keys in: {s}"

    def test_confidence_bounds(self, sample_df):
        ml = MLEngine()
        for s in ml.analyze(sample_df):
            assert 0 <= s["confidence"] <= 100, \
                f"Confidence {s['confidence']} out of [0, 100]"

    def test_only_valid_signal_types(self, sample_df):
        ml = MLEngine()
        for s in ml.analyze(sample_df):
            assert s["signal_type"] in VALID_SIGNAL_TYPES

    def test_only_signals_above_50_pct(self, sample_df):
        ml = MLEngine()
        for s in ml.analyze(sample_df):
            assert s["confidence"] >= 50

    def test_features_dict_has_all_features(self, sample_df):
        ml = MLEngine()
        signals = ml.analyze(sample_df)
        if signals:
            for feat in FEATURES:
                assert feat in signals[0]["features"]

    def test_hash_present_and_hex(self, sample_df):
        ml = MLEngine()
        for s in ml.analyze(sample_df):
            h = s["on_chain_hash"]
            assert h.startswith("0x")
            assert len(h) == 66   # 0x + 64 hex chars


class TestSmartMoneyScore:
    def setup_method(self):
        self.ml = MLEngine()

    def _row(self, **kwargs):
        import pandas as pd
        defaults = {
            "tx_count": 5, "total_volume_mnt": 10000, "max_single_tx": 7000,
            "avg_tx_value": 2000, "unique_counterparties": 3,
            "defi_interactions": 2, "gas_used_avg": 50000,
            "is_contract_caller": 1, "volume_concentration": 0.7,
            "address": "0xtest",
        }
        defaults.update(kwargs)
        return pd.Series(defaults)

    def test_high_volume_high_defi_scores_well(self):
        row = self._row(avg_tx_value=25000, defi_interactions=4,
                        tx_count=5, unique_counterparties=5, is_contract_caller=1)
        score = self.ml._smart_money_score(row)
        assert score >= 70, f"Expected ≥70, got {score}"

    def test_low_everything_scores_low(self):
        row = self._row(avg_tx_value=50, defi_interactions=0,
                        tx_count=100, unique_counterparties=1, is_contract_caller=0)
        score = self.ml._smart_money_score(row)
        assert score <= 20, f"Expected ≤20, got {score}"

    def test_score_bounded_0_100(self):
        for avg in [0, 500, 5000, 20000, 100000]:
            row = self._row(avg_tx_value=avg, defi_interactions=5,
                            tx_count=5, unique_counterparties=8, is_contract_caller=1)
            score = self.ml._smart_money_score(row)
            assert 0 <= score <= 100


class TestConfidenceBlend:
    def setup_method(self):
        self.ml = MLEngine()

    def test_smart_money_cluster_boosts_confidence(self):
        base = self.ml._blend_confidence(60, 60, "retail")
        boosted = self.ml._blend_confidence(60, 60, "smart_money")
        assert boosted > base

    def test_bot_cluster_penalises_confidence(self):
        base = self.ml._blend_confidence(60, 60, "retail")
        penalised = self.ml._blend_confidence(60, 60, "bot")
        assert penalised < base

    def test_output_bounded(self):
        for a in range(0, 101, 10):
            for s in range(0, 101, 20):
                c = self.ml._blend_confidence(a, s, "whale")
                assert 0 <= c <= 100


class TestAnomalyToConfidence:
    def test_negative_score_gives_high_confidence(self):
        conf = MLEngine._anomaly_to_confidence(-0.4)
        assert conf >= 75

    def test_positive_score_gives_low_confidence(self):
        conf = MLEngine._anomaly_to_confidence(0.4)
        assert conf <= 25

    def test_zero_score_midpoint(self):
        conf = MLEngine._anomaly_to_confidence(0.0)
        assert 40 <= conf <= 60


class TestKeccakHash:
    def test_deterministic(self, sample_signal):
        h1 = _keccak(sample_signal)
        h2 = _keccak(sample_signal)
        assert h1 == h2

    def test_different_signals_different_hash(self, sample_signal):
        sig2 = {**sample_signal, "confidence": 50}
        assert _keccak(sample_signal) != _keccak(sig2)

    def test_excludes_on_chain_hash_field(self, sample_signal):
        sig_with = {**sample_signal, "on_chain_hash": "0xaaaa"}
        sig_without = {k: v for k, v in sample_signal.items() if k != "on_chain_hash"}
        # Adding on_chain_hash shouldn't change the computed hash
        assert _keccak(sig_with) == _keccak(sig_without)
