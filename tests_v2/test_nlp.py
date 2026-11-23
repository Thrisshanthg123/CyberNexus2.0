"""
Unit Tests for NLP Cleaning & IOC Entity Extraction in CyberNexus v2.
"""

import unittest
from backend_v2.nlp.cleaner import clean_threat_text
from backend_v2.nlp.ioc_extractor import extract_indicators


class TestNLPCleaner(unittest.TestCase):

    def test_clean_html_tags(self):
        dirty = "<p>Critical <b>buffer overflow</b> in Sendmail daemon.</p>"
        cleaned = clean_threat_text(dirty)
        self.assertEqual(cleaned, "Critical buffer overflow in Sendmail daemon.")

    def test_clean_html_entities(self):
        dirty = "Vulnerability in &lt;auth_module&gt; &amp; admin session."
        cleaned = clean_threat_text(dirty)
        self.assertEqual(cleaned, "Vulnerability in <auth_module> & admin session.")

    def test_defang_normalization(self):
        dirty = "Malware contacts hxxps://badsite[.]com/drop via 192[.]168[.]1[.]50."
        cleaned = clean_threat_text(dirty)
        self.assertIn("https://badsite.com/drop", cleaned)
        self.assertIn("192.168.1.50", cleaned)

    def test_empty_text(self):
        self.assertEqual(clean_threat_text(""), "")
        self.assertEqual(clean_threat_text(None), "")


class TestIOCExtractor(unittest.TestCase):

    def test_extract_cve(self):
        text = "Vulnerability CVE-2026-12345 allows privilege escalation."
        iocs = extract_indicators(text, threat_id="THR-001")
        cves = [i for i in iocs if i["type"] == "cve"]
        self.assertEqual(len(cves), 1)
        self.assertEqual(cves[0]["value"], "CVE-2026-12345")
        self.assertEqual(cves[0]["threatId"], "THR-001")

    def test_extract_ghsa(self):
        text = "Advisory GHSA-jgh3-fggc-mcpm published for Obot SSRF."
        iocs = extract_indicators(text, threat_id="THR-002")
        ghsas = [i for i in iocs if i["type"] == "ghsa"]
        self.assertEqual(len(ghsas), 1)
        self.assertEqual(ghsas[0]["value"], "GHSA-JGH3-FGGC-MCPM")

    def test_extract_ipv4(self):
        text = "Beaconing observed to 198.51.100.42 and 203.0.113.1."
        iocs = extract_indicators(text, threat_id="THR-003")
        ips = [i["value"] for i in iocs if i["type"] == "ipv4"]
        self.assertIn("198.51.100.42", ips)
        self.assertIn("203.0.113.1", ips)

    def test_extract_domains_and_urls(self):
        text = "Malware downloaded from https://threat-intel.com/payload and connects to c2.command-server.net."
        iocs = extract_indicators(text, threat_id="THR-004")
        urls = [i["value"] for i in iocs if i["type"] == "url"]
        domains = [i["value"] for i in iocs if i["type"] == "domain"]
        self.assertIn("https://threat-intel.com/payload", urls)
        self.assertIn("c2.command-server.net", domains)

    def test_extract_hashes(self):
        sha256 = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
        md5 = "e99a18c428cb38d5f260853678922e03"
        text = f"Payload hashes: SHA256 {sha256} and MD5 {md5}."
        iocs = extract_indicators(text, threat_id="THR-005")
        hash256 = [i["value"] for i in iocs if i["type"] == "hash_sha256"]
        hash_md5 = [i["value"] for i in iocs if i["type"] == "hash_md5"]
        self.assertIn(sha256, hash256)
        self.assertIn(md5, hash_md5)

    def test_extract_mitre(self):
        text = "Adversary utilized technique T1059 and T1059.001 for execution."
        iocs = extract_indicators(text, threat_id="THR-006")
        mitres = [i["value"] for i in iocs if i["type"] == "mitre"]
        self.assertIn("T1059", mitres)
        self.assertIn("T1059.001", mitres)


if __name__ == "__main__":
    unittest.main()
