"""Map graph bindings to the public API without any secondary data store."""

from urllib.parse import unquote

from . import queries
from .graphdb import Binding, GraphDBClient, GraphDBError, invalid_response
from .models import Accident, AccidentDetail, AccidentFilters, DatasetMetadata, HotspotCell, HotspotResult, SeverityCount


def severity_from_row(row: dict[str, Binding]) -> SeverityCount:
    try:
        return SeverityCount(severity=int(row["severity"].value), count=int(row["count"].value))
    except (KeyError, ValueError) as exc:
        raise invalid_response() from exc


def accident_from_row(row: dict[str, Binding]) -> Accident:
    try:
        uri = row["accident"].value
        if row["accident"].type != "uri" or not uri.startswith(queries.ACCIDENT_PREFIX):
            raise ValueError("Unexpected accident URI")
        identifier = unquote(uri[len(queries.ACCIDENT_PREFIX):])
        if not identifier:
            raise ValueError("Missing accident ID")
        return Accident(
            id=identifier,
            uri=uri,
            latitude=float(row["latitude"].value),
            longitude=float(row["longitude"].value),
            severity=int(row["severity"].value),
            start_time=row["startTime"].value,
            street_name=row["streetName"].value if "streetName" in row else None,
        )
    except (KeyError, ValueError) as exc:
        raise invalid_response() from exc


async def check_health(client: GraphDBClient) -> None:
    rows = await client.select(queries.HEALTH)
    if len(rows) != 1 or rows[0].get("ok") is None or rows[0]["ok"].value != "1":
        raise invalid_response()


async def severity_counts(client: GraphDBClient, filters: AccidentFilters) -> list[SeverityCount]:
    return [severity_from_row(row) for row in await client.select(queries.severity_query(filters))]


async def list_accidents(client: GraphDBClient, limit: int, offset: int, filters: AccidentFilters) -> list[Accident]:
    return [accident_from_row(row) for row in await client.select(queries.accidents_query(limit, offset, filters))]


def optional_value(row: dict[str, Binding], key: str) -> str | None:
    return row[key].value if key in row else None


async def accident_detail(client: GraphDBClient, accident_id: str) -> AccidentDetail | None:
    rows = await client.select(queries.detail_query(accident_id))
    if not rows:
        return None
    row = rows[0]
    try:
        signal = optional_value(row, "trafficSignal")
        if signal is not None and signal not in {"true", "false", "1", "0"}:
            raise ValueError("Invalid RDF boolean")
        return AccidentDetail(
            **accident_from_row(row).model_dump(),
            end_time=optional_value(row, "endTime"), description=optional_value(row, "description"),
            has_traffic_signal=None if signal is None else signal in {"true", "1"},
            street_uri=optional_value(row, "streetUri"), street_wikidata_uri=optional_value(row, "streetWikidataUri"),
            city=optional_value(row, "city"), state=optional_value(row, "state"), country=optional_value(row, "country"),
        )
    except ValueError as exc:
        raise invalid_response() from exc


async def dataset_metadata(client: GraphDBClient) -> DatasetMetadata:
    rows = await client.select(queries.METADATA)
    if len(rows) != 1:
        raise invalid_response()
    row = rows[0]
    try:
        return DatasetMetadata(
            start_time=optional_value(row, "firstTime"), end_time=optional_value(row, "lastTime"),
            **{key: float(row[key].value) if key in row else None for key in ("south", "north", "west", "east")},
        )
    except ValueError as exc:
        raise invalid_response() from exc


async def hotspots(client: GraphDBClient, filters: AccidentFilters) -> HotspotResult:
    rows = await client.select(queries.hotspots_query(filters))
    if len(rows) > queries.MAX_HOTSPOT_CELLS:
        raise GraphDBError(422, "hotspot_limit_exceeded", "Too many hotspot cells. Narrow the filters; no partial grid was returned.")
    try:
        cells = []
        for row in rows:
            lat_bin, lng_bin = int(row["latBin"].value), int(row["lngBin"].value)
            cells.append(HotspotCell(
                south=round(lat_bin * queries.CELL_SIZE, 6),
                north=round((lat_bin + 1) * queries.CELL_SIZE, 6),
                west=round(lng_bin * queries.CELL_SIZE, 6),
                east=round((lng_bin + 1) * queries.CELL_SIZE, 6),
                count=int(row["count"].value),
            ))
        return HotspotResult(
            cell_size_degrees=queries.CELL_SIZE, cells=cells,
            total=sum(cell.count for cell in cells),
            max_count=max((cell.count for cell in cells), default=0),
        )
    except (KeyError, ValueError, OverflowError) as exc:
        raise invalid_response() from exc
