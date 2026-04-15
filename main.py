from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import numpy as np
import requests
from datetime import datetime
from typing import List, Dict, Any
import random

app = FastAPI()

class StrategyRequest(BaseModel):
    indicator: dict
    entry_condition: str
    exit_condition: str
    risk_reward_ratio: float
    atr_sl_multiplier: float
    risk_per_trade: float

class BacktestResult(BaseModel):
    win_rate: float
    net_profit: float
    trade_logs: list

TIMEFRAME_MAP = {
    "1m": "1m", "5m": "5m", "15m": "15m",
    "30m": "30m", "1h": "1h", "4h": "4h", "1d": "1d"
}

BINANCE_API = "https://api.binance.com/api/v3/klines"

def fetch_binance_data(symbol: str, timeframe: str, start_date: str, end_date: str) -> pd.DataFrame:
    symbol = symbol.upper()
    if not symbol.endswith("USDT"):
        symbol = symbol + "USDT"
    
    tf = TIMEFRAME_MAP.get(timeframe, "1h")
    start_ts = int(datetime.strptime(start_date, "%Y-%m-%d").timestamp() * 1000)
    end_ts = int(datetime.strptime(end_date, "%Y-%m-%d").timestamp() * 1000)
    
    all_klines = []
    while start_ts < end_ts:
        params = {
            "symbol": symbol,
            "interval": tf,
            "startTime": start_ts,
            "endTime": end_ts,
            "limit": 1000
        }
        resp = requests.get(BINANCE_API, params=params, timeout=10)
        klines = resp.json()
        if not klines:
            break
        all_klines.extend(klines)
        start_ts = klines[-1][0] + 1
    
    if not all_klines:
        return pd.DataFrame()
    
    df = pd.DataFrame(all_klines, columns=[
        "open_time", "open", "high", "low", "close", "volume",
        "close_time", "quote_volume", "trades", "taker_buy_base",
        "taker_buy_quote", "ignore"
    ])
    
    df["open"] = df["open"].astype(float)
    df["high"] = df["high"].astype(float)
    df["low"] = df["low"].astype(float)
    df["close"] = df["close"].astype(float)
    df["volume"] = df["volume"].astype(float)
    df["open_time"] = pd.to_datetime(df["open_time"], unit="ms")
    
    return df[["open_time", "open", "high", "low", "close", "volume"]]

def calculate_ema(prices: pd.Series, period: int) -> pd.Series:
    return prices.ewm(span=period, adjust=False).mean()

def calculate_rsi(prices: pd.Series, period: int = 14) -> pd.Series:
    delta = prices.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

def calculate_atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    high_low = df["high"] - df["low"]
    high_close = np.abs(df["high"] - df["close"].shift())
    low_close = np.abs(df["low"] - df["close"].shift())
    true_range = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
    return true_range.rolling(window=period).mean()

def calculate_indicators(df: pd.DataFrame, indicator_config: dict) -> pd.DataFrame:
    indicator_type = indicator_config.get("type", "")
    
    if indicator_type == "EMA_CROSS":
        df["ema_fast"] = calculate_ema(df["close"], indicator_config.get("fast", 9))
        df["ema_slow"] = calculate_ema(df["close"], indicator_config.get("slow", 21))
    elif indicator_type == "RSI":
        df["rsi"] = calculate_rsi(df["close"], indicator_config.get("period", 14))
    elif indicator_type == "ATR":
        df["atr"] = calculate_atr(df, indicator_config.get("period", 14))
    
    return df

def calculate_max_drawdown(trades: List[Dict]) -> float:
    if not trades:
        return 0.0
    cumulative = 0.0
    max_dd = 0.0
    peak = 0.0
    for trade in trades:
        cumulative += trade.get("profit", 0)
        if cumulative > peak:
            peak = cumulative
        dd = peak - cumulative
        if dd > max_dd:
            max_dd = dd
    return max_dd

