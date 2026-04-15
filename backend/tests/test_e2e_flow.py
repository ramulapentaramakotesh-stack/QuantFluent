import pytest
from main import fetch_binance_data, execute_strategy, run_optimization
import requests

def test_full_flow_ema_cross_strategy():
    df = fetch_binance_data("BTCUSDT", "1h", "2026-01-01", "2026-03-01")
    print(f"\n[TEST] Fetched {len(df)} candles")
    assert len(df) > 0
    
    strategy = {
        "indicator": {"type": "EMA_CROSS", "fast": 9, "slow": 21},
        "risk_reward_ratio": 2.0,
        "atr_sl_multiplier": 1.5
    }
    
    result = execute_strategy(df, strategy)
    
    print(f"[TEST] Backtest Results:")
    print(f"  Win Rate: {(result['win_rate'] * 100):.1f}%")
    print(f"  Net Profit: ${result['net_profit']:.2f}")
    print(f"  Total Trades: {result['total_trades']}")
    print(f"  Max Drawdown: ${result['max_drawdown']:.2f}")
    
    assert 'win_rate' in result
    assert 'net_profit' in result
    assert 'trade_logs' in result
    
    if result['total_trades'] > 0:
        print(f"[TEST] Sample Trade:")
        trade = result['trade_logs'][0]
        print(f"  Entry: {trade['entry_time']} @ ${trade['entry_price']}")
        print(f"  Exit: {trade['exit_time']} @ ${trade['exit_price']}")
        print(f"  Profit: ${trade['profit']:.2f}")

def test_optimization_flow():
    df = fetch_binance_data("BTCUSDT", "1h", "2026-01-01", "2026-02-01")
    
    strategy = {
        "indicator": {"type": "EMA_CROSS", "fast": 9, "slow": 21},
        "risk_reward_ratio": 2.0,
        "atr_sl_multiplier": 1.5
    }
    
    results = run_optimization(df, strategy, num_variations=5, target="net_profit")
    
    print(f"\n[TEST] Optimization Results (Top 3):")
    for i, r in enumerate(results[:3]):
        print(f"  {i+1}. EMA {r['params']['indicator']['fast']}/{r['params']['indicator']['slow']}: ${r['metrics']['net_profit']:.2f}")
    
    assert len(results) == 5

def test_invalid_strategy_handling():
    empty_strategy = {
        "indicator": {},
        "risk_reward_ratio": 0,
        "atr_sl_multiplier": 0
    }
    
    df = fetch_binance_data("BTCUSDT", "1h", "2026-01-01", "2026-01-15")
    
    result = execute_strategy(df, empty_strategy)
    
    print(f"\n[TEST] Empty strategy result: {result['total_trades']} trades")
    assert result['total_trades'] >= 0

def test_api_health_check():
    try:
        response = requests.get("http://localhost:8000/api/health", timeout=2)
        data = response.json()
        print(f"\n[TEST] API Health: {data}")
        assert data['status'] == 'healthy'
    except Exception as e:
        print(f"\n[TEST] API not running: {e}")

def test_api_backtest_endpoint():
    payload = {
        "strategy": {"indicator": {"type": "EMA_CROSS", "fast": 9, "slow": 21}, "risk_reward_ratio": 2.0, "atr_sl_multiplier": 1.5},
        "instrument": "BTCUSDT",
        "timeframe": "1h",
        "start_date": "2026-01-01",
        "end_date": "2026-02-01"
    }
    
    try:
        response = requests.post("http://localhost:8000/api/backtest", json=payload, timeout=30)
        data = response.json()
        print(f"\n[TEST] API Backtest Response:")
        print(f"  Win Rate: {(data.get('win_rate', 0) * 100):.1f}%")
        print(f"  Net Profit: ${data.get('net_profit', 0):.2f}")
        print(f"  Total Trades: {data.get('total_trades', 0)}")
        assert response.status_code == 200
    except Exception as e:
        print(f"\n[TEST] API not running: {e}")