# 🏢 AI Business Digital Twin & Decision Support System — Architecture & Operations Guide

---

## 1. Executive Overview & Concept

### What is a Business Digital Twin?
A **Digital Twin** is a dynamic, software-based replica of a real-world enterprise. Just as an industrial digital twin models jet engines or wind turbines, this **Business Digital Twin** simulates the financial, operational, and customer dynamics of an enterprise in real-time.

```
       ┌────────────────────────────────────────────────────────┐
       │                ENTERPRISE DIGITAL TWIN                 │
       │                                                        │
       │  [ Historical Data ] ──► [ Machine Learning Models ]   │
       │                                     │                  │
       │                                     ▼                  │
       │  [ Parameter Deltas ] ──► [ What-If Simulation Engine ]│
       │                                     │                  │
       │                                     ▼                  │
       │  [ Impact Metrics ] ──► [ LLM Strategic Advisor ]      │
       └────────────────────────────────────────────────────────┘
```

### Core Value Proposition:
1. **Risk-Free Experimentation**: Test bold business decisions (e.g., *+30% marketing budget, +10% price hike*) without risking real capital.
2. **Multi-Horizon Forecasting**: Predict Revenue, Inventory, Churn Rate, and Profit Margins simultaneously.
3. **Generative Strategic Advice**: Google Gemini analyzes simulation deltas and provides executive summaries, risk matrices, and actionable recommendations.
4. **Omnichannel Access**: Monitor and simulate from both a modern **Next.js Web Dashboard** and a **React Native / Expo Mobile App**.

---

## 2. End-to-End System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT LAYER                                    │
│                                                                             │
│   ┌──────────────────────────────┐       ┌──────────────────────────────┐   │
│   │     Next.js 14 Web App       │       │    Expo SDK 54 Mobile App    │   │
│   │   (Tailwind, Lucide, Charts) │       │ (React Native, Sliders, Kit) │   │
│   └──────────────┬───────────────┘       └──────────────┬───────────────┘   │
└──────────────────┼──────────────────────────────────────┼───────────────────┘
                   │  HTTP / REST (JSON)                  │  HTTP / REST
                   ▼                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             BACKEND API LAYER                               │
