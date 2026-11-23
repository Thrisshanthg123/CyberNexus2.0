"""
Analysis API Blueprint.

Exposes read-only endpoints for processed intelligence records and shared candidate indicators.
"""

from __future__ import annotations

import json
from pathlib import Path
from flask import Blueprint, jsonify, Response


PROJECT_ROOT = Path(__file__).resolve().parents[3]
ANALYSIS_FILE = PROJECT_ROOT / "data" / "processed" / "analysis.json"
SHARED_FILE = PROJECT_ROOT / "data" / "processed" / "shared_indicators.json"

analysis_bp = Blueprint("analysis", __name__)


@analysis_bp.route("/api/analysis", methods=["GET"])
def get_analysis() -> Response:
    """
    Return processed intelligence records from data/processed/analysis.json.
    Returns empty list with informational note if analysis has not yet run.
    """
    if not ANALYSIS_FILE.exists():
        return jsonify({
            "count": 0,
            "records": [],
            "note": "analysis.json does not exist. Run 'python -m backend.pipeline.run_pipeline' to generate."
        })

    try:
        with open(ANALYSIS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as err:
        return jsonify({"error": f"Failed to load analysis data: {err}"}), 500


@analysis_bp.route("/api/analysis/shared", methods=["GET"])
def get_shared_indicators() -> Response:
    """
    Return cross-record shared candidate indicators from data/processed/shared_indicators.json.
    """
    if not SHARED_FILE.exists():
        return jsonify([])

    try:
        with open(SHARED_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as err:
        return jsonify({"error": f"Failed to load shared indicators: {err}"}), 500
