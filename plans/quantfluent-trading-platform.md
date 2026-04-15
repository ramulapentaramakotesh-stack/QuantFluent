# Plan: QuantFluent Trading Platform
> Source PRD: PRD.md in current directory

## Architectural decisions
- **Routes**:
  - /api/strategies (CRUD for strategies)
  - /api/backtests (CRUD for backtests)
  - /api/optimizations (CRUD for optimizations)
  - /auth/google (OAuth callback)
- **Schema**:
  - `users`: id, email, google_id, created_at
  - `strategies`: id, user_id, name, pine_code, strategy_json, created_at
  - `backtests`: id, strategy_id, instrument, timeframe, start_date, end_date, results_json, created_at
  - `optimizations`: id, backtest_id, target_metric, parameter_variations, results_ranking, created_at
- **Key models**: Strategy, Backtest, Optimization
- **Authentication**: Google OAuth via Supabase
- **Third-party**: Binance API for market data, Grok/xAI for strategy generation

---
## Phase 1: Backtesting Engine
**User stories**: 2, 3, 7, 8, 9, 15
### What to build
Core backtesting engine with data fetching, indicator calculation, and trade execution simulation. Focus on delivering complete end-to-end backtest runs with verifiable outputs.

### Acceptance criteria
- [ ] Implement Binance API integration with historical data caching
- [ ] Support all required timeframes (1m, 5m, 15m, 30m, 1h, 4h, 1d)
- [ ] Build indicator engine using pandas-ta with dynamic indicator application
- [ ] Execute complete trade logic including entry/exit conditions
- [ ] Store raw backtest results in structured format

---
## Phase 2: Metrics & Trade Logs
**User stories**: 7, 8, 9
### What to build
System to calculate and validate quantitative metrics and detailed trade histories.

### Acceptance criteria
- [ ] Implement metrics calculation: Win Rate, Net Profit, Maximum Drawdown
- [ ] Generate complete trade logs with timestamps and P/L per trade
- [ ] Add validation checks for metric correctness
- [ ] Store metrics and trade logs in database
- [ ] Add basic visualization of metrics and logs in JSON format

---
## Phase 3: Optimization Engine
**User stories**: 14, 15, 16, 17, 18
### What to build
Parameter optimization system that executes multiple backtests and ranks results.

### Acceptance criteria
- [ ] Implement random search algorithm for parameter variation
- [ ] Create default parameter ranges based on indicator types
- [ ] Execute batch backtests asynchronously
- [ ] Rank optimization results by selected metrics
- [ ] Store optimization results with parameter configurations

---
## Phase 4: API Layer
**User stories**: N/A (enabling layer)
### What to build
RESTful API endpoints that expose core functionality for frontend consumption.

### Acceptance criteria
- [ ] Create `/api/strategies` endpoints (POST/GET)
- [ ] Implement `/api/backtests` endpoints (POST/GET)
- [ ] Build `/api/optimizations` endpoints (POST/GET)
- [ ] Add request validation and error responses
- [ ] Implement CORS configuration for frontend

---
## Phase 5: Frontend Modules
**User stories**: 1, 4, 5, 6, 13
### What to build
React frontend modules starting with strategy creation flow and results visualization.

### Acceptance criteria
- [ ] Build strategy creation chat interface with guided parameter collection
- [ ] Implement Pine Script editor with syntax highlighting
- [ ] Create basic backtest configuration UI (instrument, timeframe, date range)
- [ ] Build metrics display cards and trade log table
- [ ] Add basic optimization UI for selecting parameters and viewing results

---
## Phase 6: Authentication & Persistence
**User stories**: 10, 11
### What to build
Google OAuth integration and persistent storage for user data.

### Acceptance criteria
- [ ] Implement Google OAuth flow via Supabase
- [ ] Create database tables for users, strategies, backtests, optimizations
- [ ] Store/retrieve user strategies and backtests
- [ ] Implement session management with JWT
- [ ] Add user authentication middleware for protected routes

