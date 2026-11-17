from datetime import date, datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, model_validator

Severity = Annotated[int, Field(ge=1, le=4)]


class AccidentFilters(BaseModel):
    model_config = ConfigDict(frozen=True)
    severities: tuple[Severity, ...] = ()
    start_date: date | None = None
    end_date: date | None = None
    street: str | None = Field(default=None, max_length=120)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValueError("Start date must be on or before end date.")
        if self.end_date == date.max:
            raise ValueError("End date must be earlier than 9999-12-31.")
        return self


class Health(BaseModel):
    status: str = "ok"
    graphdb: str = "reachable"


class SeverityCount(BaseModel):
    severity: int = Field(ge=1, le=4)
    count: int = Field(ge=0)


class Accident(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False)

    id: str
    uri: str
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    severity: int = Field(ge=1, le=4)
    start_time: datetime
    street_name: str | None = None


class AccidentPage(BaseModel):
    items: list[Accident]
    limit: int
    offset: int


class AccidentDetail(Accident):
    end_time: datetime | None = None
    description: str | None = None
    has_traffic_signal: bool | None = None
    street_uri: str | None = None
    street_wikidata_uri: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None


class DatasetMetadata(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False)
    start_time: datetime | None = None
    end_time: datetime | None = None
    south: float | None = Field(default=None, ge=-90, le=90)
    north: float | None = Field(default=None, ge=-90, le=90)
    west: float | None = Field(default=None, ge=-180, le=180)
    east: float | None = Field(default=None, ge=-180, le=180)


class HotspotCell(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False)
    south: float = Field(ge=-90, le=90)
    north: float = Field(ge=-90, le=90)
    west: float = Field(ge=-180, le=180)
    east: float = Field(ge=-180, le=180)
    count: int = Field(ge=1)

    @model_validator(mode="after")
    def valid_bounds(self):
        if self.south >= self.north or self.west >= self.east:
            raise ValueError("Invalid hotspot bounds")
        return self


class HotspotResult(BaseModel):
    cell_size_degrees: float
    cells: list[HotspotCell]
    total: int = Field(ge=0)
    max_count: int = Field(ge=0)
