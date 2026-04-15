import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_backtest_with_rsi_indicator():
    strategy_data = {
        "indicator": {
            "type": "RSI",
            "period": 14
        },
        "entry_condition": "rsi < 30",
        "exit_condition": "rsi > 70",
        "risk_reward_ratio": 2.0,
        "atr_sl_multiplier": 1.5,
        "risk_per_trade": 100.0
    }
    
    response = client.post("/backtest", json=strategy_data)
    assert response.status_code == 200
    data = response.json()
    assert 'trade_logs' in data
    assert 'total_trades' in data

def test_backtest_error_handling():
    invalid_strategy = {
        "indicator": {},
        "entry_condition": "",
        "exit_condition": "",
        "risk_reward_ratio": -1.0,
        "atr_sl_multiplier": 0.0,
        "risk_per_trade": 0.0
    }
    
    response = client.post("/backtest", json=invalid_strategy)
    assert response.status_code in [200, 422]

def test_backtest_metrics_calculation():
    strategy_data = {
        "indicator": {"type": "EMA_CROSS", "fast": 9, "slow": 21},
        "entry_condition": "price > ema",
        "exit_condition": "price < ema",
        "risk_reward_ratio": 2.0,
        "atr_sl_multiplier": 1.5,
        "risk_per_trade": 100.0
    }
    
    response = client.post("/backtest", json=strategy_data)
    assert response.status_code == 200
    
    data = response.json()
    assert 'win_rate' in data
    assert 'net_profit' in data
    assert 'max_drawdown' in data
    assert 'total_trades' in data
    assert 'trade_logs' in data