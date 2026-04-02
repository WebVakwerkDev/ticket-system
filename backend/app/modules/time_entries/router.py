from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
from decimal import Decimal
from datetime import date

from app.database import get_db
from app.core.dependencies import get_current_user
from app.modules.time_entries.models import TimeEntry
from app.models.project import ProjectWorkspace
from app.modules.time_entries.schemas import TimeEntryCreate, TimeEntryUpdate, TimeEntryResponse, TimeEntrySummary

router = APIRouter(prefix="/api/v1/time-entries", tags=["time-entries"])


@router.get("", response_model=list[TimeEntryResponse])
async def list_time_entries(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    project_id: str | None = Query(None),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(TimeEntry, ProjectWorkspace.name.label("project_name")).join(
        ProjectWorkspace, TimeEntry.project_id == ProjectWorkspace.id
    ).order_by(TimeEntry.date.desc())

    if start_date:
        query = query.where(TimeEntry.date >= start_date)
    if end_date:
        query = query.where(TimeEntry.date <= end_date)
    if project_id:
        query = query.where(TimeEntry.project_id == project_id)

    result = await db.execute(query)
    entries = []
    for row in result.all():
        entry = row[0]
        resp = TimeEntryResponse.model_validate(entry)
        resp.project_name = row[1]
        entries.append(resp)
    return entries


@router.post("", response_model=TimeEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_time_entry(
    data: TimeEntryCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify project exists
    project = await db.execute(select(ProjectWorkspace).where(ProjectWorkspace.id == data.project_id))
    if not project.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")

    entry = TimeEntry(
        user_id=current_user.id,
        project_id=data.project_id,
        date=data.date,
        hours=data.hours,
        description=data.description,
    )
    db.add(entry)
    await db.flush()
    await db.refresh(entry)
    return TimeEntryResponse.model_validate(entry)


@router.put("/{entry_id}", response_model=TimeEntryResponse)
async def update_time_entry(
    entry_id: str,
    data: TimeEntryUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(TimeEntry).where(TimeEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    if entry.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your time entry")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(entry, key, value)

    await db.flush()
    await db.refresh(entry)
    return TimeEntryResponse.model_validate(entry)


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_time_entry(
    entry_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(TimeEntry).where(TimeEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    if entry.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your time entry")
    await db.delete(entry)


@router.get("/summary", response_model=TimeEntrySummary)
async def time_entry_summary(
    year: int = Query(default=None),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if year is None:
        year = date.today().year

    # Total hours for the year
    total_result = await db.execute(
        select(func.coalesce(func.sum(TimeEntry.hours), 0))
        .where(extract("year", TimeEntry.date) == year)
    )
    total_hours = total_result.scalar() or Decimal("0")

    # Monthly breakdown
    monthly_result = await db.execute(
        select(
            extract("month", TimeEntry.date).label("month"),
            func.sum(TimeEntry.hours).label("hours"),
        )
        .where(extract("year", TimeEntry.date) == year)
        .group_by(extract("month", TimeEntry.date))
        .order_by(extract("month", TimeEntry.date))
    )
    monthly = [{"month": int(row.month), "hours": row.hours} for row in monthly_result.all()]

    # By project breakdown
    project_result = await db.execute(
        select(
            ProjectWorkspace.name.label("project_name"),
            func.sum(TimeEntry.hours).label("hours"),
        )
        .join(ProjectWorkspace, TimeEntry.project_id == ProjectWorkspace.id)
        .where(extract("year", TimeEntry.date) == year)
        .group_by(ProjectWorkspace.name)
        .order_by(func.sum(TimeEntry.hours).desc())
    )
    by_project = [{"project_name": row.project_name, "hours": row.hours} for row in project_result.all()]

    return TimeEntrySummary(
        year=year,
        total_hours=total_hours,
        monthly=monthly,
        by_project=by_project,
    )
