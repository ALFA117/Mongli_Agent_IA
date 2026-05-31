"""Tests for backtesting.py — outcome evaluation and stats computation."""
import json
import time
from pathlib import Path

import pytest

from backtesting import compute_stats, evaluate, load_signals


class TestLoadSignals:
    def test_missing_file_returns_empty(self, tmp_path, monkeypatch):
        import backtesting as bt
        monkeypatch.setattr(bt, "LOG_FILE", tmp_path / "nonexistent.jsonl")
        assert load_signals() == []

    def test_loads_valid_jsonl(self, tmp_path, monkeypatch):
        import backtesting as bt
        log_file = tmp_path / "signals.jsonl"
        log_file.write_text(
            '{"wallet": "0xabc", "signal_type": "SMART_MONEY_IN", "confidence": 80, "outcome": "PENDING"}\n'
            '{"wallet": "0xdef", "signal_type": "WHALE_MOVE", "confidence": 75, "outcome": "TP"}\n'
        )
        monkeypatch.setattr(bt, "LOG_FILE", log_file)
        signals = load_signals()
        assert len(signals) == 2
        assert signals[0]["wallet"] == "0xabc"

    def test_skips_invalid_json_lines(self, tmp_path, monkeypatch):
        import backtesting as bt
        log_file = tmp_path / "signals.jsonl"
        log_file.write_text(
            '{"wallet": "0xabc", "outcome": "PENDING"}\n'
            'NOT VALID JSON\n'
            '{"wallet": "0xdef", "outcome": "TP"}\n'
        )
        monkeypatch.setattr(bt, "LOG_FILE", log_file)
        signals = load_signals()
        assert len(signals) == 2


class TestComputeStats:
    def test_empty_input(self):
        stats = compute_stats([])
        assert stats["total"] == 0
        assert stats["accuracy"] == 0.0

    def test_all_pending(self):
        signals = [{"signal_type": "SMART_MONEY_IN", "confidence": 80, "outcome": "PENDING"}] * 5
        stats = compute_stats(signals)
        assert stats["total"] == 5
        assert stats["tp"] == 0
        assert stats["fp"] == 0
        assert stats["pending"] == 5
        assert stats["accuracy"] == 0.0

    def test_accuracy_calculation(self):
        signals = [
            {"signal_type": "SMART_MONEY_IN", "confidence": 85, "outcome": "TP"},
            {"signal_type": "SMART_MONEY_IN", "confidence": 78, "outcome": "TP"},
            {"signal_type": "SMART_MONEY_IN", "confidence": 72, "outcome": "FP"},
            {"signal_type": "WHALE_MOVE",     "confidence": 80, "outcome": "TP"},
        ]
        stats = compute_stats(signals)
        assert stats["total"] == 4
        assert stats["tp"] == 3
        assert stats["fp"] == 1
        assert stats["accuracy"] == 75.0

    def test_avg_confidence(self):
        signals = [
            {"signal_type": "ANOMALY", "confidence": 80, "outcome": "TP"},
            {"signal_type": "ANOMALY", "confidence": 60, "outcome": "FP"},
        ]
        stats = compute_stats(signals)
        assert stats["avg_confidence"] == 70.0

    def test_by_type_breakdown(self):
        signals = [
            {"signal_type": "SMART_MONEY_IN", "confidence": 85, "outcome": "TP"},
            {"signal_type": "SMART_MONEY_IN", "confidence": 72, "outcome": "FP"},
            {"signal_type": "WHALE_MOVE",     "confidence": 80, "outcome": "TP"},
        ]
        stats = compute_stats(signals)
        assert "SMART_MONEY_IN" in stats["by_type"]
        assert stats["by_type"]["SMART_MONEY_IN"]["total"] == 2


class TestEvaluate:
    def test_pending_within_window_stays_pending(self):
        now = int(time.time())
        signals = [{
            "wallet": "0xabc",
            "signal_type": "SMART_MONEY_IN",
            "confidence": 80,
            "outcome": "PENDING",
            "timestamp_unix": now - 3600,  # 1h ago, within 24h window
            "features": {"total_volume_mnt": 10000.0},
        }]
        updated = evaluate(signals)
        assert updated[0]["outcome"] == "PENDING"

    def test_already_decided_not_changed(self):
        signals = [{"wallet": "0xabc", "signal_type": "SMART_MONEY_IN",
                    "confidence": 80, "outcome": "TP",
                    "timestamp_unix": 0, "features": {}}]
        updated = evaluate(signals)
        assert updated[0]["outcome"] == "TP"
