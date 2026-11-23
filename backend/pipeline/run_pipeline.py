"""
Pipeline Runner Module.

Executes end-to-end processing across raw intelligence sources:
1. Cleans unstructured title & description text
2. Extracts candidate indicators of compromise (CVEs, IPs, domains, hashes)
3. Predicts severity band using the trained ML model (skips gracefully if absent)
4. Computes deterministic multi-factor risk score and factor breakdown
5. Emits processed analysis records to data/processed/analysis.json

Usage:
    python -m backend.pipeline.run_pipeline
"""

from __future__ import annotations

import datetime
import json
from pathlib import Path
from typing import Any, Dict, List

from backend.nlp.preprocessing import build_threat_text, clean_text
from backend.nlp.ioc_extraction import extract_iocs
from backend.ml.classifier import predict
from backend.ml.risk_scoring import compute_record_risk


PROJECT_ROOT = Path(__file__).resolve().parents[2]
NVD_FILE = PROJECT_ROOT / "data" / "raw" / "nvd.json"
GITHUB_FILE = PROJECT_ROOT / "data" / "raw" / "github.json"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
ANALYSIS_OUTPUT_FILE = PROCESSED_DIR / "analysis.json"


def load_raw_records() -> List[Dict[str, Any]]:
    """Load records from raw NVD and GitHub sources without modifying files."""
    all_records: List[Dict[str, Any]] = []

    for path, default_source in [(NVD_FILE, "NVD"), (GITHUB_FILE, "GitHub")]:
        if not path.exists():
            print(f"[WARN] Raw data file not found: {path}")
            continue

        with open(path, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                if isinstance(data, list):
                    for idx, item in enumerate(data):
                        # Ensure source tag is preserved
                        if "source" not in item:
                            item["source"] = default_source
                        all_records.append(item)
            except json.JSONDecodeError as err:
                print(f"[ERROR] Failed to read {path}: {err}")

    return all_records


def get_record_id(rec: Dict[str, Any], source: str, index: int) -> str:
    """Extract a meaningful identifier (id, ghsa, cve) or assign fallback."""
    for key in ("id", "ghsa", "cve"):
        val = rec.get(key)
        if val and str(val).strip().upper() not in {"", "N/A", "NONE", "NULL"}:
            return str(val).strip()
    return f"{source.lower()}-{index + 1}"


def run_pipeline() -> List[Dict[str, Any]]:
    """Execute pipeline processing and persist analysis.json."""
    records = load_raw_records()
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    analysis_results: List[Dict[str, Any]] = []
    total_iocs_found = 0
    predictions_made = 0

    for idx, rec in enumerate(records):
        source = rec.get("source") or "Unknown"
        record_id = get_record_id(rec, source, idx)
        
        raw_cve = rec.get("cve")
        cve = (
            str(raw_cve).strip()
            if (raw_cve and str(raw_cve).strip().upper() not in {"", "N/A", "NONE", "NULL"})
            else None
        )

        # 1. Text cleaning
        text = build_threat_text(record=rec)

        # 2. Candidate IOC extraction
        iocs = extract_iocs(text)
        num_iocs = (
            len(iocs["cves"])
            + len(iocs["ips"])
            + len(iocs["domains"])
            + len(iocs["hashes"]["md5"])
            + len(iocs["hashes"]["sha1"])
            + len(iocs["hashes"]["sha256"])
        )
        total_iocs_found += num_iocs

        # Backfill CVE identifier if not present on record but extracted from text
        if not cve and iocs["cves"]:
            cve = iocs["cves"][0]

        # 3. Model severity prediction (graceful fallback if model missing)
        prediction = predict(text)
        if prediction is not None:
            predictions_made += 1
            model_version = prediction.get("modelVersion", "severity_v1")
        else:
            model_version = None

        # 4. Deterministic multi-factor risk score
        risk_result = compute_record_risk(record=rec, num_indicators=num_iocs)

        # 5. Form structured output schema
        item_analysis = {
            "id": record_id,
            "source": source,
            "cve": cve,
            "iocs": iocs,
            "prediction": prediction,
            "riskScore": risk_result["riskScore"],
            "riskBreakdown": risk_result["riskBreakdown"],
            "riskScoreBasis": risk_result["riskScoreBasis"],
            "modelVersion": model_version,
            "processedAt": now_iso
        }

        analysis_results.append(item_analysis)

    # Persist to data/processed/analysis.json (never touches data/raw/)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    with open(ANALYSIS_OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(analysis_results, f, indent=2)

    # Print summary
    print("\n=== PIPELINE RUNNER SUMMARY ===")
    print(f"Records processed   : {len(analysis_results)}")
    print(f"Candidate IOCs found: {total_iocs_found}")
    print(f"Predictions made    : {predictions_made}")
    print(f"Output saved to     : {ANALYSIS_OUTPUT_FILE}\n")

    return analysis_results


if __name__ == "__main__":
    run_pipeline()
