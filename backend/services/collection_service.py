import json
from pathlib import Path

from backend.collectors.nvd import (
    fetch_nvd_vulnerabilities,
    save_nvd_data,
)

from backend.collectors.github import (
    fetch_github_advisories,
    normalize_github_advisories,
)


PROJECT_ROOT = Path(__file__).resolve().parents[2]
GITHUB_DATA_FILE = PROJECT_ROOT / "data" / "raw" / "github.json"


def collect_nvd_data(results_per_page=10):
    """
    Collect vulnerability intelligence from NVD
    and save the normalized records.
    """

    vulnerabilities = fetch_nvd_vulnerabilities(
        results_per_page=results_per_page
    )

    output_file = save_nvd_data(vulnerabilities)

    return {
        "source": "NVD",
        "count": len(vulnerabilities),
        "output_file": str(output_file),
    }


def collect_github_data(per_page=10):
    """
    Collect security advisory intelligence from GitHub
    and save normalized records.
    """

    advisories = fetch_github_advisories(
        per_page=per_page
    )

    threats = normalize_github_advisories(
        advisories
    )

    GITHUB_DATA_FILE.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    with open(
        GITHUB_DATA_FILE,
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            threats,
            file,
            indent=2,
            ensure_ascii=False
        )

    return {
        "source": "GitHub",
        "count": len(threats),
        "output_file": str(GITHUB_DATA_FILE),
        "threats": threats,
    }