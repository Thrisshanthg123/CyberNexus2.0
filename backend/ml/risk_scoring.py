"""
Transparent Risk Scoring Engine (formula-v1).

DISCLAIMER & HONESTY RULE:
The risk scoring formula weights (CVSS: 35%, Severity: 25%, Recency: 15%,
Indicators: 15%, Source Reliability: 10%) are DESIGN CHOICES and HEURISTICS.
No ground truth exists to statistically validate or optimize these weights.
The resulting score represents an illustrative prioritization heuristic for
triage assistance, NOT an empirically calibrated measure of actual breach likelihood.
"""

from __future__ import annotations

import datetime
from typing import Any, Dict, Mapping, Optional


# Documented source reliability coefficients (0.0 to 1.0)
SOURCE_RELIABILITY_MAP: Dict[str, float] = {
    "NVD": 0.95,        # Official NIST National Vulnerability Database
    "GitHub": 0.85,     # Curated vendor & open-source advisories
    "Reddit": 0.50,     # Community discussion / unverified claims
    "X/Twitter": 0.45,  # Microblog chatter / rapid unvetted alerts
}
DEFAULT_SOURCE_RELIABILITY: float = 0.60

# Severity band numeric mappings
SEVERITY_WEIGHT_MAP: Dict[str, float] = {
    "Critical": 1.00,
    "High": 0.75,
    "Medium": 0.50,
    "Low": 0.25
}

# Formula Factor Weights (Total = 1.0)
WEIGHT_CVSS: float = 0.35
WEIGHT_SEVERITY: float = 0.25
WEIGHT_RECENCY: float = 0.15
WEIGHT_INDICATORS: float = 0.15
WEIGHT_SOURCE: float = 0.10


def calculate_days_since_published(
    published_str: str | None,
    reference_date: datetime.datetime | None = None
) -> Optional[float]:
    """Calculate elapsed days since publication date string."""
    if not published_str:
        return None

    ref = reference_date or datetime.datetime.now(datetime.timezone.utc)

    # Clean ISO string variations
    clean_str = published_str.strip().replace("Z", "+00:00")
    # Truncate nanoseconds/milliseconds if necessary
    for fmt in (
        "%Y-%m-%dT%H:%M:%S.%f%z",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d"
    ):
        try:
            dt = datetime.datetime.strptime(clean_str, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=datetime.timezone.utc)
            delta = ref - dt
            return max(0.0, delta.total_seconds() / 86400.0)
        except ValueError:
            continue

    # Fallback ISO parsing
    try:
        dt = datetime.datetime.fromisoformat(clean_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=datetime.timezone.utc)
        delta = ref - dt
        return max(0.0, delta.total_seconds() / 86400.0)
    except (ValueError, TypeError):
        return None


def compute_risk_score(
    cvss_score: float | int | None = None,
    severity: str | None = None,
    published: str | None = None,
    num_indicators: int = 0,
    source: str | None = None,
    reference_date: datetime.datetime | None = None
) -> Dict[str, Any]:
    """
    Compute a composite risk score between 0.0 and 100.0 with per-factor breakdown.

    Inputs:
        - cvss_score: 0.0 to 10.0 (handled explicitly if missing)
        - severity: 'Critical', 'High', 'Medium', 'Low'
        - published: ISO date string of publication
        - num_indicators: Count of candidate extracted IOCs
        - source: 'NVD', 'GitHub', 'Reddit', etc.
        - reference_date: Optional reference time for deterministic unit testing
    """
    # 1. CVSS Factor (Weight: 35%)
    missing_cvss = False
    if cvss_score is not None:
        try:
            numeric_cvss = float(cvss_score)
            cvss_factor = max(0.0, min(1.0, numeric_cvss / 10.0))
        except (ValueError, TypeError):
            missing_cvss = True
    else:
        missing_cvss = True

    # 2. Severity Factor (Weight: 25%)
    norm_sev = str(severity).capitalize() if severity else "Medium"
    sev_factor = SEVERITY_WEIGHT_MAP.get(norm_sev, 0.50)

    # If CVSS is missing, impute from severity band as fallback
    if missing_cvss:
        cvss_factor = sev_factor

    # 3. Recency Factor (Weight: 15%) - 180-day half-life decay
    days_elapsed = calculate_days_since_published(published, reference_date=reference_date)
    if days_elapsed is not None:
        recency_factor = 1.0 / (1.0 + (days_elapsed / 180.0))
    else:
        recency_factor = 0.50  # Neutral midpoint when published date is unknown

    # 4. Candidate Indicators Factor (Weight: 15%) - saturated at 5 indicators
    indicator_factor = min(max(0, num_indicators) / 5.0, 1.0)

    # 5. Source Reliability Factor (Weight: 10%)
    norm_source = (source or "").strip()
    source_factor = SOURCE_RELIABILITY_MAP.get(norm_source, DEFAULT_SOURCE_RELIABILITY)

    # Weighted Sum
    composite = (
        (WEIGHT_CVSS * cvss_factor)
        + (WEIGHT_SEVERITY * sev_factor)
        + (WEIGHT_RECENCY * recency_factor)
        + (WEIGHT_INDICATORS * indicator_factor)
        + (WEIGHT_SOURCE * source_factor)
    )

    final_score = round(max(0.0, min(100.0, composite * 100.0)), 1)

    return {
        "riskScore": final_score,
        "riskBreakdown": {
            "cvssFactor": round(cvss_factor, 4),
            "severityFactor": round(sev_factor, 4),
            "recencyFactor": round(recency_factor, 4),
            "indicatorFactor": round(indicator_factor, 4),
            "sourceFactor": round(source_factor, 4),
            "missingCvss": missing_cvss,
            "daysSincePublished": round(days_elapsed, 1) if days_elapsed is not None else None
        },
        "riskScoreBasis": "formula-v1"
    }


def compute_record_risk(
    record: Mapping[str, Any],
    num_indicators: int = 0,
    reference_date: datetime.datetime | None = None
) -> Dict[str, Any]:
    """Helper to compute risk score directly from a threat record dictionary."""
    return compute_risk_score(
        cvss_score=record.get("cvssScore"),
        severity=record.get("severity"),
        published=record.get("published") or record.get("publishedDate") or record.get("timestamp"),
        num_indicators=num_indicators,
        source=record.get("source"),
        reference_date=reference_date
    )
