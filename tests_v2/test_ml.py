"""
Unit Tests for Machine Learning Classification & Risk Scoring in CyberNexus v2.
"""

import unittest
from backend_v2.ml.classifier import ThreatClassifier
from backend_v2.ml.risk_scorer import compute_risk_score


class TestThreatClassifier(unittest.TestCase):

    def setUp(self):
        self.classifier = ThreatClassifier()

    def test_classify_ransomware(self):
        text = "Adversary deployed LockBit ransomware to encrypt shadow copies and demand bitcoin extortion payment."
        result = self.classifier.predict(text)
        self.assertEqual(result["category"], "Ransomware")
        self.assertGreater(result["confidence"], 0.70)
        self.assertTrue(len(result["topFeatures"]) > 0)

    def test_classify_phishing(self):
        text = "Campaign utilizes spearphishing lure with spoofed login page and evilginx MFA bypass."
        result = self.classifier.predict(text)
        self.assertEqual(result["category"], "Phishing")
        self.assertGreater(result["confidence"], 0.65)

    def test_classify_exploit_kit(self):
        text = "Buffer overflow in RPC daemon allows remote code execution via weaponized payload."
        result = self.classifier.predict(text)
        self.assertEqual(result["category"], "Exploit-Kit")
        self.assertGreater(result["confidence"], 0.60)

    def test_classify_vulnerability_disclosure(self):
        text = "NVD security advisory for CVE-2026-0001 with CVSS 7.5. Fixed in version 2.4."
        result = self.classifier.predict(text)
        self.assertEqual(result["category"], "Vulnerability-Disclosure")

    def test_empty_or_short_input(self):
        result = self.classifier.predict("")
        self.assertEqual(result["category"], "Unclassified")
        self.assertEqual(result["confidence"], 0.0)

    def test_model_metrics(self):
        metrics = self.classifier.get_model_metrics()
        self.assertIn("accuracy", metrics)
        self.assertIn("f1Score", metrics)
        self.assertGreater(metrics["accuracy"], 0.90)


class TestRiskScorer(unittest.TestCase):

    def test_critical_cvss_score(self):
        res = compute_risk_score(cvss_score=9.8, severity="Critical", description="Remote code execution in the wild", ioc_count=3)
        self.assertGreaterEqual(res["score"], 85.0)
        self.assertLessEqual(res["score"], 100.0)
        self.assertTrue(res["isProvisional"])
        self.assertIn("cvssContribution", res["breakdown"])

    def test_missing_cvss_fallback(self):
        res = compute_risk_score(cvss_score=None, severity="High", description="Observed threat", ioc_count=1)
        self.assertGreater(res["score"], 40.0)
        self.assertIn("severityFallbackContribution", res["breakdown"])

    def test_low_severity_score(self):
        res = compute_risk_score(cvss_score=2.0, severity="Low", description="Minor flaw", ioc_count=0)
        self.assertLess(res["score"], 35.0)


if __name__ == "__main__":
    unittest.main()
