"""
LLM Advisor API Router
Endpoints for AI-powered business insights and recommendations.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.database import get_db
from app.models.business import SimulationLog
from app.schemas.business import (
    AdvisorRequest,
    LLMInsightResponse,
    SimulationResponse,
    SimulationRequest,
    PredictionMetrics,
    ChatRequest,
    ChatResponse,
    CompetitorReactionResponse,
)
from app.services.llm_service import llm_service
from app.services.ml_service import ml_service

router = APIRouter(prefix="/api/v1/advisor", tags=["LLM Advisor"])


@router.post("/insights", response_model=LLMInsightResponse)
async def get_insights(
    request: AdvisorRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate AI-powered business insights from simulation results.
    
    Sends the simulation data to Google Gemini for analysis and returns
    structured business advice including risks and recommendations.
    """
    try:
        insights = await llm_service.generate_insights(
            simulation=request.simulation_result,
            additional_context=request.additional_context,
        )
        
        # Save insights to the simulation log if we have an ID
        if request.simulation_result.id:
            stmt = (
                update(SimulationLog)
                .where(SimulationLog.id == request.simulation_result.id)
                .values(llm_insights=insights.executive_summary)
            )
            await db.execute(stmt)
            await db.commit()
        
        return insights
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate insights: {str(e)}"
        )


@router.get("/insights/{simulation_id}", response_model=LLMInsightResponse)
async def get_insights_by_id(
    simulation_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate insights for a past simulation by its ID.
    Retrieves the simulation from the database and runs LLM analysis.
    """
    query = select(SimulationLog).where(SimulationLog.id == simulation_id)
    result = await db.execute(query)
    log = result.scalar_one_or_none()
    
    if not log:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    # Reconstruct simulation response
    params = SimulationRequest(**log.parameters) if log.parameters else SimulationRequest()
    baseline = PredictionMetrics(**log.baseline_prediction)
    scenario = PredictionMetrics(**log.scenario_prediction)
    deltas = ml_service.compute_deltas(log.baseline_prediction, log.scenario_prediction)
    
    simulation = SimulationResponse(
        id=log.id,
        scenario_name=log.scenario_name,
        parameters=params,
        baseline=baseline,
        scenario=scenario,
        deltas=deltas,
        timestamp=log.timestamp,
    )
    
    insights = await llm_service.generate_insights(simulation)
    
    # Update the log
    stmt = (
        update(SimulationLog)
        .where(SimulationLog.id == simulation_id)
        .values(llm_insights=insights.executive_summary)
    )
    await db.execute(stmt)
    await db.commit()
    
    return insights


@router.post("/chat", response_model=ChatResponse)
async def chat_copilot_endpoint(
    request: ChatRequest,
):
    """
    Conversational Strategy Chat with active simulation context.
    """
    try:
        reply = await llm_service.chat_copilot(
            message=request.message,
            simulation=request.simulation_result,
            history=request.history,
        )
        return ChatResponse(response=reply)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to converse with copilot: {str(e)}"
        )


@router.post("/competitor", response_model=CompetitorReactionResponse)
async def competitor_reaction_endpoint(
    request: AdvisorRequest,
):
    """
    Generate adversarial competitor reaction forecasts.
    """
    try:
        reaction = await llm_service.generate_competitor_reaction(request.simulation_result)
        return reaction
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Competitor reaction forecast failed: {str(e)}"
        )


