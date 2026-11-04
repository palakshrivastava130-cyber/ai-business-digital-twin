"""
ML Model Training Pipeline
Trains XGBoost and RandomForest models for business forecasting:
  - Revenue Forecaster (XGBRegressor)
  - Inventory Optimizer (RandomForestRegressor)
  - Churn Predictor (XGBClassifier)
  - Profit Margin Predictor (GradientBoostingRegressor)

Pre-trained models are saved to ml/models/ as .pkl files.
"""

import os
import warnings
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import TimeSeriesSplit
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.metrics import accuracy_score, f1_score

try:
    import xgboost as xgb
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False
    print("WARNING: xgboost not installed. Using sklearn alternatives.")

warnings.filterwarnings("ignore")


def create_lag_features(df: pd.DataFrame, target_col: str, lags: list[int]) -> pd.DataFrame:
    """Create lagged features for time series modeling."""
    result = df.copy()
    for lag in lags:
        result[f"{target_col}_lag_{lag}"] = result[target_col].shift(lag)
    return result


def add_time_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add cyclical time features for seasonality."""
    result = df.copy()
    result["month"] = result["date"].dt.month
    result["day_of_week"] = result["date"].dt.dayofweek
    result["day_of_year"] = result["date"].dt.dayofyear
    result["quarter"] = result["date"].dt.quarter
    
    # Cyclical encoding
    result["month_sin"] = np.sin(2 * np.pi * result["month"] / 12)
    result["month_cos"] = np.cos(2 * np.pi * result["month"] / 12)
    result["dow_sin"] = np.sin(2 * np.pi * result["day_of_week"] / 7)
    result["dow_cos"] = np.cos(2 * np.pi * result["day_of_week"] / 7)
    
    return result


def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    """Prepare the full feature set for modeling."""
    result = df.copy()
    result["date"] = pd.to_datetime(result["date"])
    
    # Add time features
    result = add_time_features(result)
    
    # Add lag features for key metrics
    for col in ["revenue", "units_sold", "inventory_level"]:
        result = create_lag_features(result, col, [1, 3, 7, 14, 30])
    
    # Rolling averages
    for col in ["revenue", "units_sold"]:
        result[f"{col}_rolling_7"] = result[col].rolling(7).mean()
        result[f"{col}_rolling_30"] = result[col].rolling(30).mean()
    
    # Drop rows with NaN from lag/rolling features
    result = result.dropna().reset_index(drop=True)
    
    return result


def train_revenue_model(df: pd.DataFrame, models_dir: str):
    """Train revenue forecasting model using XGBoost or GradientBoosting."""
    print("\n" + "=" * 60)
    print("Training Revenue Forecaster")
    print("=" * 60)
    
    feature_cols = [
        "marketing_spend", "inventory_level", "units_sold", "customer_count",
        "month_sin", "month_cos", "dow_sin", "dow_cos", "quarter",
        "revenue_lag_1", "revenue_lag_3", "revenue_lag_7", "revenue_lag_14", "revenue_lag_30",
        "units_sold_lag_1", "units_sold_lag_7",
        "revenue_rolling_7", "revenue_rolling_30",
    ]
    
    X = df[feature_cols].values
    y = df["revenue"].values
    
    # Walk-forward split (80/20 chronological)
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    
    if HAS_XGBOOST:
        model = xgb.XGBRegressor(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
        )
    else:
        model = GradientBoostingRegressor(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            random_state=42,
        )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    r2 = r2_score(y_test, preds)
    
    print(f"  MAE:  ${mae:,.2f}")
    print(f"  RMSE: ${rmse:,.2f}")
    print(f"  R2:   {r2:.4f}")
    
    # Save model
    model_path = os.path.join(models_dir, "revenue_model.pkl")
    joblib.dump(model, model_path)
    print(f"  Saved: {model_path}")
    
    # Save feature column names for inference
    joblib.dump(feature_cols, os.path.join(models_dir, "revenue_features.pkl"))
    
    return model


def train_inventory_model(df: pd.DataFrame, models_dir: str):
    """Train inventory optimization model using RandomForest."""
    print("\n" + "=" * 60)
    print("Training Inventory Optimizer")
    print("=" * 60)
    
    feature_cols = [
        "revenue", "units_sold", "marketing_spend",
        "month_sin", "month_cos", "dow_sin", "dow_cos",
        "units_sold_lag_1", "units_sold_lag_7", "units_sold_lag_30",
        "inventory_level_lag_1", "inventory_level_lag_7",
        "units_sold_rolling_7", "units_sold_rolling_30",
    ]
    
    X = df[feature_cols].values
    y = df["inventory_level"].values
    
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    
    model = RandomForestRegressor(
        n_estimators=150,
        max_depth=8,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)
    
    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    
    print(f"  MAE:  {mae:,.0f} units")
    print(f"  R2:   {r2:.4f}")
    
    model_path = os.path.join(models_dir, "inventory_model.pkl")
    joblib.dump(model, model_path)
    joblib.dump(feature_cols, os.path.join(models_dir, "inventory_features.pkl"))
    print(f"  Saved: {model_path}")
    
    return model


def train_churn_model(df: pd.DataFrame, models_dir: str):
    """Train churn prediction model using XGBoost classifier."""
    print("\n" + "=" * 60)
    print("Training Churn Predictor")
    print("=" * 60)
    
    # Convert churn_rate to binary classification (high churn = 1)
    churn_threshold = df["churn_rate"].median()
    y = (df["churn_rate"] > churn_threshold).astype(int).values
    
    feature_cols = [
        "revenue", "expenses", "marketing_spend", "customer_count",
        "customer_acquisition_cost", "units_sold",
        "month_sin", "month_cos", "quarter",
        "revenue_lag_7", "revenue_lag_30",
    ]
    
    X = df[feature_cols].values
    
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    
    if HAS_XGBOOST:
        model = xgb.XGBClassifier(
            n_estimators=150,
            max_depth=5,
            learning_rate=0.05,
            random_state=42,
            eval_metric="logloss",
        )
    else:
        from sklearn.ensemble import GradientBoostingClassifier
        model = GradientBoostingClassifier(
            n_estimators=150,
            max_depth=5,
            learning_rate=0.05,
            random_state=42,
        )
    
    model.fit(X_train, y_train)
    
    preds = model.predict(X_test)
    acc = accuracy_score(y_test, preds)
    f1 = f1_score(y_test, preds)
    
    print(f"  Accuracy: {acc:.4f}")
    print(f"  F1 Score: {f1:.4f}")
    
    model_path = os.path.join(models_dir, "churn_model.pkl")
    joblib.dump(model, model_path)
    joblib.dump(feature_cols, os.path.join(models_dir, "churn_features.pkl"))
    joblib.dump(churn_threshold, os.path.join(models_dir, "churn_threshold.pkl"))
    print(f"  Saved: {model_path}")
    
    return model


def train_profit_model(df: pd.DataFrame, models_dir: str):
    """Train profit margin predictor using GradientBoosting."""
    print("\n" + "=" * 60)
    print("Training Profit Margin Predictor")
    print("=" * 60)
    
    feature_cols = [
        "revenue", "expenses", "marketing_spend",
        "units_sold", "inventory_level", "customer_count",
        "month_sin", "month_cos", "quarter",
        "revenue_lag_1", "revenue_lag_7",
        "revenue_rolling_7", "revenue_rolling_30",
    ]
    
    X = df[feature_cols].values
    y = df["profit_margin"].values
    
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    
    model = GradientBoostingRegressor(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        random_state=42,
    )
    model.fit(X_train, y_train)
    
    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    
    print(f"  MAE:  {mae:.2f}%")
    print(f"  R2:   {r2:.4f}")
    
    model_path = os.path.join(models_dir, "profit_model.pkl")
    joblib.dump(model, model_path)
    joblib.dump(feature_cols, os.path.join(models_dir, "profit_features.pkl"))
    print(f"  Saved: {model_path}")
    
    # Save feature scaler for all models
    scaler = StandardScaler()
    all_features = df[["revenue", "expenses", "marketing_spend", "inventory_level",
                        "units_sold", "customer_count", "customer_acquisition_cost"]].values
    scaler.fit(all_features)
    joblib.dump(scaler, os.path.join(models_dir, "feature_scaler.pkl"))
    
    return model


def main():
    """Run the complete training pipeline."""
    # Paths
    base_dir = os.path.dirname(__file__)
    data_path = os.path.join(base_dir, "data", "synthetic_business_data.csv")
    models_dir = os.path.join(base_dir, "models")
    os.makedirs(models_dir, exist_ok=True)
    
    # Check if data exists, generate if not
    if not os.path.exists(data_path):
        print("Data not found. Generating synthetic data first...")
        from generate_synthetic_data import generate_synthetic_data
        df_raw = generate_synthetic_data()
        os.makedirs(os.path.dirname(data_path), exist_ok=True)
        df_raw.to_csv(data_path, index=False)
    
    # Load data
    print("Loading data from:", data_path)
    df_raw = pd.read_csv(data_path)
    df_raw["date"] = pd.to_datetime(df_raw["date"])
    
    # Prepare features
    print("Preparing features...")
    df = prepare_features(df_raw)
    print(f"Dataset: {len(df)} rows, {len(df.columns)} columns")
    
    # Train all models
    train_revenue_model(df, models_dir)
    train_inventory_model(df, models_dir)
    train_churn_model(df, models_dir)
    train_profit_model(df, models_dir)
    
    print("\n" + "=" * 60)
    print("ALL MODELS TRAINED SUCCESSFULLY")
    print("=" * 60)
    print(f"Models saved to: {models_dir}")
    print("Files:")
    for f in sorted(os.listdir(models_dir)):
        size = os.path.getsize(os.path.join(models_dir, f))
        print(f"  {f} ({size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
