import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]

NVD_DATA_FILE = PROJECT_ROOT / "data" / "raw" / "nvd.json"
GITHUB_DATA_FILE = PROJECT_ROOT / "data" / "raw" / "github.json"


def load_json_file(file_path):
    """
    Load a JSON file and return its records.
    """

    if not file_path.exists():
        return []

    with open(
        file_path,
        "r",
        encoding="utf-8"
    ) as file:
        return json.load(file)


def get_all_threats():
    """
    Load normalized threat records from all
    currently supported intelligence sources.
    """

    nvd_threats = load_json_file(
        NVD_DATA_FILE
    )

    github_threats = load_json_file(
        GITHUB_DATA_FILE
    )

    threats = nvd_threats + github_threats

    return threats