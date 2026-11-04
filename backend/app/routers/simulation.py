"""
Simulation API Router
Endpoints for What-If analysis and scenario comparison.
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.business import BusinessData, SimulationLog
from app.schemas.business import (
    SimulationRequest,
    SimulationResponse,
    PredictionMetrics,
    GoalSeekRequest,
    SensitivityCell,
    SensitivityResponse,
)
from scipy.optimize import minimize
from app.services.ml_service import ml_service

router = APIRouter(prefix="/api/v1", tags=["Simulation"])


@router.post("/simulate", response_model=SimulationResponse)
async def run_simulation(
    request: SimulationRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Run a What-If simulation.
    
    Applies the requested parameter changes to current business metrics,
    runs ML predictions for both baseline and scenario, and computes deltas.
    """
    # Get latest business data as the baseline input
    query = select(BusinessData).order_by(BusinessData.date.desc()).limit(30)
    result = await db.execute(query)
    recent_data = result.scalars().all()
    
    if not recent_data:
        raise HTTPException(
            status_code=404, 
            detail="No business data available. Please seed the database first."
        )
    
    # Calculate average of recent data as current metrics
    current_metrics = {
        "revenue": sum(r.revenue for r in recent_data) / len(recent_data),
        "expenses": sum(r.expenses for r in recent_data) / len(recent_data),
        "marketing_spend": sum(r.marketing_spend for r in recent_data) / len(recent_data),
        "inventory_level": int(sum(r.inventory_level for r in recent_data) / len(recent_data)),
        "units_sold": int(sum(r.units_sold for r in recent_data) / len(recent_data)),
        "customer_count": int(sum(r.customer_count for r in recent_data) / len(recent_data)),
        "customer_acquisition_cost": sum(r.customer_acquisition_cost for r in recent_data) / len(recent_data),
        "churn_rate": sum(r.churn_rate for r in recent_data) / len(recent_data),
        "profit_margin": sum(r.profit_margin for r in recent_data) / len(recent_data),
    }
    
    # Run baseline prediction (no changes)
    baseline_results = ml_service.predict_baseline(current_metrics)
    
    # Run scenario prediction (with changes)
    modifications = {
        "marketing_spend_change": request.marketing_spend_change,
        "price_change": request.price_change,
        "inventory_change": request.inventory_change,
        "cac_change": request.cac_change,
        "expense_change": request.expense_change,
    }
    scenario_results = ml_service.predict_scenario(current_metrics, modifications)
    
    # Compute deltas
    deltas = ml_service.compute_deltas(baseline_results, scenario_results)
    
    # Build response
    baseline = PredictionMetrics(**baseline_results)
    scenario = PredictionMetrics(**scenario_results)
    
    response = SimulationResponse(
        scenario_name=request.scenario_name,
        parameters=request,
        baseline=baseline,
        scenario=scenario,
        deltas=deltas,
        timestamp=datetime.utcnow(),
    )
    
    # Save to database
    log = SimulationLog(
        scenario_name=request.scenario_name,
        parameters=request.model_dump(),
        baseline_prediction=baseline_results,
        scenario_prediction=scenario_results,
        llm_insights=None,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    
    response.id = log.id
    
    return response


@router.get("/simulations/history", response_model=list[SimulationResponse])
async def get_simulation_history(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get history of past simulation runs."""
    query = (
        select(SimulationLog)
        .order_by(SimulationLog.timestamp.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    logs = result.scalars().all()
    
    responses = []
    for log in logs:
        params = SimulationRequest(**log.parameters) if log.parameters else SimulationRequest()
        baseline = PredictionMetrics(**log.baseline_prediction) if log.baseline_prediction else PredictionMetrics(
            predicted_revenue=0, predicted_inventory=0, predicted_churn_probability=0, predicted_profit_margin=0
        )
        scenario_pred = PredictionMetrics(**log.scenario_prediction) if log.scenario_prediction else baseline
        
        baseline_dict = log.baseline_prediction or {}
        scenario_dict = log.scenario_prediction or {}
        deltas = ml_service.compute_deltas(baseline_dict, scenario_dict) if baseline_dict and scenario_dict else {}
        
        responses.append(SimulationResponse(
            id=log.id,
            scenario_name=log.scenario_name,
            parameters=params,
            baseline=baseline,
            scenario=scenario_pred,
            deltas=deltas,
            timestamp=log.timestamp,
        ))
    
    return responses


@router.post("/simulate/goal-seek", response_model=SimulationResponse)
async def run_goal_seek(
    request: GoalSeekRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Run Reverse Goal-Seek optimization.
    Finds optimal slider settings closest to baseline to meet target revenue/margin.
    """
    # Get latest business data
    query = select(BusinessData).order_by(BusinessData.date.desc()).limit(30)
    result = await db.execute(query)
    recent_data = result.scalars().all()
    
    if not recent_data:
        raise HTTPException(
            status_code=404, 
            detail="No business data available. Please seed the database first."
        )
    
    current_metrics = {
        "revenue": sum(r.revenue for r in recent_data) / len(recent_data),
        "expenses": sum(r.expenses for r in recent_data) / len(recent_data),
        "marketing_spend": sum(r.marketing_spend for r in recent_data) / len(recent_data),
        "inventory_level": int(sum(r.inventory_level for r in recent_data) / len(recent_data)),
        "units_sold": int(sum(r.units_sold for r in recent_data) / len(recent_data)),
        "customer_count": int(sum(r.customer_count for r in recent_data) / len(recent_data)),
        "customer_acquisition_cost": sum(r.customer_acquisition_cost for r in recent_data) / len(recent_data),
        "churn_rate": sum(r.churn_rate for r in recent_data) / len(recent_data),
        "profit_margin": sum(r.profit_margin for r in recent_data) / len(recent_data),
    }
    
    baseline_results = ml_service.predict_baseline(current_metrics)
    
    # Defaults targets to baseline values if not provided
    target_rev = request.target_revenue if request.target_revenue is not None else baseline_results["predicted_revenue"]
    target_margin = request.target_profit_margin if request.target_profit_margin is not None else baseline_results["predicted_profit_margin"]
    
    # x = [marketing_spend_change, price_change, inventory_change, cac_change, expense_change]
    x0 = [0.0, 0.0, 1.0, 0.0, 0.0]
    bounds = [
        (-50.0, 100.0), # marketing spend
        (-20.0, 30.0),  # price change
        (0.5, 2.0),     # inventory multiplier
        (-50.0, 100.0), # cac change
        (-30.0, 50.0),  # expense change
    ]
    
    def objective(x):
        mods = {
            "marketing_spend_change": float(x[0]),
            "price_change": float(x[1]),
            "inventory_change": float(x[2]),
            "cac_change": float(x[3]),
            "expense_change": float(x[4]),
        }
        pred = ml_service.predict_scenario(current_metrics, mods)
        
        # Loss terms: normalized squared error
        loss = 0.0
        if request.target_revenue is not None:
            loss += ((pred["predicted_revenue"] - target_rev) / target_rev) ** 2 * 100
        if request.target_profit_margin is not None:
            loss += (pred["predicted_profit_margin"] - target_margin) ** 2
            
        # Regularization: favor minimal parameter deviations from baseline
        loss += 0.05 * (x[0]**2 + x[1]**2 + (x[2] - 1.0)**2 + x[3]**2 + x[4]**2)
        return loss
    
    # Optimization solver
    solver_res = minimize(objective, x0, bounds=bounds, method="SLSQP")
    solved_x = solver_res.x
    
    solved_params = SimulationRequest(
        scenario_name=f"Goal-Seek: Rev={target_rev/1000:.0f}k Marg={target_margin:.1f}%",
        marketing_spend_change=round(float(solved_x[0]), 1),
        price_change=round(float(solved_x[1]), 1),
        inventory_change=round(float(solved_x[2]), 2),
        cac_change=round(float(solved_x[3]), 1),
        expense_change=round(float(solved_x[4]), 1),
    )
    
    # Run prediction using optimized settings
    solved_mods = {
        "marketing_spend_change": solved_params.marketing_spend_change,
        "price_change": solved_params.price_change,
        "inventory_change": solved_params.inventory_change,
        "cac_change": solved_params.cac_change,
        "expense_change": solved_params.expense_change,
    }
    
    scenario_results = ml_service.predict_scenario(current_metrics, solved_mods)
    deltas = ml_service.compute_deltas(baseline_results, scenario_results)
    
    baseline = PredictionMetrics(**baseline_results)
    scenario = PredictionMetrics(**scenario_results)
    
    response = SimulationResponse(
        scenario_name=solved_params.scenario_name,
        parameters=solved_params,
        baseline=baseline,
        scenario=scenario,
        deltas=deltas,
        timestamp=datetime.utcnow(),
    )
    
    # Save to history log
    log = SimulationLog(
        scenario_name=solved_params.scenario_name,
        parameters=solved_params.model_dump(),
        baseline_prediction=baseline_results,
        scenario_prediction=scenario_results,
        llm_insights=None,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    
    response.id = log.id
    return response


@router.post("/simulate/sensitivity", response_model=SensitivityResponse)
async def get_sensitivity_matrix(
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a 5x5 sensitivity matrix comparing Price Change (-10% to +10%)
    vs Marketing Spend (-20% to +40%) for strategic yield optimization.
    """
    # Get latest business data
    query = select(BusinessData).order_by(BusinessData.date.desc()).limit(30)
    result = await db.execute(query)
    recent_data = result.scalars().all()
    
    if not recent_data:
        raise HTTPException(
            status_code=404, 
            detail="No business data available. Please seed the database first."
        )
        
    current_metrics = {
        "revenue": sum(r.revenue for r in recent_data) / len(recent_data),
        "expenses": sum(r.expenses for r in recent_data) / len(recent_data),
        "marketing_spend": sum(r.marketing_spend for r in recent_data) / len(recent_data),
        "inventory_level": int(sum(r.inventory_level for r in recent_data) / len(recent_data)),
        "units_sold": int(sum(r.units_sold for r in recent_data) / len(recent_data)),
        "customer_count": int(sum(r.customer_count for r in recent_data) / len(recent_data)),
        "customer_acquisition_cost": sum(r.customer_acquisition_cost for r in recent_data) / len(recent_data),
        "churn_rate": sum(r.churn_rate for r in recent_data) / len(recent_data),
        "profit_margin": sum(r.profit_margin for r in recent_data) / len(recent_data),
    }

    price_changes = [-10.0, -5.0, 0.0, 5.0, 10.0]
    marketing_changes = [-20.0, -5.0, 10.0, 25.0, 40.0]
    
    grid_cells = []
    optimal_cell = None
    
    for prc in price_changes:
        for mkt in marketing_changes:
            mods = {
                "marketing_spend_change": float(mkt),
                "price_change": float(prc),
                "inventory_change": 1.0,
                "cac_change": 0.0,
                "expense_change": 0.0,
            }
            pred = ml_service.predict_scenario(current_metrics, mods)
            cell = SensitivityCell(
                price_change=prc,
                marketing_spend_change=mkt,
                revenue=round(pred["predicted_revenue"], 2),
                profit_margin=round(pred["predicted_profit_margin"], 2),
            )
            grid_cells.append(cell)
            
            # Find the optimal sweet spot (highest profit margin)
            if optimal_cell is None or cell.profit_margin > optimal_cell.profit_margin:
                optimal_cell = cell
                
    return SensitivityResponse(
        grid=grid_cells,
        optimal=optimal_cell or grid_cells[12]  # Default to center if none resolved
    )


