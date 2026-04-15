# PROJECT_MEMORY.md - QuantFluent Complete Documentation

## 1. Project Overview

### Name
QuantFluent

### Purpose
AI-powered trading strategy generation, backtesting, and optimization platform

### Core Idea
Convert natural language trading strategies into executable logic and evaluate performance using historical market data from Binance

### Tech Stack
- **Frontend**: React 18 + Vite
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL + Auth)
- **AI**: Grok (xAI) for natural language parsing
- **Market Data**: Binance API
- **Animations**: Framer Motion
- **Routing**: React Router DOM

---

## 2. System Architecture

### Frontend Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── Landing.jsx          # Landing page with hero, features, indicators, how-it-works
│   │   ├── Landing.css
│   │   ├── ChatSystem.jsx       # Step-by-step AI chat for strategy creation
│   │   ├── ChatSystem.css
│   │   ├── Auth.jsx             # Email/password login & signup
│   │   ├── Auth.css
│   │   ├── Dashboard.jsx        # User dashboard with saved strategies/backtests
│   │   ├── Dashboard.css
│   │   ├── Navbar.jsx           # Main navigation
│   │   ├── Footer.jsx           # Developer info footer
│   │   ├── AuthGuard.jsx        # Route protection wrapper
│   │   ├── ChatInterface.jsx   # Legacy chat component
│   │   ├── Card.jsx             # Reusable card component
│   │   ├── Button.jsx           # Reusable button component
│   │   └── EmailAuth.jsx        # Email authentication
│   ├── services/
│   │   ├── api.js               # Backend API service (health, backtest, optimize)
│   │   ├── grok.js              # Grok AI integration service
│   │   └── auth.js              # Supabase auth + database service
│   ├── App.jsx                  # Main app with React Router
│   ├── App.css                  # Global styles
│   └── main.jsx                 # Entry point
├── package.json
└── vite.config.js
```

### Frontend Routes
| Path | Component | Description |
|------|-----------|-------------|
| `/` | Landing | Landing page |
| `/demo` | ChatSystem | Demo mode (no auth required) |
| `/login` | Auth | Login/signup page |
| `/dashboard` | Dashboard | User dashboard (auth required) |
| `/chat` | ChatSystem | Chat with auth (auth required) |

### Backend Structure
```
backend/
├── main.py                      # FastAPI application (561 lines)
├── requirements.txt             # Python dependencies
└── tests/
    ├── test_grok_integration.py
    ├── test_api_endpoints.py
    ├── test_backtest_engine.py
    ├── test_backtest_reliability.py
    ├── test_metrics_validation.py
    ├── test_optimization.py
    └── test_e2e_flow.py
```

### Backend Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/parse-strategy` | POST | Parse natural language to strategy JSON (Grok + fallback) |
| `/api/backtest` | POST | Run backtest on strategy |
| `/api/optimize` | POST | Optimize strategy parameters |

### Database (Supabase)

#### Tables

**users** (managed by Supabase Auth)
- `id` - UUID (primary key)
- `email` - string
- `created_at` - timestamp

**strategies**
- `id` - UUID (primary key)
- `user_id` - UUID (foreign key to auth.users)
- `name` - string
- `strategy_json` - JSONB
- `created_at` - timestamp

**backtests**
- `id` - UUID (primary key)
- `user_id` - UUID
- `strategy_id` - UUID
- `result_json` - JSONB
- `created_at` - timestamp

**optimizations**
- `id` - UUID (primary key)
- `user_id` - UUID
- `strategy_id` - UUID
- `result_json` - JSONB
- `created_at` - timestamp

---

## 3. AI System (CRITICAL)

### Grok Integration

The backend integrates with Grok (xAI) to convert natural language trading strategies into structured JSON.

#### Configuration
- **API Key**: Set via `GROK_API_KEY` environment variable
- **API URL**: `https://api.xai.com/v1/chat/completions`
- **Location**: `backend/main.py` line 14-15

#### System Prompt
The Grok model is instructed with this prompt:
```
You are a trading strategy assistant for QuantFluent, an AI-powered backtesting platform.

Your task is to convert natural language trading strategies into structured JSON format.

REQUIRED OUTPUT FORMAT:
{
  "entry": { "type": "EMA_CROSS", "fast": number, "slow": number },
  "exit": { "type": "EMA_CROSS", "fast": number, "slow": number },
  "risk_management": {
    "risk_reward_ratio": number,
    "atr_sl_multiplier": number,
    "risk_per_trade": number
  }
}

RULES:
1. ALWAYS include risk_reward_ratio, atr_sl_multiplier, and risk_per_trade
2. Default values: RR=2.0, ATR=1.5, Risk=100
3. Return ONLY valid JSON, no explanations
```

