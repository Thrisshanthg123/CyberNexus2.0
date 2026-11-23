"""
Unit tests for Risk Scoring Engine (backend/ml/risk_scoring.py).

Verifies:
1. Standard full record with valid CVSS, recent date, and multiple indicators
2. Record with missing CVSS (explicit fallback handling & missingCvss=True)
3. Very old legacy advisory (1988 date decaying recency factor near zero)
4. Record with zero indicators and recent date
"""

import datetime
import pytest

from backend.ml.risk_scoring import compute_risk_score, compute_record_risk


def test_standard_full_record():
    ref_date = datetime.datetime(2026, 9, 20, 12, 0, 0, tzinfo=datetime.timezone.utc)
    result = compute_risk_score(
        cvss_score=9.8,
        severity="Critical",
        published="2026-09-19T10:00:00Z",
        num_indicators=5,
        source="NVD",
        reference_date=ref_date
    )

    assert "riskScore" in result
    assert "riskBreakdown" in result
    assert result["riskScoreBasis"] == "formula-v1"
    assert 0.0 <= result["riskScore"] <= 100.0

    bd = result["riskBreakdown"]
    assert bd["missingCvss"] is False
    assert bd["cvssFactor"] == 0.98
    assert bd["severityFactor"] == 1.00
    assert bd["indicatorFactor"] == 1.00
    assert bd["sourceFactor"] == 0.95
    assert bd["recencyFactor"] > 0.95  # Published 1 day prior
    assert result["riskScore"] >= 85.0


def test_missing_cvss_explicit_handling():
    ref_date = datetime.datetime(2026, 9, 20, 12, 0, 0, tzinfo=datetime.timezone.utc)
    result = compute_risk_score(
        cvss_score=None,
        severity="High",
        published="2026-09-18T12:00:00Z",
        num_indicators=2,
        source="GitHub",
        reference_date=ref_date
    )

    bd = result["riskBreakdown"]
    assert bd["missingCvss"] is True
    # Imputed from High severity (0.75)
    assert bd["cvssFactor"] == 0.75
    assert bd["severityFactor"] == 0.75
    assert 0.0 <= result["riskScore"] <= 100.0


def test_very_old_record_recency_decay():
    ref_date = datetime.datetime(2026, 9, 20, 12, 0, 0, tzinfo=datetime.timezone.utc)
    # 1988 advisory (NVD CVE-1999-0095 dataset timestamp)
    result = compute_risk_score(
        cvss_score=10.0,
        severity="High",
        published="1988-10-01T04:00:00.000",
        num_indicators=1,
        source="NVD",
        reference_date=ref_date
    )

    bd = result["riskBreakdown"]
    assert bd["daysSincePublished"] is not None
    assert bd["daysSincePublished"] > 10000.0  # Decades old
    # Half-life decay: 1 / (1 + days/180) should be tiny (< 0.05)
    assert bd["recencyFactor"] < 0.05
    assert 0.0 <= result["riskScore"] <= 100.0


def test_zero_indicators_and_recent_date():
    ref_date = datetime.datetime(2026, 9, 20, 12, 0, 0, tzinfo=datetime.timezone.utc)
    result = compute_risk_score(
        cvss_score=5.0,
        severity="Medium",
        published="2026-09-20T11:00:00Z",
        num_indicators=0,
        source="Reddit",
        reference_date=ref_date
    )

    bd = result["riskBreakdown"]
    assert bd["indicatorFactor"] == 0.0
    assert bd["sourceFactor"] == 0.50
    assert 0.0 <= result["riskScore"] <= 100.0
