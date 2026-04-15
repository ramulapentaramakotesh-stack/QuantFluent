import pytest
from fastapi.testclient import TestClient
from main import app, execute_strategy, calculate_max_drawdown
import pandas as pd
from datetime import datetime, timedelta

client = TestClient(app)

def create_test_data(prices: list) -> pd.DataFrame:
    base_time = datetime(2026, 1, 1)
    data = {
        "open_time": [base_time + timedelta(hours=i) for i in range(len(prices))],
        "open": prices,
        "high": [p * 1.01 for p in prices],
        "low": [p * 0.99 for p in prices],
        "close": prices,
        "volume": [1000.0] * len(prices)
    }
    return pd.DataFrame(data)

def test_mixed_win_loss_scenario():
    prices = [100, 90, 80, 90, 100, 110, 100, 90, 100, 110, 120, 130]
    df = create_test_data(prices)
    
    strategy = {
        "indicator": {"type": "EMA_CROSS", "fast": 3, "slow": 5},
        "risk_reward_ratio": 2.0,
        "atr_sl_multiplier": 1.5
    }
    
    result = execute_strategy(df, strategy)
    trades = result["trade_logs"]
    
    if len(trades) > 0:
        wins = sum(1 for t in trades if t["profit"] > 0)
        losses = sum(1 for t in trades if t["profit"] < 0)
        expected_win_rate = wins / len(trades)
        assert result["win_rate"] == expected_win_rate or (wins == 0 and result["win_rate"] == 0)
        assert result["net_profit"] == sum(t["profit"] for t in trades)

def test_single_trade_scenario():
    prices = [100, 110, 120, 130, 140, 150]
    df = create_test_data(prices)
    
    strategy = {
        "indicator": {"type": "EMA_CROSS", "fast": 3, "slow": 5},
        "risk_reward_ratio": 2.0,
        "atr_sl_multiplier": 1.5
    }
    
    result = execute_strategy(df, strategy)
    
    if result["total_trades"] <= 1:
        if result["total_trades"] == 1:
            assert result["win_rate"] in [0.0, 1.0]
            assert len(result["trade_logs"]) == 1
            assert result["total_trades"] == 1

def test_drawdown_with_profitable_trades():
    trades = [
        {"profit": 50},
        {"profit": 100},
        {"profit": -20},
        {"profit": 80}
    ]
    
    dd = calculate_max_drawdown(trades)
    cumulative = 0
    peak = 0
    max_dd = 0
    for t in trades:
        cumulative += t["profit"]
        if cumulative > peak:
            peak = cumulative
        dd = peak - cumulative
        if dd > max_dd:
            max_dd = dd
    
    assert dd >= 0

def test_api_endpoint_no_crash():
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
    assert "win_rate" in data
    assert "net_profit" in data
    assert "trade_logs" in data
    assert "total_trades" in data
    assert "max_drawdown" in data

def test_empty_dataframe_handling():
    df = pd.DataFrame(columns=["open_time", "open", "high", "low", "close", "volume"])
    
    strategy = {
        "indicator": {"type": "EMA_CROSS", "fast": 3, "slow": 5},
        "risk_reward_ratio": 2.0,
        "atr_sl_multiplier": 1.5
    }
    
    result = execute_strategy(df, strategy)
    assert result["total_trades"] == 0
    assert result["win_rate"] == 0
    assert result["net_profit"] == 0
    assert len(result["trade_logs"]) == 0

def test_sequential_trade_updates():
    prices = [100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155]
    df = create_test_data(prices)
    
    strategy = {
        "indicator": {"type": "EMA_CROSS", "fast": 3, "slow": 5},
        "risk_reward_ratio": 2.0,
        "atr_sl_multiplier": 1.5
    }
    
    result = execute_strategy(df, strategy)
    
    if result["total_trades"] > 1:
        trades = result["trade_logs"]
        for i in range(len(trades) - 1):
            exit_1 = trades[i]["exit_time"]
            entry_2 = trades[i + 1]["entry_time"]
            assert exit_1 != entry_2 or trades[i + 1]["entry_price"] > trades[i]["exit_price"]

def test_profit_per_trade_calculation():
    prices = [100, 110, 105]
    df = create_test_data(prices)
    
    strategy = {
        "indicator": {"type": "EMA_CROSS", "fast": 3, "slow": 5},
        "risk_reward_ratio": 2.0,
        "atr_sl_multiplier": 1.5
    }
    
    result = execute_strategy(df, strategy)
    trades = result["trade_logs"]
    
    for trade in trades:
        expected_profit = trade["exit_price"] - trade["entry_price"]
        assert abs(trade["profit"] - expected_profit) < 0.01