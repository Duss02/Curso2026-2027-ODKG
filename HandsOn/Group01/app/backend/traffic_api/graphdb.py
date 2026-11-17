"""HTTP transport and validation for SPARQL SELECT JSON responses."""

import httpx
from pydantic import BaseModel, StrictStr


class GraphDBError(Exception):
    def __init__(self, status_code: int, code: str, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.code = code


class Binding(BaseModel):
    type: StrictStr
    value: StrictStr


class ResultRows(BaseModel):
    bindings: list[dict[str, Binding]]


class ResultHead(BaseModel):
    vars: list[StrictStr]


class SelectResult(BaseModel):
    head: ResultHead
    results: ResultRows


def invalid_response() -> GraphDBError:
    return GraphDBError(502, "graphdb_invalid_response", "GraphDB returned invalid SPARQL results.")


class GraphDBClient:
    def __init__(self, http: httpx.AsyncClient, endpoint: str):
        self.http = http
        self.endpoint = endpoint

    async def select(self, query: str) -> list[dict[str, Binding]]:
        try:
            response = await self.http.post(
                self.endpoint,
                data={"query": query, "infer": "false"},
                headers={"Accept": "application/sparql-results+json"},
            )
            response.raise_for_status()
        except httpx.TimeoutException as exc:
            raise GraphDBError(504, "graphdb_timeout", "GraphDB query timed out.") from exc
        except httpx.HTTPStatusError as exc:
            raise GraphDBError(
                502, "graphdb_http_error",
                f"GraphDB rejected the query (HTTP {exc.response.status_code}).",
            ) from exc
        except httpx.RequestError as exc:
            raise GraphDBError(
                503, "graphdb_unavailable", "Cannot connect to GraphDB. Check the server and GRAPHDB_ENDPOINT."
            ) from exc

        try:
            return SelectResult.model_validate(response.json()).results.bindings
        except ValueError as exc:
            raise invalid_response() from exc