#### JSON Strategy Format

```json
{
  "indicator": {
    "type": "EMA_CROSS",
    "fast": 9,
    "slow": 21
  },
  "risk_reward_ratio": 2.0,
  "atr_sl_multiplier": 1.5,
  "risk_per_trade": 100
}
```

Supported indicator types:
- `EMA_CROSS` - EMA crossover strategy
- `RSI` - Relative Strength Index
- `SMA` - Simple Moving Average
- `MACD` - Moving Average Convergence Divergence
- `ATR` - Average True Range

### Fallback Parser

When Grok API fails or is unavailable, a local fallback parser is used.

#### Location
`frontend/src/services/grok.js` - `localParse()` function

#### Behavior
1. Extracts risk-reward ratio from text using regex
2. Extracts ATR multiplier from text
3. Extracts EMA periods from text
4. Returns default values if nothing found

#### Default Values
```javascript
{
  indicator: { type: 'EMA_CROSS', fast: 9, slow: 21 },
  risk_reward_ratio: 2.0,
  atr_sl_multiplier: 1.5,
  risk_per_trade: 100
}
```

---

## 4. Data Flow

### Full User Journey

```
┌─────────────┐
│  User       │
│  visits     │
│  Landing    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Clicks     │
│  "Try Demo" │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  /demo      │
│  ChatSystem │
│  (no auth)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Step 1:    │
│  Entry      │
│  Condition  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Step 2:    │
│  Exit       │
│  Condition  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Step 3:    │
│  Risk-     │
│  Reward     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Step 4:    │
│  ATR        │
│  Multiplier │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Step 5:    │
│  Risk per   │
│  Trade      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Send to    │
│  Grok API   │
│  or fallback│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Parse      │
│  to JSON    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  POST       │
│  /api/      │
│  backtest   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Fetch      │
│  Binance   │
│  historical │
│  data       │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Run        │
│  backtest   │
│  engine     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Calculate  │
│  metrics:   │
│  - win_rate │
│  - net_profit│
│  - max_dd   │
│  - trade_logs│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Return     │
│  results    │
│  to user    │
└─────────────┘
```

### API Request/Response Examples

#### `/api/parse-strategy`
**Request:**
```json
{
  "message": "I want to use EMA 9 crossing above EMA 21 for entry, with 2:1 risk reward and 1.5 ATR stop loss"
}
```

**Response:**
```json
{
  "fallback_used": false,
  "strategy": {
    "indicator": {
      "type": "EMA_CROSS",
      "fast": 9,
      "slow": 21
    },
    "risk_reward_ratio": 2.0,
    "atr_sl_multiplier": 1.5,
    "risk_per_trade": 100
  }
}
```

#### `/api/backtest`
**Request:**
```json
{
  "strategy": {
    "indicator": { "type": "EMA_CROSS", "fast": 9, "slow": 21 },
    "risk_reward_ratio": 2.0,
    "atr_sl_multiplier": 1.5,
    "risk_per_trade": 100
  },
  "instrument": "BTCUSDT",
  "timeframe": "1h",
  "start_date": "2026-01-01",
  "end_date": "2026-04-15"
}
```

**Response:**
```json
{
  "win_rate": 0.58,
  "net_profit": 2450.75,
  "total_trades": 24,
  "max_drawdown": 320.50,
  "trade_logs": [
    {
      "entry_time": "2026-01-15T08:00:00",
      "exit_time": "2026-01-15T14:00:00",
      "entry_price": 43250.00,
      "exit_price": 43500.00,
      "profit": 150.00,
      "side": "long"
    }
  ]
}
```

---

## 5. Features Implemented

### Completed Features

1. **AI Chat-Based Strategy Creation**
   - Step-by-step conversation flow (5 steps)
   - Natural language to JSON conversion
   - Real-time progress indicator

2. **Parameter Validation**
   - Risk-reward ratio input
   - ATR multiplier for stop loss
   - Risk per trade in dollars
   - EMA period configuration

3. **Backtesting Engine**
   - Historical data from Binance API
   - Support for multiple timeframes (1m, 5m, 15m, 30m, 1h, 4h, 1d)
   - Support for multiple instruments (BTCUSDT, ETHUSDT, etc.)
   - Trade logging with entry/exit prices
   - Performance metrics calculation

