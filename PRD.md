## Problem Statement

Retail traders, especially students and independent traders, face two major barriers when trying to develop and test trading strategies:

1. **Technical Barrier**: Platforms like TradingView require users to write Pine Script code, which has a steep learning curve for non-programmers. Writing and debugging trading strategies in Pine Script is time-consuming and error-prone.

2. **Financial Barrier**: Advanced backtesting features (custom intervals, deep historical testing, multi-year data) are locked behind paid subscriptions, making them inaccessible to users without financial resources.

Current solutions either require coding expertise (Pine Script/Python) or generate only superficial UI without real backtesting capability. This prevents aspiring traders from validating their strategies effectively, hindering their learning and career development in algorithmic trading.

## Solution

QuantFluent is an AI-powered web application that allows users to describe their trading strategies in natural language. The system:

1. Uses an AI chatbot (Grok/xAI) to interact with users and extract structured strategy parameters:
   - Entry conditions (indicators, threshold values)
   - Exit conditions (profit target, stop-loss)
   - **Risk-Reward Ratio (RR)** - Required
   - **ATR-based Stop Loss Multiplier** - Required
   - **Risk per Trade (in dollars)** - Required

2. Converts natural language input into two outputs:
   - Pine Script code (for TradingView compatibility and export)
   - Structured JSON (for backend execution)

3. Runs the strategy on historical Binance market data using a Python FastAPI backend

4. Provides detailed outputs including:
   - Performance metrics (Win Rate, Total Trades, Net Profit, Maximum Drawdown)
   - Trade logs (entry/exit timestamps, profit/loss per trade)
   - Visual chart with entry/exit signals

5. **Optimization Engine** (New): After backtesting, users can optimize their strategy parameters to find the best configuration based on selected metrics.

This solution eliminates both barriers by removing the need to write code while providing free backtesting and optimization capabilities.

## User Stories

1. As a retail trader with no coding experience, I want to describe my trading strategy in plain English, so that I can generate a working strategy without learning Pine Script.

2. As a student trader, I want to test my strategy ideas on multiple years of historical data, so that I can validate my trading hypothesis before risking real money.

3. As a user, I want to select custom date ranges and timeframes for backtesting, so that I can test my strategy on specific market conditions before executing the backtest.

4. As an aspiring algorithmic trader, I want to export Pine Script code from my strategy, so that I can use it directly in TradingView for further analysis.

5. As a user, I want the AI to ensure all mandatory parameters (RR, ATR SL, Risk per Trade) are collected, so that my strategy has proper risk management.

6. As a user, I want the AI to validate my strategy and warn me about logical issues, so that I don't waste time running backtests with invalid strategies.

7. As a user, I want to see visual entry and exit signals on a chart, so that I can verify the trades match my intended strategy logic.

8. As a user, I want to see detailed metrics (Win Rate, Drawdown, Net Profit), so that I can evaluate the effectiveness of my strategy.

9. As a user, I want to view a complete trade log with timestamps and profit/loss, so that I can analyze individual trade performance.

10. As a user with a Google account, I want to sign in with Google OAuth, so that my data is securely stored and accessible across sessions.

11. As a returning user, I want to view my saved strategies and backtest history, so that I can continue improving my trading ideas.

12. As a user, I want error messages when backtesting fails, so that I understand what went wrong and can retry with corrections.

13. As a user, I want the AI chatbot to ask clarifying questions when my strategy is incomplete, so that all required parameters are collected before execution.

14. As a user, I want to optimize my strategy after running a backtest, so that I can find the best parameter configuration for maximum performance.

15. As a user, I want to select a trading instrument (e.g., BTCUSDT, ETHUSDT) before running backtest, so that I can test my strategy on specific markets.

16. As a user, I want to select an optimization target (Maximize Profit, Win Rate, Minimize Drawdown), so that I can tailor the optimization to my goals.

16. As a user, I want to see a ranked list of parameter variations with their metrics, so that I can compare different configurations and choose the best one.

17. As a user, I want to apply the optimized parameters to my strategy, so that I can use the best configuration for future backtests.

## Implementation Decisions

### Architecture

