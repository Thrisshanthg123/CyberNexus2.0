"""
Unit Tests for Threat Intelligence Collectors in CyberNexus v2.
"""

import unittest
from backend_v2.collectors.nvd_collector import NVDCollector
from backend_v2.collectors.github_collector import GitHubCollector
from backend_v2.collectors.manager import CollectorManager


class TestCollectors(unittest.TestCase):

    def test_nvd_cvss_extraction(self):
        collector = NVDCollector()

        # CVSS v3.1
        cve_v31 = {
            "metrics": {
                "cvssMetricV31": [{"cvssData": {"baseScore": 9.8, "baseSeverity": "CRITICAL"}}]
            }
        }
        score, sev = collector.extract_cvss(cve_v31)
        self.assertEqual(score, 9.8)
        self.assertEqual(sev, "Critical")

        # CVSS v2 fallback
        cve_v2 = {
            "metrics": {
                "cvssMetricV2": [{"cvssData": {"baseScore": 7.5}}]
            }
        }
        score, sev = collector.extract_cvss(cve_v2)
        self.assertEqual(score, 7.5)
        self.assertEqual(sev, "High")

        # Missing metrics
        score, sev = collector.extract_cvss({})
        self.assertIsNone(score)
        self.assertEqual(sev, "Unknown")

    def test_github_null_severity_resilience(self):
        """CRITICAL TEST: Verify no crash when GitHub returns null severity."""
        collector = GitHubCollector()

        # Simulate raw advisory with null severity
        raw_advisories = [
            {
                "ghsa_id": "GHSA-test-null-sev",
                "cve_id": "CVE-2026-9999",
                "summary": "Sample advisory with null severity",
                "description": "Details here...",
                "severity": None,  # Null severity from GitHub API!
                "cvss": {"score": 5.0},
                "state": "reviewed"
            }
        ]

        normalized = collector.normalize_records(raw_advisories)
        self.assertEqual(len(normalized), 1)
        self.assertEqual(normalized[0]["severity"], "Unknown")
        self.assertEqual(normalized[0]["ghsa"], "GHSA-test-null-sev")
        self.assertEqual(normalized[0]["cvssScore"], 5.0)

    def test_collector_manager_status(self):
        manager = CollectorManager()
        status = manager.get_status()
        self.assertIn("nvd", status)
        self.assertIn("github", status)
        self.assertEqual(status["nvd"]["sourceId"], "nvd")
        self.assertEqual(status["github"]["sourceId"], "github")


if __name__ == "__main__":
    unittest.main()
