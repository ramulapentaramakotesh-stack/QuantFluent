import pytest
from fastapi.testclient import TestClient
from main import app, execute_strategy, calculate_max_drawdown
import pandas as pd
import numpy as np
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

def test_win_rate_calculation_all_wins():
    prices = [100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155]
    df = create_test_data(prices)
    
    strategy = {
        "indicator": {"type": "EMA_CROSS", "fast": 3, "slow": 5},
        "risk_reward_ratio": 2.0,
        "atr_sl_multiplier": 1.5
    }
    
    result = execute_strategy(df, strategy)
    trades = result["trade_logs"]
    
    if len(trades) > 0:
        expected_wins = sum(1 for t in trades if t["profit"] > 0)
        expected_win_rate = expected_wins / len(trades)
        assert abs(result["win_rate"] - expected_win_rate) < 0.01

def test_win_rate_calculation_all_losses():
    prices = [150, 145, 140, 135, 130, 125, 120, 115, 110, 105, 100, 95]
    df = create_test_data(prices)
    
    strategy = {
        "indicator": {"type": "EMA_CROSS", "fast": 3, "slow": 5},
        "risk_reward_ratio": 2.0,
        "atr_sl_multiplier": 1.5
    }
    
    result = execute_strategy(df, strategy)
    trades = result["trade_logs"]
    
    if len(trades) > 0:
        expected_losses = sum(1 for t in trades if t["profit"] < 0)
        expected_win_rate = 0 if len(trades) == 0 else (len(trades) - expected_losses) / len(trades)
        assert result["win_rate"] == expected_win_rate

def test_net_profit_calculation():
    prices = [100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155]
    df = create_test_data(prices)
    
    strategy = {
        "indicator": {"type": "EMA_CROSS", "fast": 3, "slow": 5},
        "risk_reward_ratio": 2.0,
        "atr_sl_multiplier": 1.5
    }
    
    result = execute_strategy(df, strategy)
    trades = result["trade_logs"]
    
    if len(trades) > 0:
        expected_profit = sum(t["profit"] for t in trades)
        assert abs(result["net_profit"] - expected_profit) < 0.01

def test_max_drawdown_calculation():
    trades = [
        {"profit": 100},
        {"profit": -50},
        {"profit": -30},
        {"profit": 200},
        {"profit": -100},
        {"profit": -50}
    ]
    
    dd = calculate_max_drawdown(trades)
    assert dd >= 0

def test_max_drawdown_no_trades():
    dd = calculate_max_drawdown([])
    assert dd == 0.0

def test_trade_log_completeness():
    prices = [100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155]
    df = create_test_data(prices)
    
    strategy = {
        "indicator": {"type": "EMA_CROSS", "fast": 3, "slow": 5},
        "risk_reward_ratio": 2.0,
        "atr_sl_multiplier": 1.5
    }
    
    result = execute_strategy(df, strategy)
    trades = result["trade_logs"]
    
    for trade in trades:
        assert "entry_time" in trade
        assert "exit_time" in trade
        assert "entry_price" in trade
        assert "exit_price" in trade
        assert "profit" in trade
        assert trade["exit_price"] != trade["entry_price"]

def test_no_trades_edge_case():
    prices = [100] * 50
    df = create_test_data(prices)
    
    strategy = {
        "indicator": {"type": "EMA_CROSS", "fast": 3, "slow": 5},
        "risk_reward_ratio": 2.0,
        "atr_sl_multiplier": 1.5
    }
    
    result = execute_strategy(df, strategy)
    assert result["total_trades"] == 0
    assert result["win_rate"] == 0
    assert result["net_profit"] == 0

def test_total_trades_matches_log_length():
    prices = [100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155]
    df = create_test_data(prices)
    
    strategy = {
        "indicator": {"type": "EMA_CROSS", "fast": 3, "slow": 5},
        "risk_reward_ratio": 2.0,
        "atr_sl_multiplier": 1.5
    }
    
    result = execute_strategy(df, strategy)
    assert result["total_trades"] == len(result["trade_logs"])