4. **Optimization Engine**
   - Parameter variation testing
   - Best parameter discovery
   - Target optimization (net_profit, win_rate, max_drawdown)

5. **Dashboard**
   - Saved strategies list
   - Backtest results history
   - Optimization results
   - Re-run strategy functionality

6. **Authentication**
   - Email/password registration
   - Email verification support
   - Login with password
   - Session management

7. **Landing Page**
   - Hero section with CTA
   - Features grid
   - Supported indicators display
   - How-it-works steps

8. **Motion UI (Framer Motion)**
   - Page transitions
   - Button animations
   - Scroll-triggered animations
   - Loading states

---

## 6. Environment Variables

### Frontend (.env.local)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_API_URL` | Backend API URL (default: http://localhost:8000) | No |

### Backend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `GROK_API_KEY` | xAI API key for Grok integration | No (fallback available) |

### How to Get Supabase Credentials

1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Go to Settings > API
4. Copy `Project URL` as `VITE_SUPABASE_URL`
5. Copy `anon public` key as `VITE_SUPABASE_ANON_KEY`

---

## 7. Known Issues / Limitations

### Current Limitations

1. **Grok Dependency**
   - Requires valid API key for full functionality
   - Network failures can cause delays
   - Fallback parser is basic

2. **Fallback Parser Limitations**
   - Only extracts basic parameters
   - Limited to EMA strategies
   - Cannot handle complex multi-indicator strategies

3. **UI Polish**
   - Some animations could be smoother
   - Error states need improvement
   - Mobile responsive could be enhanced

4. **Data**
   - Uses Binance testnet for historical data
   - Limited to crypto pairs
   - Date range validation needed

### Known Bugs

1. **Backend port conflict** - Port 8000 may be in use
2. **CORS issues** - May need to configure CORS for production
3. **Session handling** - Needs better error handling for expired sessions

---

## 8. Future Improvements

### High Priority

1. **Pine Script Export**
   - Export strategies to TradingView Pine Script
   - Enable real trading on Binance

2. **More Indicators**
   - Add MACD, Bollinger Bands, Stochastic
   - Multi-indicator strategies

3. **Strategy Comparison**
   - Compare multiple strategies side-by-side
   - Performance benchmarking

### Medium Priority

4. **Advanced Optimization**
   - Genetic algorithms
   - Walk-forward analysis
   - Monte Carlo simulation

5. **Paper Trading**
   - Connect to Binance testnet
   - Real-time strategy execution

6. **Portfolio Management**
   - Multiple strategy allocation
   - Risk management at portfolio level

### Low Priority

7. **Deployment**
   - Frontend: Vercel
   - Backend: Render/Railway
   - CI/CD pipeline

8. **Social Features**
   - Share strategies
   - Community strategies library
   - Leaderboards

---

## 9. Folder Structure

```
QuantFluent/
├── PROJECT_MEMORY.md          # This file
├── PRD.md                    # Product Requirements Document
├── plans/
│   └── quantfluent-trading-platform.md
├── backend/
│   ├── main.py               # FastAPI application
│   ├── requirements.txt      # Python dependencies
│   ├── .env                  # Backend environment variables
│   └── tests/                # Backend tests
│       ├── test_grok_integration.py
│       ├── test_api_endpoints.py
│       ├── test_backtest_engine.py
│       ├── test_backtest_reliability.py
│       ├── test_metrics_validation.py
│       ├── test_optimization.py
│       └── test_e2e_flow.py
└── frontend/
    ├── src/
    │   ├── components/       # React components
    │   ├── services/         # API services
    │   ├── App.jsx           # Main app with routing
    │   ├── App.css           # Global styles
    │   └── main.jsx          # Entry point
    ├── public/               # Static assets
    ├── package.json          # Node dependencies
    ├── vite.config.js        # Vite configuration
    ├── index.html            # HTML template
    └── README.md             # Frontend README
```

---

## 10. How to Run the Project

### Prerequisites

- Node.js 18+
- Python 3.10+
- Supabase account (for database/auth)

### Step 1: Clone and Install

```bash
# Clone repository
git clone https://github.com/ramulapentaramakotesh-stack/QuantFluent.git
cd QuantFluent

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
pip install -r requirements.txt
```

### Step 2: Configure Environment Variables

**Frontend (.env.local in frontend/):**
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000
```

**Backend (.env in backend/):**
```bash
GROK_API_KEY=your_grok_api_key
```

### Step 3: Set Up Supabase Database

Run the following SQL in Supabase SQL Editor to create tables:

```sql
-- Create strategies table
CREATE TABLE IF NOT EXISTS strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT,
  strategy_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create backtests table
