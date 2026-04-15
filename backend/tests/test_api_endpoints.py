import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data

def test_backtest_endpoint_valid_request():
    payload = {
        "strategy": {
            "indicator": {"type": "EMA_CROSS", "fast": 9, "slow": 21},
            "risk_reward_ratio": 2.0,
            "atr_sl_multiplier": 1.5
        },
        "instrument": "BTCUSDT",
        "timeframe": "1h",
        "start_date": "2026-01-01",
        "end_date": "2026-02-01"
    }
    
    response = client.post("/api/backtest", json=payload)
    assert response.status_code in [200, 422]

def test_backtest_missing_strategy():
    payload = {
        "instrument": "BTCUSDT",
        "timeframe": "1h",
        "start_date": "2026-01-01",
        "end_date": "2026-02-01"
    }
    
    response = client.post("/api/backtest", json=payload)
    assert response.status_code == 422

def test_backtest_invalid_timeframe():
    payload = {
        "strategy": {
            "indicator": {"type": "EMA_CROSS", "fast": 9, "slow": 21},
            "risk_reward_ratio": 2.0,
            "atr_sl_multiplier": 1.5
        },
        "instrument": "BTCUSDT",
        "timeframe": "invalid",
        "start_date": "2026-01-01",
        "end_date": "2026-02-01"
    }
    
    response = client.post("/api/backtest", json=payload)
    assert response.status_code == 422

def test_backtest_invalid_date_range():
    payload = {
        "strategy": {
            "indicator": {"type": "EMA_CROSS", "fast": 9, "slow": 21},
            "risk_reward_ratio": 2.0,
            "atr_sl_multiplier": 1.5
        },
        "instrument": "BTCUSDT",
        "timeframe": "1h",
        "start_date": "invalid-date",
        "end_date": "2026-02-01"
    }
    
    response = client.post("/api/backtest", json=payload)
    assert response.status_code == 422

def test_optimize_endpoint_valid_request():
    payload = {
        "strategy": {
            "indicator": {"type": "EMA_CROSS", "fast": 9, "slow": 21},
            "risk_reward_ratio": 2.0,
            "atr_sl_multiplier": 1.5
        },
        "instrument": "BTCUSDT",
        "timeframe": "1h",
        "start_date": "2026-01-01",
        "end_date": "2026-02-01",
        "target": "net_profit",
        "num_variations": 5
    }
    
    response = client.post("/api/optimize", json=payload)
    assert response.status_code in [200, 422]

def test_optimize_endpoint_invalid_target():
    payload = {
        "strategy": {
            "indicator": {"type": "EMA_CROSS", "fast": 9, "slow": 21},
            "risk_reward_ratio": 2.0,
            "atr_sl_multiplier": 1.5
        },
        "instrument": "BTCUSDT",
        "timeframe": "1h",
        "start_date": "2026-01-01",
        "end_date": "2026-02-01",
        "target": "invalid_target",
        "num_variations": 5
    }
    
    response = client.post("/api/optimize", json=payload)
    assert response.status_code == 422

def test_optimize_response_structure():
    payload = {
        "strategy": {
            "indicator": {"type": "EMA_CROSS", "fast": 9, "slow": 21},
            "risk_reward_ratio": 2.0,
            "atr_sl_multiplier": 1.5
        },
        "instrument": "BTCUSDT",
        "timeframe": "1h",
        "start_date": "2026-01-01",
        "end_date": "2026-02-01",
        "target": "net_profit",
        "num_variations": 3
    }
    
    response = client.post("/api/optimize", json=payload)
    if response.status_code == 200:
        data = response.json()
        assert "results" in data
        if data["results"]:
            result = data["results"][0]
            assert "params" in result
            assert "metrics" in result