- **Frontend**: React (Vite) as a standalone application with Tailwind CSS, communicating via REST APIs
- **Backend**: Python FastAPI running as a separate service
- **Database**: PostgreSQL via Supabase for authentication and data persistence
- **Authentication**: Google OAuth via Supabase

### Mandatory Strategy Parameters

Every generated strategy MUST include the following required parameters:

1. **Risk-Reward Ratio (RR)**: The ratio of potential profit to potential loss
2. **ATR-based Stop Loss Multiplier**: Multiplier for ATR to calculate stop loss distance
3. **Risk per Trade (in dollars)**: Fixed dollar amount risked per trade

The AI chatbot must:
- Ensure these three parameters are always collected
- Prompt the user if any are missing
- Validate inputs (e.g., RR > 0, ATR multiplier > 0, risk > 0) before generating the strategy

### Structured Strategy Output

The AI must generate:

1. **Pine Script**: For TradingView compatibility and export
2. **Structured JSON**: For backend execution, containing:
   - Entry conditions (indicator type, parameters, threshold)
   - Exit conditions (indicator type, parameters, threshold)
   - Indicators (type, fast period, slow period, etc.)
   - Risk management:
     - `risk_reward_ratio`: number
     - `atr_sl_multiplier`: number
     - `risk_per_trade`: number (in dollars)

### Module Design

1. **Frontend Modules**:
   - **Auth Module**: Supabase Google OAuth integration with JWT token management
   - **Chat Interface Module**: Conversational UI that collects strategy parameters through guided dialogue
   - **Strategy Display Module**: Code editor view with Pine Script syntax highlighting
   - **Backtest Config Module**: Symbol/instrument picker, timeframe picker, and date range selector (available BEFORE backtest execution)
   - **Results Display Module**: Metrics cards, trade log table, and Optimize button
   - **Chart Module**: TradingView Lightweight Charts with buy/sell markers
   - **Optimization Modal**: UI for selecting optimization criteria and displaying ranked results

2. **Backend Modules**:
   - **Auth Module**: JWT verification from Supabase tokens
   - **Data Fetching Module**: Binance Klines API integration with caching for efficiency
   - **Strategy Parser Module**: Validates structured JSON from frontend, detects logical issues, validates required risk parameters
   - **Indicator Engine Module**: Uses pandas-ta library to dynamically apply ANY indicator (EMA, RSI, ATR, MACD, Bollinger Bands, etc.) based on JSON configuration. System is indicator-agnostic - new indicators can be added via pandas-ta without modifying core logic.
   - **Backtest Engine Module**: Executes trades based on strategy logic, calculates metrics and trade logs
   - **Optimization Module**: Generates parameter variations, runs batch backtests, returns ranked results

3. **Database Schema**:
   - `users`: Google OAuth user records
   - `strategies`: Pine Script and JSON strategy definitions per user (including RR, ATR SL, risk per trade)
   - `chat_messages`: Conversation history per user
   - `backtest_results`: Saved results with metrics and trade logs
   - `optimization_results`: Saved optimization runs with parameter variations

### AI Integration (Grok/xAI)

- AI handles: conversational strategy extraction, parameter validation, Pine Script generation, structured JSON generation
- **Required Validation**: AI must ensure all three mandatory parameters (RR, ATR SL, risk per trade) are present before generating output
- AI must output structured JSON with explicit indicator parameters (e.g., `{"type": "EMA_CROSS", "fast": 9, "slow": 21}`)
- Strategy validation must occur before code generation to detect:
  - Identical entry and exit conditions
  - Missing required parameters (RR, ATR SL, risk per trade)
  - Contradictory logic

### Optimization Engine

**User Flow:**
1. User runs initial backtest
2. Results dashboard is displayed with "Optimize" button
3. User clicks "Optimize"
4. User selects optimization target:
   - Maximize Net Profit
   - Maximize Win Rate
   - Minimize Drawdown
   - Optimize Risk-Adjusted Return (optional)
5. System performs random search over parameter space
6. Results displayed as ranked list

