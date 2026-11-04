"""
ML Inference Service
Loads pre-trained models and runs predictions for baseline and scenario analysis.
"""

import os
import numpy as np
import pandas as pd
import joblib
from typing import Optional
from app.config import get_settings


class MLService:
    """Service for loading ML models and running predictions."""
    
    def __init__(self):
        self.settings = get_settings()
        self.models = {}
        self.features = {}
        self.scaler = None
        self.churn_threshold = None
        self._loaded = False
    
    def load_models(self):
        """Load all pre-trained models from disk."""
        model_path = self.settings.MODEL_PATH
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model directory not found: {model_path}")
        
        model_names = ["revenue", "inventory", "churn", "profit"]
        
        for name in model_names:
            model_file = os.path.join(model_path, f"{name}_model.pkl")
            features_file = os.path.join(model_path, f"{name}_features.pkl")
            
            if os.path.exists(model_file):
                self.models[name] = joblib.load(model_file)
                print(f"  Loaded: {name}_model.pkl")
            else:
                print(f"  WARNING: {model_file} not found")
            
            if os.path.exists(features_file):
                self.features[name] = joblib.load(features_file)
        
        # Load scaler and churn threshold
        scaler_file = os.path.join(model_path, "feature_scaler.pkl")
        if os.path.exists(scaler_file):
            self.scaler = joblib.load(scaler_file)
        
        threshold_file = os.path.join(model_path, "churn_threshold.pkl")
        if os.path.exists(threshold_file):
            self.churn_threshold = joblib.load(threshold_file)
        
        self._loaded = True
        print(f"  All models loaded ({len(self.models)} models)")
    
    def _prepare_input(self, data: dict) -> pd.DataFrame:
        """Prepare a single-row DataFrame from input data for prediction."""
        # Create a row with all needed features
        row = {
            "revenue": data.get("revenue", 25000),
            "expenses": data.get("expenses", 15000),
            "marketing_spend": data.get("marketing_spend", 5000),
            "inventory_level": data.get("inventory_level", 3000),
            "units_sold": data.get("units_sold", 500),
            "customer_count": data.get("customer_count", 3000),
            "customer_acquisition_cost": data.get("customer_acquisition_cost", 35),
            "month_sin": data.get("month_sin", 0.0),
            "month_cos": data.get("month_cos", 1.0),
            "dow_sin": data.get("dow_sin", 0.0),
            "dow_cos": data.get("dow_cos", 1.0),
            "quarter": data.get("quarter", 1),
        }
        
        # Add lag features (deterministic: use current value as best approximation)
        for lag in [1, 3, 7, 14, 30]:
            row[f"revenue_lag_{lag}"] = row["revenue"]
            row[f"units_sold_lag_{lag}"] = row["units_sold"]
            row[f"inventory_level_lag_{lag}"] = row["inventory_level"]
        
        # Rolling features
        row["revenue_rolling_7"] = row["revenue"]
        row["revenue_rolling_30"] = row["revenue"]
        row["units_sold_rolling_7"] = row["units_sold"]
        row["units_sold_rolling_30"] = row["units_sold"]
        
        return pd.DataFrame([row])
    
    def predict_baseline(self, current_metrics: dict) -> dict:
        """Predict outcomes based on current business parameters."""
        if not self._loaded:
            self.load_models()
        
        input_df = self._prepare_input(current_metrics)
        
        results = {}
        
        # Revenue prediction
        if "revenue" in self.models and "revenue" in self.features:
            feature_cols = self.features["revenue"]
            available = [c for c in feature_cols if c in input_df.columns]
            X = input_df[available].values
            # Pad with zeros if features missing
            if len(available) < len(feature_cols):
                X = np.zeros((1, len(feature_cols)))
                for i, col in enumerate(feature_cols):
                    if col in input_df.columns:
                        X[0, i] = input_df[col].values[0]
            results["predicted_revenue"] = float(self.models["revenue"].predict(X)[0])
        else:
            results["predicted_revenue"] = current_metrics.get("revenue", 25000)
        
        # Inventory prediction
        if "inventory" in self.models and "inventory" in self.features:
            feature_cols = self.features["inventory"]
            X = np.zeros((1, len(feature_cols)))
            for i, col in enumerate(feature_cols):
                if col in input_df.columns:
                    X[0, i] = input_df[col].values[0]
            results["predicted_inventory"] = float(self.models["inventory"].predict(X)[0])
        else:
            results["predicted_inventory"] = current_metrics.get("inventory_level", 3000)
        
        # Churn prediction
        if "churn" in self.models and "churn" in self.features:
            feature_cols = self.features["churn"]
            X = np.zeros((1, len(feature_cols)))
            for i, col in enumerate(feature_cols):
                if col in input_df.columns:
                    X[0, i] = input_df[col].values[0]
            results["predicted_churn_probability"] = float(
                self.models["churn"].predict_proba(X)[0][1]
                if hasattr(self.models["churn"], "predict_proba")
                else self.models["churn"].predict(X)[0]
            )
        else:
            results["predicted_churn_probability"] = current_metrics.get("churn_rate", 0.03)
        
        # Profit margin prediction
        if "profit" in self.models and "profit" in self.features:
            feature_cols = self.features["profit"]
            X = np.zeros((1, len(feature_cols)))
            for i, col in enumerate(feature_cols):
                if col in input_df.columns:
                    X[0, i] = input_df[col].values[0]
            results["predicted_profit_margin"] = float(self.models["profit"].predict(X)[0])
        else:
            results["predicted_profit_margin"] = current_metrics.get("profit_margin", 10)
        
        return results
    
    def predict_scenario(self, current_metrics: dict, modifications: dict) -> dict:
        """
        Apply what-if modifications and predict outcomes.
        
        Args:
            current_metrics: Current business data
            modifications: Dict with keys like marketing_spend_change (%), price_change (%), etc.
        """
        # Apply modifications to create the scenario
        scenario_metrics = current_metrics.copy()
        
        # Marketing spend change
        mkt_change = modifications.get("marketing_spend_change", 0) / 100
        scenario_metrics["marketing_spend"] = current_metrics.get("marketing_spend", 5000) * (1 + mkt_change)
        
        # Price change affects units_sold inversely and revenue
        price_change = modifications.get("price_change", 0) / 100
        price_elasticity = -1.2  # Approximate price elasticity of demand
        demand_change = price_change * price_elasticity
        scenario_metrics["units_sold"] = int(
            current_metrics.get("units_sold", 500) * (1 + demand_change)
        )
        
        # Inventory change
        inv_multiplier = modifications.get("inventory_change", 0)
        if inv_multiplier != 0:
            scenario_metrics["inventory_level"] = int(
                current_metrics.get("inventory_level", 3000) * max(0.5, inv_multiplier)
            )
        
        # CAC change
        cac_change = modifications.get("cac_change", 0) / 100
        scenario_metrics["customer_acquisition_cost"] = (
            current_metrics.get("customer_acquisition_cost", 35) * (1 + cac_change)
        )
        
        # Expense change
        exp_change = modifications.get("expense_change", 0) / 100
        scenario_metrics["expenses"] = current_metrics.get("expenses", 15000) * (1 + exp_change)
        
        # Run prediction with modified scenario
        return self.predict_baseline(scenario_metrics)
    
    def compute_deltas(self, baseline: dict, scenario: dict) -> dict:
        """Calculate percentage change between baseline and scenario predictions."""
        deltas = {}
        for key in baseline:
            if baseline[key] != 0:
                delta = ((scenario[key] - baseline[key]) / abs(baseline[key])) * 100
                deltas[key.replace("predicted_", "") + "_change_pct"] = round(delta, 2)
            else:
                deltas[key.replace("predicted_", "") + "_change_pct"] = 0.0
        return deltas


# Singleton instance
ml_service = MLService()
