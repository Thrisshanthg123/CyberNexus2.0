"""
Integration Tests for Flask API v2 Endpoints.
"""

import json
import unittest
from backend_v2.api.app import create_app
from backend_v2.database.connection import Base, engine, get_session
from backend_v2.database.repository import ThreatRepository


class TestAPIEndpoints(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.app = create_app({"TESTING": True})
        cls.client = cls.app.test_client()

        # Seed sample threat for API test verification
        with get_session() as session:
            threat = {
                "id": "THR-TEST-API-01",
                "cve": "CVE-2026-7777",
                "title": "API Verification Vulnerability",
                "description": "Buffer overflow in test server resolving 198.51.100.99.",
                "source": "NVD",
                "severity": "Critical",
                "cvssScore": 9.5,
                "status": "New",
                "mlClassification": "Exploit-Kit",
                "confidence": 0.92,
                "riskScore": 90.0,
            }
            ThreatRepository.upsert_threat(threat, session)

    def test_health_endpoint(self):
        resp = self.client.get("/api/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertEqual(data["status"], "online")
        self.assertEqual(data["version"], "2.0.0")
        self.assertEqual(data["port"], 5001)

    def test_threats_list_endpoint(self):
        resp = self.client.get("/api/threats")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("threats", data)
        self.assertIn("count", data)
        self.assertGreaterEqual(data["count"], 1)

    def test_threats_filter_by_severity(self):
        resp = self.client.get("/api/threats?severity=critical")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        for t in data["threats"]:
            self.assertEqual(t["severity"].lower(), "critical")

    def test_threat_details_endpoint(self):
        resp = self.client.get("/api/threats/THR-TEST-API-01")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertEqual(data["id"], "THR-TEST-API-01")
        self.assertEqual(data["cve"], "CVE-2026-7777")

    def test_threat_details_not_found(self):
        resp = self.client.get("/api/threats/NON-EXISTENT-THREAT-999")
        self.assertEqual(resp.status_code, 404)

    def test_iocs_endpoint(self):
        resp = self.client.get("/api/iocs")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("iocs", data)

    def test_graph_endpoint(self):
        resp = self.client.get("/api/graph")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("nodes", data)
        self.assertIn("links", data)

    def test_ml_metrics_endpoint(self):
        resp = self.client.get("/api/ml/metrics")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("accuracy", data)
        self.assertIn("f1Score", data)

    def test_ml_classify_endpoint(self):
        payload = {"text": "LockBit ransomware encryption attack demanding bitcoin"}
        resp = self.client.post("/api/ml/classify", data=json.dumps(payload), content_type="application/json")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertEqual(data["category"], "Ransomware")

    def test_campaigns_endpoint(self):
        resp = self.client.get("/api/campaigns")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("campaigns", data)

    def test_analytics_endpoint(self):
        resp = self.client.get("/api/analytics")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("totalThreats", data)
        self.assertIn("bySeverity", data)

    def test_sources_endpoint(self):
        resp = self.client.get("/api/sources")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("sources", data)

    def test_cors_headers(self):
        resp = self.client.get("/api/health", headers={"Origin": "http://localhost:5173"})
        self.assertEqual(resp.headers.get("Access-Control-Allow-Origin"), "http://localhost:5173")


if __name__ == "__main__":
    unittest.main()