**Optimization Logic:**
- Uses Random Search for MVP
- Parameters that can be optimized (dynamically extracted from strategy JSON):
  - Any indicator values (e.g., EMA fast/slow periods, RSI period, ATR multiplier)
  - Risk-Reward ratio
- Default ranges assigned per indicator type (see Default Range System below)

**Parameter Range Handling (Generic):**
- Every indicator parameter in the strategy JSON must have an associated optimization range
- Ranges are dynamically assigned based on indicator type, not hardcoded
- Examples:
  - EMA: `{"fast": [5, 20], "slow": [15, 50]}`
  - RSI: `{"period": [5, 30]}`
  - ATR: `{"multiplier": [1.0, 4.0]}`

**Default Range System:**
- Backend defines sensible default ranges for each indicator type:
  - EMA periods: 5-50
  - RSI period: 5-30
  - ATR multiplier: 1.0-4.0
  - MACD fast/slow: 5-30
  - Bollinger Bands period: 10-30, std dev: 1.5-3.0
- New indicators can be added to the range system without modifying core logic

**Generic Optimization Framework:**
- The optimization engine must work generically across all indicators
- It extracts all tunable parameters from the strategy JSON
- Assigns valid ranges based on indicator type
- Performs random search across those parameters
- No special-case handling for specific indicators

**Outputs:**
- Ranked list of parameter configurations
- Best-performing configuration based on selected metric
- Comparison table of top results

**Performance Considerations:**
- Optimization supports large datasets efficiently
- Limits number of runs for MVP (default: 20-100 runs) to maintain responsiveness
- Runs batch backtests asynchronously

### Data Handling

- Primary data source: Binance Klines API
- Supported timeframes: 1m, 5m, 15m, 30m, 1h, 4h, 1d
- Support for long-range historical data (100K to 1M+ candles)
- Data caching for efficiency on repeated queries
- **Date range, timeframe, and instrument selection available in UI BEFORE clicking "Run Backtest"**

### Error Handling

- Handle AI generation errors with user-friendly messages and retry options
- Handle backend execution errors with clear error messages
- Handle optimization errors gracefully
- Never crash silently - always display actionable feedback

## Testing Decisions

### Unit Testing Priority Modules

1. **Indicator Engine Module**: Tests for correctness of indicator calculations (EMA, RSI, ATR, etc.) using pandas-ta. Tests should verify numerical accuracy against known inputs.

2. **Strategy Parser Module**: Tests for correct parsing of JSON strategy definitions, validation of required fields (RR, ATR SL, risk per trade), detection of invalid/contradictory strategies.

3. **Backtest Engine Module**: Tests for trade execution logic, correct P&L calculations, metrics computation (win rate, drawdown), and trade log generation.

4. **Data Fetching Module**: Tests for correct Binance API response handling, data formatting, caching behavior.

5. **Optimization Module**: Tests for parameter variation generation, batch backtest execution, result ranking.

### Testing Principles

- Tests should verify external behavior only, not implementation details
- Tests should be deterministic and reproducible for the same inputs
- Use pytest framework for backend
- Prior art: similar modular testing patterns in trading backtest libraries (backtesting.py, vectorbt)

## Out of Scope

- Real-time trading execution (demo accounts only)
- Portfolio management and position sizing beyond single-strategy testing
- Multi-strategy backtesting simultaneously
- Market data sources other than Binance (Yahoo Finance, Polygon, etc.)
- Pine Script to Python transpilation (AI generates both outputs independently)
- Mobile app development
- Paper trading with live market connection
- Advanced optimization methods (grid search, genetic algorithms) beyond random search
- Community features (sharing strategies, leaderboards)

## Further Notes

- The system maintains clear separation between: AI-generated strategy logic (JSON), execution engine (Python backend), optimization engine (batch processing)
- The Indicator Engine is extensible - new indicators can be added via pandas-ta without modifying core backtest logic
- MVP focuses on delivering a complete flow: chat → strategy generation → backtest → optimization → results visualization
- Real-time updates during backtesting are not required for MVP - results are displayed after computation completes
- Cost efficiency is important - AI responses should be optimized and structured to minimize API usage
- Date range, timeframe, and instrument must be selectable in the UI BEFORE executing the backtest