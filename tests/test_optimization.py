import pytest
import random
from main import generate_parameter_variations, run_optimization, execute_strategy
import pandas as pd
from datetime import datetime, timedelta

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

def test_generate_parameter_variations():
    base_strategy = {
        "indicator": {"type": "EMA_CROSS", "fast": 9, "slow": 21},
        "risk_reward_ratio": 2.0,
        "atr_sl_multiplier": 1.5
    }
    
    variations = generate_parameter_variations(base_strategy, num_variations=5)
    
    assert len(variations) == 5
    for var in variations:
        assert "indicator" in var
        assert "risk_reward_ratio" in var
        assert "atr_sl_multiplier" in var

def test_parameter_variations_different():
    base_strategy = {
        "indicator": {"type": "EMA_CROSS", "fast": 9, "slow": 21},
        "risk_reward_ratio": 2.0,
        "atr_sl_multiplier": 1.5
    }
    
    variations = generate_parameter_variations(base_strategy, num_variations=10)
    
    fast_values = [v["indicator"]["fast"] for v in variations]
    assert len(set(fast_values)) > 1

def test_optimization_returns_ranked_results():
    prices = [100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155,
             100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155]
    df = create_test_data(prices)
    
    base_strategy = {
        "indicator": {"type": "EMA_CROSS", "fast": 9, "slow": 21},
        "risk_reward_ratio": 2.0,
        "atr_sl_multiplier": 1.5
    }
    
    results = run_optimization(df, base_strategy, num_variations=5, target="net_profit")
    
    assert len(results) == 5
    for r in results:
        assert "params" in r
        assert "metrics" in r

def test_optimization_ranking_by_net_profit():
    base_strategy = {
        "indicator": {"type": "EMA_CROSS", "fast": 9, "slow": 21},
        "risk_reward_ratio": 2.0,
        "atr_sl_multiplier": 1.5
    }
    
    prices = [100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155]
    df = create_test_data(prices)
    
    results = run_optimization(df, base_strategy, num_variations=3, target="net_profit")
    
    if len(results) > 1:
        for i in range(len(results) - 1):
            assert results[i]["metrics"]["net_profit"] >= results[i + 1]["metrics"]["net_profit"]

def test_optimization_ranking_by_win_rate():
    base_strategy = {
        "indicator": {"type": "EMA_CROSS", "fast": 9, "slow": 21},
        "risk_reward_ratio": 2.0,
        "atr_sl_multiplier": 1.5
    }
    
    prices = [100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155]
    df = create_test_data(prices)
    
    results = run_optimization(df, base_strategy, num_variations=3, target="win_rate")
    
    if len(results) > 1:
        for i in range(len(results) - 1):
            assert results[i]["metrics"]["win_rate"] >= results[i + 1]["metrics"]["win_rate"]

def test_optimization_minimize_drawdown():
    base_strategy = {
        "indicator": {"type": "EMA_CROSS", "fast": 9, "slow": 21},
        "risk_reward_ratio": 2.0,
        "atr_sl_multiplier": 1.5
    }
    
    prices = [100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155]
    df = create_test_data(prices)
    
    results = run_optimization(df, base_strategy, num_variations=3, target="max_drawdown")
    
    if len(results) > 1:
        for i in range(len(results) - 1):
            assert results[i]["metrics"]["max_drawdown"] <= results[i + 1]["metrics"]["max_drawdown"]

def test_optimization_isolated_runs():
    random.seed(42)
    base_strategy = {
        "indicator": {"type": "EMA_CROSS", "fast": 9, "slow": 21},
        "risk_reward_ratio": 2.0,
        "atr_sl_multiplier": 1.5
    }
    
    prices = [100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155]
    df = create_test_data(prices)
    
    results1 = run_optimization(df, base_strategy, num_variations=3, target="net_profit")
    
    random.seed(42)
    results2 = run_optimization(df, base_strategy, num_variations=3, target="net_profit")
    
    assert len(results1) == len(results2)
    for r1, r2 in zip(results1, results2):
        assert r1["params"] == r2["params"]
        assert r1["metrics"] == r2["metrics"]

def test_no_trades_optimization():
    prices = [100] * 50
    df = create_test_data(prices)
    
    base_strategy = {
        "indicator": {"type": "EMA_CROSS", "fast": 9, "slow": 21},
        "risk_reward_ratio": 2.0,
        "atr_sl_multiplier": 1.5
    }
    
    results = run_optimization(df, base_strategy, num_variations=3, target="net_profit")
    
    assert len(results) == 3
    for r in results:
        assert "metrics" in r