---
## Phase 7: Error Handling & Feedback
**User stories**: 12, 18
### What to build
Comprehensive error handling and user feedback system.

### Acceptance criteria
- [ ] Implement error boundary detection across all layers
- [ ] Create user-friendly error messages for all failure scenarios
- [ ] Add retry flows for failed operations
- [ ] Handle AI generation errors gracefully
- [ ] Provide actionable feedback on invalid strategies
> Source PRD: PRD.md in current directory

## Architectural decisions
- **Routes**:
  - /api/strategies (CRUD for strategies)
  - /api/backtests (CRUD for backtests)
  - /api/optimizations (CRUD for optimizations)
  - /auth/google (OAuth callback)
- **Schema**:
  - `users`: id, email, google_id, created_at
  - `strategies`: id, user_id, name, pine_code, strategy_json, created_at
  - `backtests`: id, strategy_id, instrument, timeframe, start_date, end_date, results_json, created_at
  - `optimizations`: id, backtest_id, target_metric, parameter_variations, results_ranking, created_at
- **Key models**: Strategy, Backtest, Optimization
- **Authentication**: Google OAuth via Supabase
- **Third-party**: Binance API for market data, Grok/xAI for strategy generation

---
## Phase 1: Authentication & Data Layer
**User stories**: 10, 11
### What to build
Google OAuth integration with Supabase for user authentication, session management, and persistent storage of strategies and backtests.

### Acceptance criteria
- [ ] Implement JWT token handling
- [ ] Complete user registration/login flow
- [ ] Create database tables for users, strategies, backtests, optimizations
- [ ] Store strategy JSON and Pine Script in database
- [ ] Allow retrieval of user's saved strategies and backtests

---
## Phase 2: Strategy Generation
**User stories**: 1, 5, 13
### What to build
AI-powered chatbot interface that collects all required parameters and generates validated strategy definitions.

### Acceptance criteria
- [ ] Build guided dialogue flow for strategy parameters
- [ ] Validate RR, ATR SL, and risk per trade are collected
- [ ] Generate Pine Script and structured JSON
- [ ] Detect and warn about incomplete/invalid strategies
- [ ] Store generated strategies in database

---
## Phase 3: Backtesting Engine
**User stories**: 2, 3, 7, 8, 9
### What to build
Binance data integration, indicator engine, trade execution simulation, and metrics visualization.

### Acceptance criteria
- [ ] Implement Binance API data fetching with caching
- [ ] Support all required timeframes (1m, 5m, ..., 1d)
- [ ] Build indicator engine using pandas-ta
- [ ] Execute trade logic and calculate metrics
- [ ] Display trade logs and metrics
- [ ] Show visual chart with entry/exit signals

---
## Phase 4: Optimization Engine
**User stories**: 14, 15, 16, 17
### What to build
Parameter optimization system that runs multiple backtests and ranks results.

### Acceptance criteria
- [ ] Implement random search over parameter space
- [ ] Assign default parameter ranges based on indicator type
- [ ] Run batch backtests asynchronously
- [ ] Rank results by selected metric
- [ ] Allow applying optimized parameters

---
## Phase 5: Frontend Modules
**User stories**: 4, 6
### What to build
React frontend modules for chat interface, code editor, configuration inputs, and results visualization.

### Acceptance criteria
- [ ] Build chat interface for strategy creation
- [ ] Implement Pine Script editor with syntax highlighting
- [ ] Create backtest configuration UI (instrument, timeframe, date range)
- [ ] Display results with metrics cards, trade log table, and optimization modal
- [ ] Integrate TradingView Lightweight Charts for visualization

---
## Phase 6: Error Handling & Feedback
**User stories**: 12, 18
### What to build
Comprehensive error handling and user feedback system.

### Acceptance criteria
- [ ] Implement error boundary detection
- [ ] Display user-friendly error messages
- [ ] Add retry flows for failed operations
- [ ] Handle AI generation errors gracefully
- [ ] Provide actionable feedback on invalid strategies