CREATE TABLE IF NOT EXISTS backtests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  strategy_id UUID REFERENCES strategies(id),
  result_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create optimizations table
CREATE TABLE IF NOT EXISTS optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  strategy_id UUID REFERENCES strategies(id),
  result_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE backtests ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimizations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own strategies" ON strategies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own strategies" ON strategies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own strategies" ON strategies FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own backtests" ON backtests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own backtests" ON backtests FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own optimizations" ON optimizations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own optimizations" ON optimizations FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Step 4: Run Backend

```bash
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Backend will be available at: http://localhost:8000

### Step 5: Run Frontend

```bash
cd frontend
npm run dev
```

Frontend will be available at: http://localhost:5173

### Step 6: Test the Application

1. Open http://localhost:5173 in browser
2. Click "Try Demo" to test the chat flow
3. Enter trading strategy parameters step by step
4. View backtest results
5. Optionally register/login to save results

---

## 11. Developer Info

- **Name**: Ramakotesh Ramulapenta
- **LinkedIn**: https://www.linkedin.com/in/ramakoteshramulapenta/
- **Email**: ramakoteshramulapenta@gmail.com
- **GitHub**: https://github.com/ramulapentaramakotesh-stack

---

## 12. API Reference

### Backend Endpoints

#### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

#### POST /api/parse-strategy
Parse natural language trading strategy to JSON.

**Request Body:**
```json
{
  "message": "EMA 9 crossing above EMA 21 with 2:1 risk reward"
}
```

**Response:**
```json
{
  "fallback_used": false,
  "strategy": {
    "indicator": { "type": "EMA_CROSS", "fast": 9, "slow": 21 },
    "risk_reward_ratio": 2.0,
    "atr_sl_multiplier": 1.5,
    "risk_per_trade": 100
  }
}
```

#### POST /api/backtest
Run backtest on a trading strategy.

**Request Body:**
```json
{
  "strategy": {
    "indicator": { "type": "EMA_CROSS", "fast": 9, "slow": 21 },
    "risk_reward_ratio": 2.0,
    "atr_sl_multiplier": 1.5,
    "risk_per_trade": 100
  },
  "instrument": "BTCUSDT",
  "timeframe": "1h",
  "start_date": "2026-01-01",
  "end_date": "2026-04-15"
}
```

**Response:**
```json
{
  "win_rate": 0.58,
  "net_profit": 2450.75,
  "total_trades": 24,
  "max_drawdown": 320.50,
  "trade_logs": [...]
}
```

#### POST /api/optimize
Optimize strategy parameters.

**Request Body:**
```json
{
  "strategy": {
    "indicator": { "type": "EMA_CROSS", "fast": 9, "slow": 21 },
    "risk_reward_ratio": 2.0,
    "atr_sl_multiplier": 1.5,
    "risk_per_trade": 100
  },
  "instrument": "BTCUSDT",
  "timeframe": "1h",
  "start_date": "2026-01-01",
  "end_date": "2026-04-15",
  "target": "net_profit",
  "num_variations": 10
}
```

**Response:**
```json
{
  "results": [
    {
      "params": {
        "indicator": { "fast": 5, "slow": 21 },
        "risk_reward_ratio": 2.0,
        "atr_sl_multiplier": 1.5
      },
      "metrics": {
        "win_rate": 0.62,
        "net_profit": 3200.00,
        "total_trades": 28,
        "max_drawdown": 280.00
      }
    }
  ]
}
```

---

## 13. Testing

### Run Backend Tests

```bash
cd backend
pytest tests/ -v
```

### Test Individual Endpoints

```bash
# Health check
curl http://localhost:8000/api/health

# Parse strategy
curl -X POST http://localhost:8000/api/parse-strategy \
  -H "Content-Type: application/json" \
  -d '{"message": "EMA 9 and 21 crossover with 2:1 RR"}'
```

---

## 14. Troubleshooting

### Common Issues

1. **Backend port in use**
   ```bash
   # Find process using port 8000
   netstat -ano | findstr :8000
   # Kill process or use different port
   ```

2. **Supabase connection failed**
   - Verify environment variables are set correctly
   - Check Supabase project is active

3. **Grok API errors**
   - Falls back to local parser automatically
   - Check GROK_API_KEY is valid

4. **CORS errors**
   - Backend runs on localhost:8000
   - Frontend runs on localhost:5173
   - Should work automatically with default config

---

*Last Updated: April 2026*
*Version: 1.0.0*
