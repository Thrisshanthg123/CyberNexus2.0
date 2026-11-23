"""
Unit tests for Analysis API endpoints (backend/api/routes/analysis.py).

Verifies:
1. GET /api/analysis returns 200 and list of processed records
2. GET /api/analysis/shared returns 200 and shared indicators
3. Existing routes (e.g. /api/health) remain intact and functioning
"""

import pytest
from backend.api.app import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_api_health_untouched(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    json_data = res.get_json()
    assert json_data["status"] == "online"
    assert json_data["service"] == "CyberNexus API"


def test_get_analysis_endpoint(client):
    res = client.get("/api/analysis")
    assert res.status_code == 200
    json_data = res.get_json()
    assert isinstance(json_data, list)
    assert len(json_data) > 0
    first = json_data[0]
    assert "id" in first
    assert "source" in first
    assert "iocs" in first
    assert "riskScore" in first
    assert "riskBreakdown" in first


def test_get_analysis_shared_endpoint(client):
    res = client.get("/api/analysis/shared")
    assert res.status_code == 200
    json_data = res.get_json()
    assert isinstance(json_data, list)
