"""
Cross-Record Candidate Indicator Correlator.

DISCLAIMER & HONESTY RULE:
A shared indicator (e.g. shared IP, domain, hash, or CVE) is an investigative lead
for security analyst triage. It is NOT proof of a common threat actor, coordinated campaign,
or malicious attribution. Many shared indicators represent common shared infrastructure,
cloud services, public registries, or upstream libraries.

Usage:
    python -m backend.pipeline.shared_indicators
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Set, Tuple


PROJECT_ROOT = Path(__file__).resolve().parents[2]
ANALYSIS_FILE = PROJECT_ROOT / "data" / "processed" / "analysis.json"
SHARED_OUTPUT_FILE = PROJECT_ROOT / "data" / "processed" / "shared_indicators.json"


def find_shared_indicators() -> List[Dict[str, Any]]:
    """
    Identify candidate indicators that appear in more than one analysis record.
    Outputs to data/processed/shared_indicators.json.
    """
    if not ANALYSIS_FILE.exists():
        print(f"[WARN] analysis.json not found at {ANALYSIS_FILE}. Please run run_pipeline first.")
        SHARED_OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(SHARED_OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump([], f, indent=2)
        return []

    with open(ANALYSIS_FILE, "r", encoding="utf-8") as f:
        records: List[Dict[str, Any]] = json.load(f)

    # Map (indicator_value, indicator_type) -> set of (record_id, source)
    indicator_tracker: Dict[Tuple[str, str], Set[Tuple[str, str]]] = {}

    for rec in records:
        rec_id = str(rec.get("id"))
        source = str(rec.get("source") or "Unknown")
        iocs = rec.get("iocs", {})

        # Track CVEs
        for cve in iocs.get("cves", []):
            key = (cve.upper(), "cve")
            indicator_tracker.setdefault(key, set()).add((rec_id, source))

        # Also check top-level CVE field if present
        top_cve = rec.get("cve")
        if top_cve and str(top_cve).upper() not in {"", "N/A", "NONE", "NULL"}:
            key = (str(top_cve).strip().upper(), "cve")
            indicator_tracker.setdefault(key, set()).add((rec_id, source))

        # Track IPs
        for ip in iocs.get("ips", []):
            key = (ip, "ipv4")
            indicator_tracker.setdefault(key, set()).add((rec_id, source))

        # Track Domains
        for domain in iocs.get("domains", []):
            key = (domain.lower(), "domain")
            indicator_tracker.setdefault(key, set()).add((rec_id, source))

        # Track Hashes
        hashes = iocs.get("hashes", {})
        for h_type in ("md5", "sha1", "sha256"):
            for h_val in hashes.get(h_type, []):
                key = (h_val.lower(), f"hash_{h_type}")
                indicator_tracker.setdefault(key, set()).add((rec_id, source))

    # Filter for indicators appearing in >= 2 distinct records
    shared_list: List[Dict[str, Any]] = []

    for (ind_val, ind_type), rec_set in sorted(indicator_tracker.items()):
        if len(rec_set) > 1:
            shared_list.append({
                "indicator": ind_val,
                "type": ind_type,
                "recordCount": len(rec_set),
                "records": [
                    {"recordId": r_id, "source": src}
                    for r_id, src in sorted(list(rec_set))
                ],
                "analystNote": "Candidate correlation lead for triage; not proof of common threat actor."
            })

    SHARED_OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(SHARED_OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(shared_list, f, indent=2)

    print("\n=== SHARED INDICATORS SUMMARY ===")
    if shared_list:
        print(f"Found {len(shared_list)} shared candidate indicator(s) across records:")
        for item in shared_list:
            rec_ids = [r["recordId"] for r in item["records"]]
            print(f"  [{item['type'].upper()}] {item['indicator']} (in {item['recordCount']} records: {rec_ids})")
    else:
        print("No shared indicators found across records (0 shared leads).")
    print(f"Output saved to: {SHARED_OUTPUT_FILE}\n")

    return shared_list


if __name__ == "__main__":
    find_shared_indicators()
