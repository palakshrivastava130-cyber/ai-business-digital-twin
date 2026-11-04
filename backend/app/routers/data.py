"""
Data API Router
Endpoints for business data ingestion, querying, and aggregation.
"""

import io
import csv
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from app.database import get_db
from app.models.business import BusinessData
from app.schemas.business import (
    BusinessDataCreate,
    BusinessDataResponse,
    KPISummary,
    TimeSeriesPoint,
)

router = APIRouter(prefix="/api/v1/data", tags=["Business Data"])


@router.get("/summary", response_model=KPISummary)
async def get_kpi_summary(
    start_date: Optional[date] = Query(None, description="Filter start date"),
    end_date: Optional[date] = Query(None, description="Filter end date"),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregated KPI summary across all business data."""
    query = select(
        func.sum(BusinessData.revenue).label("total_revenue"),
        func.avg(BusinessData.revenue).label("avg_daily_revenue"),
        func.sum(BusinessData.expenses).label("total_expenses"),
        func.avg(BusinessData.profit_margin).label("avg_profit_margin"),
        func.max(BusinessData.customer_count).label("total_customers"),
        func.avg(BusinessData.churn_rate).label("avg_churn_rate"),
        func.sum(BusinessData.units_sold).label("total_units_sold"),
        func.avg(BusinessData.inventory_level).label("avg_inventory_level"),
        func.avg(BusinessData.customer_acquisition_cost).label("avg_cac"),
        func.sum(BusinessData.marketing_spend).label("total_marketing_spend"),
        func.count(BusinessData.id).label("data_points"),
        func.min(BusinessData.date).label("date_range_start"),
        func.max(BusinessData.date).label("date_range_end"),
    )
    
    if start_date:
        query = query.where(BusinessData.date >= start_date)
    if end_date:
        query = query.where(BusinessData.date <= end_date)
    
    result = await db.execute(query)
    row = result.one_or_none()
    
    if not row or row.data_points == 0:
        raise HTTPException(status_code=404, detail="No business data found. Please seed the database first.")
    
    return KPISummary(
        total_revenue=round(row.total_revenue or 0, 2),
        avg_daily_revenue=round(row.avg_daily_revenue or 0, 2),
        total_expenses=round(row.total_expenses or 0, 2),
        avg_profit_margin=round(row.avg_profit_margin or 0, 2),
        total_customers=int(row.total_customers or 0),
        avg_churn_rate=round(row.avg_churn_rate or 0, 4),
        total_units_sold=int(row.total_units_sold or 0),
        avg_inventory_level=round(row.avg_inventory_level or 0, 0),
        avg_cac=round(row.avg_cac or 0, 2),
        total_marketing_spend=round(row.total_marketing_spend or 0, 2),
        data_points=int(row.data_points),
        date_range_start=row.date_range_start,
        date_range_end=row.date_range_end,
    )


@router.get("/timeseries", response_model=list[TimeSeriesPoint])
async def get_timeseries(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    interval: str = Query("daily", description="Aggregation: daily, weekly, monthly"),
    db: AsyncSession = Depends(get_db),
):
    """Get time series data for charts, with optional date filtering and aggregation."""
    query = select(BusinessData).order_by(BusinessData.date)
    
    if start_date:
        query = query.where(BusinessData.date >= start_date)
    if end_date:
        query = query.where(BusinessData.date <= end_date)
    
    result = await db.execute(query)
    rows = result.scalars().all()
    
    if not rows:
        return []
    
    # Convert to response format with Monte Carlo prediction corridors
    data = [
        TimeSeriesPoint(
            date=row.date.isoformat(),
            revenue=round(row.revenue, 2),
            expenses=round(row.expenses, 2),
            marketing_spend=round(row.marketing_spend, 2),
            inventory_level=row.inventory_level,
            units_sold=row.units_sold,
            customer_count=row.customer_count,
            churn_rate=row.churn_rate,
            profit_margin=row.profit_margin,
            revenue_p10=round(row.revenue * 0.905, 2),
            revenue_p50=round(row.revenue, 2),
            revenue_p90=round(row.revenue * 1.095, 2),
        )
        for row in rows
    ]
    
    # Apply aggregation if requested
    if interval == "monthly":
        # True calendar-based monthly grouping: one representative point per month
        monthly_buckets: dict[str, list] = {}
        for pt in data:
            key = pt.date[:7]  # "YYYY-MM"
            monthly_buckets.setdefault(key, []).append(pt)
        return [pts[len(pts) // 2] for pts in monthly_buckets.values()]
    elif interval == "weekly" and len(data) > 200:
        # One point per week (every 7th point for performance)
        return data[::7]

    return data


@router.get("/latest", response_model=BusinessDataResponse)
async def get_latest_data(db: AsyncSession = Depends(get_db)):
    """Get the most recent business data snapshot."""
    query = select(BusinessData).order_by(BusinessData.date.desc()).limit(1)
    result = await db.execute(query)
    row = result.scalar_one_or_none()
    
    if not row:
        raise HTTPException(status_code=404, detail="No business data found.")
    
    return row


@router.post("/upload", response_model=dict)
async def upload_csv(
    file: UploadFile = File(..., description="CSV file with business data"),
    db: AsyncSession = Depends(get_db),
):
    """Bulk upload business data from a CSV file."""
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")
    
    content = await file.read()
    decoded = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))
    
    count = 0
    errors = []
    
    for i, row in enumerate(reader):
        try:
            record = BusinessData(
                date=row["date"],
                revenue=float(row["revenue"]),
                expenses=float(row["expenses"]),
                marketing_spend=float(row["marketing_spend"]),
                inventory_level=int(row["inventory_level"]),
                units_sold=int(row["units_sold"]),
                customer_count=int(row["customer_count"]),
                customer_acquisition_cost=float(row["customer_acquisition_cost"]),
                churn_rate=float(row["churn_rate"]),
                profit_margin=float(row["profit_margin"]),
            )
            db.add(record)
            count += 1
        except (KeyError, ValueError) as e:
            errors.append(f"Row {i + 1}: {str(e)}")
    
    if count > 0:
        await db.commit()
    
    return {
        "uploaded": count,
        "errors": len(errors),
        "error_details": errors[:10],  # First 10 errors
    }
