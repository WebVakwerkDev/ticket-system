from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date, timedelta

from app.database import get_db
from app.core.dependencies import get_current_user
from app.modules.tasks.models import Task, TaskStatus
from app.models.project import ProjectWorkspace
from app.modules.tasks.schemas import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskResponse])
async def list_tasks(
    project_id: str | None = Query(None),
    task_status: str | None = Query(None, alias="status"),
    upcoming: bool = Query(False),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Task, ProjectWorkspace.name.label("project_name"))
        .outerjoin(ProjectWorkspace, Task.project_id == ProjectWorkspace.id)
        .order_by(Task.deadline.asc().nullslast(), Task.created_at.desc())
    )

    if project_id:
        query = query.where(Task.project_id == project_id)
    if task_status:
        query = query.where(Task.status == task_status)
    if upcoming:
        # Tasks with deadline in next 14 days or overdue, not done
        query = query.where(
            Task.status != TaskStatus.DONE.value,
            Task.deadline.isnot(None),
            Task.deadline <= date.today() + timedelta(days=14),
        )

    result = await db.execute(query)
    tasks = []
    for row in result.all():
        task = row[0]
        resp = TaskResponse.model_validate(task)
        resp.project_name = row[1]
        tasks.append(resp)
    return tasks


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    data: TaskCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task = Task(
        title=data.title,
        description=data.description,
        project_id=data.project_id,
        assigned_to_user_id=current_user.id,
        deadline=data.deadline,
    )
    db.add(task)
    await db.flush()
    await db.refresh(task)
    return TaskResponse.model_validate(task)


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    data: TaskUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.assigned_to_user_id and task.assigned_to_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your task")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)

    await db.flush()
    await db.refresh(task)
    return TaskResponse.model_validate(task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.assigned_to_user_id and task.assigned_to_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your task")
    await db.delete(task)