def execute_strategy(df: pd.DataFrame, strategy: dict) -> dict:
    df = df.copy()
    indicator = strategy.get("indicator", {})
    indicator_type = indicator.get("type", "")
    
    df = calculate_indicators(df, indicator)
    
    atr_multiplier = strategy.get("atr_sl_multiplier", 1.5)
    rr = strategy.get("risk_reward_ratio", 2.0)
    
    trades = []
    in_trade = False
    entry_time = None
    entry_price = 0
    stop_loss = 0
    take_profit = 0
    
    df = df.dropna(subset=["close"])
    
    for idx, row in df.iterrows():
        if indicator_type == "EMA_CROSS":
            ema_fast = row.get("ema_fast")
            ema_slow = row.get("ema_slow")
            if pd.isna(ema_fast) or pd.isna(ema_slow):
                continue
                
            if not in_trade:
                if row["close"] > ema_slow:
                    in_trade = True
                    entry_time = row["open_time"]
                    entry_price = row["close"]
                    
                    if "atr" in df.columns and not pd.isna(row.get("atr")):
                        stop_loss = entry_price - (row["atr"] * atr_multiplier)
                    else:
                        stop_loss = entry_price * 0.98
                        
                    take_profit = entry_price + (entry_price - stop_loss) * rr
                    
            else:
                if row["close"] < ema_fast or row["close"] < stop_loss or row["close"] > take_profit:
                    in_trade = False
                    exit_time = row["open_time"]
                    exit_price = row["close"]
                    profit = exit_price - entry_price
                    
                    trades.append({
                        "entry_time": str(entry_time),
                        "exit_time": str(exit_time),
                        "entry_price": entry_price,
                        "exit_price": exit_price,
                        "profit": profit
                    })
                    
        elif indicator_type == "RSI":
            rsi = row.get("rsi")
            if pd.isna(rsi):
                continue
                
            entry_cond = strategy.get("entry_condition", "")
            exit_cond = strategy.get("exit_condition", "")
            
            if not in_trade:
                if "<" in entry_cond and "30" in entry_cond:
                    if rsi < 30:
                        in_trade = True
                        entry_time = row["open_time"]
                        entry_price = row["close"]
                        
                        if "atr" in df.columns and not pd.isna(row.get("atr")):
                            stop_loss = entry_price - (row["atr"] * atr_multiplier)
                        else:
                            stop_loss = entry_price * 0.98
                            
                        take_profit = entry_price + (entry_price - stop_loss) * rr
                        
            else:
                exit_triggered = False
                if ">" in exit_cond and "70" in exit_cond:
                    if rsi > 70:
                        exit_triggered = True
                if row["close"] < stop_loss:
                    exit_triggered = True
                if row["close"] > take_profit:
                    exit_triggered = True
                    
                if exit_triggered:
                    in_trade = False
                    exit_time = row["open_time"]
                    exit_price = row["close"]
                    profit = exit_price - entry_price
                    
                    trades.append({
                        "entry_time": str(entry_time),
                        "exit_time": str(exit_time),
                        "entry_price": entry_price,
                        "exit_price": exit_price,
                        "profit": profit
                    })
        else:
            if not in_trade and df.shape[0] > 0:
                in_trade = True
                entry_time = row["open_time"]
                entry_price = row["close"]
                
            elif in_trade:
                in_trade = False
                exit_time = row["open_time"]
                exit_price = row["close"]
                profit = exit_price - entry_price
                
                trades.append({
                    "entry_time": str(entry_time),
                    "exit_time": str(exit_time),
                    "entry_price": entry_price,
                    "exit_price": exit_price,
                    "profit": profit
                })
    
    total_trades = len(trades)
    winning_trades = sum(1 for t in trades if t["profit"] > 0)
    win_rate = winning_trades / total_trades if total_trades > 0 else 0
    net_profit = sum(t["profit"] for t in trades)
    max_drawdown = calculate_max_drawdown(trades)
    
    return {
        "win_rate": win_rate,
        "net_profit": net_profit,
        "max_drawdown": max_drawdown,
        "total_trades": total_trades,
        "trade_logs": trades
    }

@app.post("/backtest")
def backtest_endpoint(strategy: StrategyRequest):
    df = fetch_binance_data("BTCUSDT", "1h", "2026-01-01", "2026-04-15")
    
    if df.empty:
        return {"win_rate": 0, "net_profit": 0, "trade_logs": [], "total_trades": 0}
    
    result = execute_strategy(df, strategy.model_dump())
    
    return {
        "win_rate": result["win_rate"],
        "net_profit": result["net_profit"],
        "max_drawdown": result.get("max_drawdown", 0),
        "total_trades": result.get("total_trades", 0),
        "trade_logs": result["trade_logs"]
    }

PARAM_RANGES = {
    "EMA_CROSS": {
        "fast": (5, 20),
        "slow": (15, 50)
    },
    "RSI": {
        "period": (5, 30)
    },
    "ATR": {
        "period": (5, 30)
    },
    "risk_reward_ratio": (1.0, 5.0),
    "atr_sl_multiplier": (1.0, 4.0)
}

def generate_parameter_variations(base_strategy: dict, num_variations: int = 10) -> List[dict]:
    variations = []
    indicator = base_strategy.get("indicator", {})
    indicator_type = indicator.get("type", "")
    
    indicator_ranges = PARAM_RANGES.get(indicator_type, {})
    rr_range = PARAM_RANGES.get("risk_reward_ratio", (1.0, 5.0))
    atr_range = PARAM_RANGES.get("atr_sl_multiplier", (1.0, 4.0))
    
    for _ in range(num_variations):
        new_indicator = dict(indicator)
        
        for param, (min_val, max_val) in indicator_ranges.items():
            if param in ["fast", "slow", "period"]:
                new_indicator[param] = random.randint(min_val, max_val)
            elif param in ["multiplier"]:
                new_indicator[param] = round(random.uniform(min_val, max_val), 2)
        
        rr = round(random.uniform(*rr_range), 2)
        atr_mult = round(random.uniform(*atr_range), 2)
        
        variations.append({
            "indicator": new_indicator,
            "risk_reward_ratio": rr,
            "atr_sl_multiplier": atr_mult
        })
    
    return variations

def run_optimization(df: pd.DataFrame, base_strategy: dict, num_variations: int = 10, target: str = "net_profit") -> List[dict]:
    variations = generate_parameter_variations(base_strategy, num_variations)
    
    results = []
    for params in variations:
        strategy = dict(params)
        metrics = execute_strategy(df, strategy)
        
        results.append({
            "params": params,
            "metrics": {
                "net_profit": metrics["net_profit"],
                "win_rate": metrics["win_rate"],
                "max_drawdown": metrics["max_drawdown"],
                "total_trades": metrics["total_trades"]
            }
        })
    
    if target == "net_profit":
        results.sort(key=lambda x: x["metrics"]["net_profit"], reverse=True)
    elif target == "win_rate":
        results.sort(key=lambda x: x["metrics"]["win_rate"], reverse=True)
    elif target == "max_drawdown":
        results.sort(key=lambda x: x["metrics"]["max_drawdown"])
    else:
        results.sort(key=lambda x: x["metrics"]["net_profit"], reverse=True)
    
    return results

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)