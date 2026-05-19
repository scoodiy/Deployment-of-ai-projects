import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

class TestTradesAPI:
    def test_health(self):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"
    
    def test_register_and_login(self):
        resp = client.post("/api/v1/users/register", json={
            "username": "testuser", "email": "test@test.com", "password": "test123"
        })
        assert resp.status_code == 200
        
        resp = client.post("/api/v1/users/login", json={
            "username": "testuser", "password": "test123"
        })
        assert resp.status_code == 200
        assert "access_token" in resp.json()
    
    def test_create_order_without_auth(self):
        resp = client.post("/api/v1/trades/orders", json={
            "symbol": "BTCUSDT", "side": "BUY", "type": "LIMIT", "quantity": 1.0, "price": 65000
        })
        assert resp.status_code == 403  # No auth header
