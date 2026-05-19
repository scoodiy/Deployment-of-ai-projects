import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

class TestStrategiesAPI:
    def test_strategies_without_auth(self):
        resp = client.get("/api/v1/strategies/")
        assert resp.status_code == 403
