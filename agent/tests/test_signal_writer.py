"""Tests for signal_writer.py — dry-run mode and local log."""
import json
from pathlib import Path

import pytest

from signal_writer import SignalWriter


class TestDryRunMode:
    def test_no_keys_means_dry_run(self, monkeypatch):
        monkeypatch.setenv("AGENT_PRIVATE_KEY", "")
        monkeypatch.setenv("CONTRACT_ADDRESS", "")
        w = SignalWriter()
        assert w.dry_run is True

    def test_write_below_threshold_returns_none(self, sample_signal, tmp_path, monkeypatch):
        monkeypatch.setenv("AGENT_PRIVATE_KEY", "")
        monkeypatch.setenv("CONTRACT_ADDRESS", "")
        monkeypatch.setenv("MIN_CONFIDENCE_THRESHOLD", "80")
        # Force log path to tmp
        import signal_writer as sw
        monkeypatch.setattr(sw, "LOG_FILE", tmp_path / "signals.jsonl")

        w = SignalWriter()
        low_conf = {**sample_signal, "confidence": 50}
        result = w.write(low_conf)
        assert result is None

    def test_write_dry_run_returns_dry_run_string(self, sample_signal, tmp_path, monkeypatch):
        monkeypatch.setenv("AGENT_PRIVATE_KEY", "")
        monkeypatch.setenv("CONTRACT_ADDRESS", "")
        monkeypatch.setenv("MIN_CONFIDENCE_THRESHOLD", "70")
        import signal_writer as sw
        monkeypatch.setattr(sw, "LOG_FILE", tmp_path / "signals.jsonl")

        w = SignalWriter()
        result = w.write(sample_signal)
        assert result == "dry-run"

    def test_log_file_created_after_write(self, sample_signal, tmp_path, monkeypatch):
        monkeypatch.setenv("AGENT_PRIVATE_KEY", "")
        monkeypatch.setenv("CONTRACT_ADDRESS", "")
        import signal_writer as sw
        log_file = tmp_path / "signals.jsonl"
        monkeypatch.setattr(sw, "LOG_FILE", log_file)

        w = SignalWriter()
        w.write(sample_signal)
        assert log_file.exists()

    def test_log_file_contains_valid_json(self, sample_signal, tmp_path, monkeypatch):
        monkeypatch.setenv("AGENT_PRIVATE_KEY", "")
        monkeypatch.setenv("CONTRACT_ADDRESS", "")
        import signal_writer as sw
        log_file = tmp_path / "signals.jsonl"
        monkeypatch.setattr(sw, "LOG_FILE", log_file)

        w = SignalWriter()
        w.write(sample_signal)

        with log_file.open() as f:
            record = json.loads(f.readline())

        assert record["wallet"] == sample_signal["wallet"]
        assert record["signal_type"] == sample_signal["signal_type"]
        assert record["outcome"] == "PENDING"

    def test_batch_write_returns_list(self, sample_signal, tmp_path, monkeypatch):
        monkeypatch.setenv("AGENT_PRIVATE_KEY", "")
        monkeypatch.setenv("CONTRACT_ADDRESS", "")
        import signal_writer as sw
        monkeypatch.setattr(sw, "LOG_FILE", tmp_path / "signals.jsonl")

        w = SignalWriter()
        results = w.write_batch([sample_signal, sample_signal])
        assert isinstance(results, list)
        assert len(results) == 2
