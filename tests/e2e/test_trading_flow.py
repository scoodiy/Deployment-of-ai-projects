import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

class TestTradingFlow:
    def test_full_flow(self):
        # Register
        resp = client.post("/api/v1/users/register", json={
            "username": "e2e_user", "email": "e2e@test.com", "password": "pass123"
        })
        assert resp.status_code == 200
        
        # Login
        resp = client.post("/api/v1/users/login", json={
            "username": "e2e_user", "password": "pass123"
        })
        assert resp.status_code == 200
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create order
        resp = client.post("/api/v1/trades/orders", json={
            "symbol": "BTCUSDT", "side": "BUY", "type": "LIMIT", "quantity": 0.5, "price": 65000
        }, headers=headers)
        assert resp.status_code == 200
        order_id = resp.json()["id"]
        
        # Get orders
        resp = client.get("/api/v1/trades/orders", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) >= 1
        
        # Get positions
        resp = client.get("/api/v1/trades/positions", headers=headers)
        assert resp.status_code == 200
        
        # Get portfolio
        resp = client.get("/api/v1/trades/portfolio", headers=headers)
        assert resp.status_code == 200
        
        # Cancel order
        resp = client.delete(f"/api/v1/trades/orders/{order_id}", headers=headers)
        assert resp.status_code == 200
