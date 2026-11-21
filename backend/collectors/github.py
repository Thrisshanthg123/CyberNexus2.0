import requests


GITHUB_API_URL = "https://api.github.com/advisories"


def fetch_github_advisories(per_page=10):
    """
    Fetch global security advisories from GitHub.
    """

    params = {
        "type": "reviewed",
        "per_page": per_page,
        "sort": "published",
        "direction": "desc",
    }

    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2026-03-10",
    }

    response = requests.get(
        GITHUB_API_URL,
        params=params,
        headers=headers,
        timeout=30,
    )

    response.raise_for_status()

    return response.json()


def normalize_github_advisories(advisories):
    """
    Convert GitHub advisory records into CyberNexus
    normalized threat records.
    """

    threats = []

    for advisory in advisories:
        cvss = advisory.get("cvss") or {}

        cvss_score = cvss.get("score")

        severity = advisory.get(
            "severity",
            "unknown"
        ).capitalize()

        cve_id = advisory.get("cve_id") or "N/A"

        published = advisory.get(
            "published_at"
        ) or advisory.get(
            "updated_at"
        ) or ""

        threats.append(
            {
                "title": advisory.get(
                    "summary",
                    "GitHub Security Advisory"
                ),
                "description": advisory.get(
                    "description",
                    "No description available."
                ),
                "source": "GitHub",
                "category": "Vulnerability-Disclosure",
                "severity": severity,
                "cvssScore": cvss_score,
                "status": advisory.get(
                    "state",
                    "published"
                ).capitalize(),
                "cve": cve_id,
                "ioc": "N/A",
                "timestamp": published,
                "published": published,
                "lastModified": advisory.get(
                    "updated_at",
                    published
                ),
                "mlClassification": "Unclassified",
                "confidence": 0,
                "riskScore": 0,
                "ghsa": advisory.get(
                    "ghsa_id",
                    "N/A"
                ),
            }
        )

    return threats


if __name__ == "__main__":
    advisories = fetch_github_advisories(
        per_page=5
    )

    threats = normalize_github_advisories(
        advisories
    )

    print(
        f"Fetched {len(threats)} GitHub advisories"
    )

    for threat in threats:
        print("\n-------------------------")
        print("GHSA:", threat["ghsa"])
        print("CVE:", threat["cve"])
        print("Severity:", threat["severity"])
        print("CVSS Score:", threat["cvssScore"])
        print("Title:", threat["title"])