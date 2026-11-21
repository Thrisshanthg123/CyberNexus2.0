import json
from datetime import datetime
from pathlib import Path

import requests


NVD_API_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"

PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW_DATA_DIR = PROJECT_ROOT / "data" / "raw"
OUTPUT_FILE = RAW_DATA_DIR / "nvd.json"


def get_cvss_information(cve_data):
    """
    Extract CVSS score and severity from an NVD CVE record.
    """

    metrics = cve_data.get("metrics", {})

    # Prefer CVSS v3.1
    if metrics.get("cvssMetricV31"):
        cvss = metrics["cvssMetricV31"][0]

        cvss_data = cvss.get("cvssData", {})

        return (
            cvss_data.get("baseScore"),
            cvss_data.get("baseSeverity"),
        )

    # Fall back to CVSS v3.0
    if metrics.get("cvssMetricV30"):
        cvss = metrics["cvssMetricV30"][0]

        cvss_data = cvss.get("cvssData", {})

        return (
            cvss_data.get("baseScore"),
            cvss_data.get("baseSeverity"),
        )

    # Fall back to CVSS v2
    if metrics.get("cvssMetricV2"):
        cvss = metrics["cvssMetricV2"][0]

        cvss_data = cvss.get("cvssData", {})

        score = cvss_data.get("baseScore")

        if score is not None:
            if score >= 7.0:
                severity = "High"
            elif score >= 4.0:
                severity = "Medium"
            else:
                severity = "Low"

            return score, severity

    return None, "Unknown"


def fetch_nvd_vulnerabilities(results_per_page=10):
    """
    Fetch vulnerability records from the NVD API.
    """

    params = {
        "resultsPerPage": results_per_page,
    }

    response = requests.get(
        NVD_API_URL,
        params=params,
        timeout=30,
    )

    response.raise_for_status()

    data = response.json()

    vulnerabilities = []

    for item in data.get("vulnerabilities", []):

        cve_data = item.get("cve", {})

        cve_id = cve_data.get("id", "N/A")

        descriptions = cve_data.get(
            "descriptions",
            []
        )

        description = "No description available."

        for desc in descriptions:
            if desc.get("lang") == "en":
                description = desc.get(
                    "value",
                    description
                )
                break

        cvss_score, severity = get_cvss_information(
            cve_data
        )

        published = cve_data.get(
            "published",
            datetime.utcnow().isoformat(),
        )

        last_modified = cve_data.get(
            "lastModified",
            published,
        )

        vulnerabilities.append(
            {
                "title": f"NVD Vulnerability {cve_id}",
                "description": description,
                "source": "NVD",
                "category": "Vulnerability-Disclosure",
                "severity": severity,
                "cvssScore": cvss_score,
                "status": "New",
                "cve": cve_id,
                "ioc": "N/A",
                "timestamp": published,
                "published": published,
                "lastModified": last_modified,
                "mlClassification": "Unclassified",
                "confidence": 0,
                "riskScore": 0,
            }
        )

    return vulnerabilities


def save_nvd_data(vulnerabilities):
    """
    Save normalized NVD records to data/raw/nvd.json.
    """

    RAW_DATA_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    with open(
        OUTPUT_FILE,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            vulnerabilities,
            file,
            indent=2,
            ensure_ascii=False
        )

    return OUTPUT_FILE


if __name__ == "__main__":

    vulnerabilities = fetch_nvd_vulnerabilities(
        results_per_page=5
    )

    output_file = save_nvd_data(
        vulnerabilities
    )

    print(
        f"Fetched {len(vulnerabilities)} vulnerabilities"
    )

    print(
        f"Saved NVD data to: {output_file}"
    )

    for vulnerability in vulnerabilities:

        print("\n-------------------------")

        print(
            "CVE:",
            vulnerability["cve"]
        )

        print(
            "Severity:",
            vulnerability["severity"]
        )

        print(
            "CVSS Score:",
            vulnerability["cvssScore"]
        )

        print(
            "Description:",
            vulnerability["description"][:200]
        )