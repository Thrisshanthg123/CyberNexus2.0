"""
Unit Tests for Threat Graph Engine & Correlation in CyberNexus v2.
"""

import unittest
from backend_v2.graph.graph_engine import ThreatGraphEngine


class TestThreatGraphEngine(unittest.TestCase):

    def setUp(self):
        self.engine = ThreatGraphEngine()

    def test_build_bipartite_graph(self):
        threats = [
            {"id": "THR-01", "cve": "CVE-2026-0001", "title": "Daemon Overflow", "severity": "High", "riskScore": 85},
            {"id": "THR-02", "cve": "CVE-2026-0002", "title": "Web Exploit", "severity": "Medium", "riskScore": 55},
        ]
        indicators = [
            {"threatId": "THR-01", "type": "ipv4", "value": "198.51.100.1"},
            {"threatId": "THR-02", "type": "domain", "value": "malicious-c2.net"},
        ]
        correlations = self.engine.build_from_threats(threats, indicators)

        graph_dict = self.engine.to_dict()
        self.assertGreaterEqual(graph_dict["nodeCount"], 4)  # 2 threats + 2 CVEs + 2 IOCs
        self.assertEqual(len(correlations), 0)  # No shared IOCs yet

    def test_shared_ioc_correlation_and_clustering(self):
        # Two threats sharing the exact same IP indicator
        threats = [
            {"id": "THR-A", "cve": "CVE-2026-1001", "title": "Advisory A", "severity": "Critical"},
            {"id": "THR-B", "cve": "CVE-2026-1002", "title": "Advisory B", "severity": "High"},
        ]
        shared_indicators = [
            {"threatId": "THR-A", "type": "ipv4", "value": "203.0.113.55"},
            {"threatId": "THR-B", "type": "ipv4", "value": "203.0.113.55"},
        ]
        correlations = self.engine.build_from_threats(threats, shared_indicators)

        self.assertEqual(len(correlations), 1)
        self.assertEqual(correlations[0]["sourceThreatId"], "THR-A")
        self.assertEqual(correlations[0]["targetThreatId"], "THR-B")
        self.assertEqual(correlations[0]["sharedValue"], "203.0.113.55")

        clusters = self.engine.get_clusters()
        self.assertEqual(len(clusters), 1)
        self.assertIn("THR-A", clusters[0]["threatIds"])
        self.assertIn("THR-B", clusters[0]["threatIds"])

    def test_ego_network(self):
        threats = [{"id": "THR-CENTRAL", "cve": "CVE-2026-9999", "title": "Central Threat"}]
        indicators = [{"threatId": "THR-CENTRAL", "type": "domain", "value": "shared-host.org"}]
        self.engine.build_from_threats(threats, indicators)

        ego = self.engine.get_ego_network("THR-CENTRAL", radius=1)
        self.assertGreaterEqual(ego["nodeCount"], 2)
        node_ids = [n["id"] for n in ego["nodes"]]
        self.assertIn("THR-CENTRAL", node_ids)


if __name__ == "__main__":
    unittest.main()
