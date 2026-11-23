"""
Unit Tests for Database Models & Repository in CyberNexus v2.
"""

import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend_v2.database.models import Base, Threat, Indicator
from backend_v2.database.repository import ThreatRepository


class TestDatabaseRepository(unittest.TestCase):

    def setUp(self):
        # Use isolated in-memory SQLite engine for tests
        self.engine = create_engine("sqlite:///:memory:", echo=False)
        Base.metadata.create_all(bind=self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.session = self.Session()

    def tearDown(self):
        self.session.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_upsert_and_retrieve_threat(self):
        threat_dict = {
            "id": "THR-TEST-001",
            "cve": "CVE-2026-0001",
            "title": "Test Vulnerability",
            "description": "Test description",
            "source": "NVD",
            "severity": "Critical",
            "cvssScore": 9.8,
            "status": "New",
            "mlClassification": "Exploit-Kit",
            "confidence": 0.88,
            "riskScore": 95.0,
        }
        ThreatRepository.upsert_threat(threat_dict, self.session)
        self.session.commit()

        retrieved = ThreatRepository.get_threat("THR-TEST-001", self.session)
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.title, "Test Vulnerability")
        self.assertEqual(retrieved.severity, "Critical")
        self.assertEqual(retrieved.cvss_score, 9.8)

    def test_query_threats_with_filters(self):
        threats = [
            {"id": "THR-1", "title": "NVD Vuln", "source": "NVD", "severity": "High", "published": "2026-01-01"},
            {"id": "THR-2", "title": "GitHub Advisory", "source": "GitHub", "severity": "Medium", "published": "2026-01-02"},
            {"id": "THR-3", "title": "NVD Zero Day", "source": "NVD", "severity": "Critical", "published": "2026-01-03"},
        ]
        ThreatRepository.upsert_threats_bulk(threats, self.session)
        self.session.commit()

        # Filter by source
        items, total = ThreatRepository.list_threats(self.session, source="nvd")
        self.assertEqual(total, 2)

        # Filter by severity
        items, total = ThreatRepository.list_threats(self.session, severity="critical")
        self.assertEqual(total, 1)
        self.assertEqual(items[0].id, "THR-3")

        # Search query
        items, total = ThreatRepository.list_threats(self.session, search="Zero Day")
        self.assertEqual(total, 1)

    def test_save_and_list_indicators(self):
        threat = {"id": "THR-IOC-01", "title": "Advisory with IOC", "source": "NVD"}
        ThreatRepository.upsert_threat(threat, self.session)
        self.session.commit()

        iocs = [
            {"threatId": "THR-IOC-01", "type": "ipv4", "value": "198.51.100.22", "context": "...observed 198.51.100.22..."},
            {"threatId": "THR-IOC-01", "type": "domain", "value": "test-c2.org", "context": "...domain test-c2.org..."},
        ]
        ThreatRepository.save_indicators(iocs, self.session)
        self.session.commit()

        retrieved_iocs, total = ThreatRepository.list_indicators(self.session)
        self.assertEqual(total, 2)

        retrieved_threat = ThreatRepository.get_threat("THR-IOC-01", self.session)
        threat_dict = retrieved_threat.to_dict(include_indicators=True)
        self.assertEqual(len(threat_dict["indicators"]), 2)

    def test_analytics_summary(self):
        threats = [
            {"id": "T1", "source": "NVD", "severity": "Critical"},
            {"id": "T2", "source": "GitHub", "severity": "High"},
        ]
        ThreatRepository.upsert_threats_bulk(threats, self.session)
        self.session.commit()

        stats = ThreatRepository.get_analytics_summary(self.session)
        self.assertEqual(stats["totalThreats"], 2)
        self.assertEqual(stats["bySeverity"]["critical"], 1)
        self.assertEqual(stats["bySeverity"]["high"], 1)
        self.assertEqual(stats["bySource"]["nvd"], 1)
        self.assertEqual(stats["bySource"]["github"], 1)


if __name__ == "__main__":
    unittest.main()