│                         (FastAPI + Async Python)                            │
│                                                                             │
│   ┌─────────────────────────┐   ┌─────────────────────────┐                 │
│   │    /api/v1/data/*       │   │    /api/v1/simulate     │                 │
│   │ (KPIs, Timeseries, CSV) │   │   (What-If Scenarios)   │                 │
│   └────────────┬────────────┘   └───────────┬─────────────┘                 │
│                │                            │                               │
│                │                ┌───────────┴─────────────┐                 │
│                │                │   /api/v1/advisor/*     │                 │
│                │                │  (Gemini 1.5 Flash LLM) │                 │
│                │                └───────────┬─────────────┘                 │
└────────────────┼────────────────────────────┼───────────────────────────────┘
                 ▼                            ▼
┌────────────────────────────────┐ ┌──────────────────────────────────────────┐
│         DATABASE LAYER         │ │           ML INFERENCE LAYER             │
│   PostgreSQL (asyncpg)         │ │  • Revenue: XGBRegressor                 │
│   with SQLite Fallback (async) │ │  • Inventory: RandomForestRegressor      │
│   • BusinessData table         │ │  • Churn: XGBClassifier                  │
│   • SimulationLog table        │ │  • Profit Margin: GBRegressor            │
└────────────────────────────────┘ └──────────────────────────────────────────┘
```

---

## 3. Layer-by-Layer Breakdown

### 🤖 Layer 1: Machine Learning Pipeline (`ml/`)

#### 1. Synthetic Business Data Generator (`ml/generate_synthetic_data.py`)
- Generates **3 years (1,095 days)** of realistic business telemetry.
- Models complex economic dynamics:
  - **Growth Trajectory**: 1.0x to 1.45x upward trend over 3 years.
  - **Seasonality**: Annual sine cycles, holiday boosts (November–December), and weekend dips.
  - **Cross-Metric Correlation**: Marketing spend directly impacts revenue velocity; price changes trigger demand elasticity; inventory restock cycles correlate with sales volume.
- Output: `ml/data/synthetic_business_data.csv`.

#### 2. Model Training Suite (`ml/train_models.py`)
Trains 4 specialized models using time-series walk-forward splits:

| Model | Algorithm | Target Metric | Key Input Features |
|---|---|---|---|
| **Revenue Forecaster** | `XGBRegressor` | `revenue` ($) | Marketing spend, units sold, customer count, lag features (1, 3, 7, 14, 30 days), rolling averages. |
| **Inventory Optimizer** | `RandomForestRegressor` | `inventory_level` (units) | Revenue, units sold, sales velocity, restock lag cycles. |
| **Churn Predictor** | `XGBClassifier` | `churn_rate` (binary probability) | CAC, marketing efficiency, customer count, revenue momentum. |
| **Profit Margin Predictor** | `GradientBoostingRegressor` | `profit_margin` (%) | Revenue, fixed/variable expenses, marketing spend, inventory costs. |

#### 3. Deterministic Inference Engine (`backend/app/services/ml_service.py`)
- Loads all `.pkl` models and feature encoders into memory at startup.
- Applies mathematical elasticity rules to scenario inputs:
  - **Price Elasticity**: Applies a -1.2 demand coefficient when price changes.
  - **Marketing Multipliers**: Adjusts acquisition and top-line velocity.
  - **Deterministic Lags**: Uses current metric snapshots for consistent, reproducible simulation outputs.

---

### ⚡ Layer 2: Backend API & Database (`backend/`)

#### 1. FastAPI Framework (`app/main.py`)
- Asynchronous ASGI application with lifespan management.
- CORS middleware configured for web (`localhost:3000`) and mobile LAN devices.

#### 2. Dual-Engine Database Architecture (`app/database.py`)
- **Primary**: PostgreSQL with async `asyncpg` driver and connection pooling.
- **Automated Fallback**: If PostgreSQL is not active, the backend automatically transitions to local async SQLite (`digital_twin.db`) via `aiosqlite`.
- **Auto-Seeder** (`app/services/seed_data.py`): Checks database state on startup; if empty, automatically ingests 1,095 historical data records from the synthetic dataset.

#### 3. Database Schema (`app/models/business.py`)
- **`BusinessData` Table**: Stores daily business telemetry (`date` with unique constraint, `revenue`, `expenses`, `marketing_spend`, `inventory_level`, `units_sold`, `customer_count`, `customer_acquisition_cost`, `churn_rate`, `profit_margin`).
- **`SimulationLog` Table**: Audit trail of every simulation run (`scenario_name`, `parameters` JSON, `baseline_prediction` JSON, `scenario_prediction` JSON, `llm_insights` text, `timestamp`).

#### 4. REST Endpoints Summary

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/v1/health` | System health check (ML models & LLM status). |
| `GET` | `/api/v1/data/summary` | Aggregated KPIs (Total Revenue, Avg Margin, CAC, Churn, etc.). |
| `GET` | `/api/v1/data/timeseries` | Chart data with `daily`, `weekly`, or `monthly` calendar grouping. |
| `POST` | `/api/v1/data/upload` | Bulk CSV dataset ingestion. |
| `POST` | `/api/v1/simulate` | Executes What-If scenario against baseline and returns delta percentages. |
| `GET` | `/api/v1/simulations/history`| Retrieves past simulation logs. |
| `POST` | `/api/v1/advisor/insights` | Generates strategic advice via Google Gemini from simulation results. |

---

### 🧠 Layer 3: Generative AI Decision Support (`backend/app/services/llm_service.py`)

#### 1. Google Gemini Integration
- Model: `gemini-1.5-flash`.
- Uses non-blocking asynchronous execution via `asyncio.run_in_executor`.

#### 2. Prompt Engineering & Structured JSON Output
The prompt supplies:
- Applied parameter modifications.
- Baseline predictions vs. Scenario predictions.
- Computed percentage deltas.

The model strictly responds with structured JSON:
```json
{
  "executive_summary": "2-3 sentence overview of projected business trajectory...",
  "key_risks": ["Risk 1", "Risk 2", "Risk 3"],
  "recommendations": ["Action 1", "Action 2", "Action 3"],
  "confidence": "High | Medium | Low",
  "confidence_rationale": "Statistical rationale based on volatility and deltas..."
}
```

#### 3. Heuristic Fallback Advisor
- If no Gemini API key is configured, a deterministic rule-based heuristic advisor dynamically analyzes the simulation deltas and generates contextual insights, risks, and recommendations without failing.

---

### 💻 Layer 4: Web Dashboard (`frontend/`)

- **Tech Stack**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Recharts, Lucide React.
- **Component Architecture**:
  - `KPICard.tsx`: Animated financial metrics with gradient icon containers and trend badges.
  - `RevenueChart.tsx`: Dual-area interactive trend chart (Revenue vs. Expenses) with linear gradients.
  - `ExpenseBreakdown.tsx`: Donut pie chart detailing operating, marketing, and acquisition costs.
  - `CustomerMetrics.tsx`: Bar and line metrics for customer growth and churn velocity.
  - `SimulationPanel.tsx`: Interactive sliders for What-If parameter tuning with live feedback.
  - `ScenarioCompare.tsx`: Side-by-side baseline vs. scenario comparison bars.
  - `AdvisorPanel.tsx`: AI strategic decision support card with simulated typing animation for executive summaries.

---

### 📱 Layer 5: Mobile App (`mobile/`)

- **Tech Stack**: React Native 0.81.5, Expo SDK 54, React 19.1.0, Lucide React Native, React Native Chart Kit, Community Slider.
- **Features**:
  - **LAN Auto-Connectivity**: Configured to connect to the host's backend API (`http://10.92.2.204:8000`).
  - **3-Tab Navigation**:
    1. **Dashboard Tab**: KPI metric cards, bezier revenue curves, and customer metrics with pull-to-refresh.
    2. **Simulate Tab**: Native sliders for 5 parameters, simulation runner, and delta impact chips.
    3. **AI Advisor Tab**: Live Gemini insights, risk matrix, strategic recommendations, and scenario audit details.
  - **Offline Tolerance**: Displays connection status badges and inline retry triggers if backend connectivity changes.

---

## 4. How to Run the Complete System

### Step 1: Start Backend API (Port 8000)
```powershell
cd C:\Users\Admin\ai-business-digital-twin\ai-business-digital-twin\backend
python run.py
```

### Step 2: Start Web Dashboard (Port 3000)
```powershell
cd C:\Users\Admin\ai-business-digital-twin\ai-business-digital-twin\frontend
npm run dev
```
*Open [http://localhost:3000](http://localhost:3000) in your browser.*

### Step 3: Start Mobile App (Expo SDK 54 / Port 8081)
```powershell
cd C:\Users\Admin\ai-business-digital-twin\ai-business-digital-twin\mobile
npx expo start --lan -c
```
*Scan the generated QR code using **Expo Go** on Android or **Camera** on iOS.*

---

## 5. Walkthrough: Running a What-If Scenario

1. **Open the Simulator** (Web or Mobile).
2. **Set Parameters**:
   - *Marketing Budget*: `+25%`
   - *Product Price*: `+10%`
   - *Inventory Order Frequency*: `1.2x`
   - *Operating Expenses*: `-5%`
3. **Click "Run Simulation"**:
   - The frontend sends a `POST /api/v1/simulate` request.
   - The backend runs the scenario through the 4 trained ML models.
   - Outputs baseline vs. scenario predictions and percentage deltas.
   - Automatically logs the scenario into the database.
4. **View AI Insights**:
   - The simulation results are passed to Google Gemini (`POST /api/v1/advisor/insights`).
   - The AI advisor returns structured executive advice, key risks, and recommendations.
