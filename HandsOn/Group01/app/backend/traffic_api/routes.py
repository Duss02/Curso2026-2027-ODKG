from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Request
from pydantic import ValidationError

from . import service
from .graphdb import GraphDBClient
from .models import AccidentDetail, AccidentFilters, AccidentPage, DatasetMetadata, Health, HotspotResult, Severity, SeverityCount

router = APIRouter(prefix="/api")


def get_graphdb(request: Request) -> GraphDBClient:
    return request.app.state.graphdb


Graph = Annotated[GraphDBClient, Depends(get_graphdb)]


def get_filters(
    severity: Annotated[list[Severity] | None, Query(max_length=4)] = None,
    start_date: date | None = None,
    end_date: date | None = None,
    street: Annotated[str | None, Query(max_length=120)] = None,
) -> AccidentFilters:
    try:
        return AccidentFilters(severities=tuple(severity or ()), start_date=start_date, end_date=end_date, street=street)
    except ValidationError as exc:
        raise HTTPException(422, detail=exc.errors()[0]["msg"]) from exc


Filters = Annotated[AccidentFilters, Depends(get_filters)]


@router.get("/health", response_model=Health)
async def health(graph: Graph):
    await service.check_health(graph)
    return Health()


@router.get("/statistics/severity", response_model=list[SeverityCount])
async def severity(graph: Graph, filters: Filters):
    return await service.severity_counts(graph, filters)


@router.get("/dataset", response_model=DatasetMetadata)
async def dataset(graph: Graph):
    return await service.dataset_metadata(graph)


@router.get("/hotspots", response_model=HotspotResult)
async def hotspots(graph: Graph, filters: Filters):
    return await service.hotspots(graph, filters)


@router.get("/accidents", response_model=AccidentPage)
async def accidents(
    graph: Graph,
    filters: Filters,
    limit: Annotated[int, Query(ge=1, le=1000)] = 100,
    offset: Annotated[int, Query(ge=0, le=1_000_000)] = 0,
):
    return AccidentPage(
        items=await service.list_accidents(graph, limit, offset, filters), limit=limit, offset=offset
    )


@router.get("/accidents/{accident_id}", response_model=AccidentDetail)
async def detail(graph: Graph, accident_id: Annotated[str, Path(pattern=r"^A-[A-Za-z0-9-]{1,80}$")]):
    result = await service.accident_detail(graph, accident_id)
    if result is None:
        raise HTTPException(404, detail="Accident not found.")
    return result
