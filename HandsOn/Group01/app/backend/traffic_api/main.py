from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import Settings
from .graphdb import GraphDBClient, GraphDBError
from .routes import router


def create_app(
    settings: Settings | None = None,
    *,
    transport: httpx.AsyncBaseTransport | None = None,
) -> FastAPI:
    settings = settings or Settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(settings.graphdb_timeout_seconds, connect=3.0),
            transport=transport,
            trust_env=False,
        ) as http:
            app.state.graphdb = GraphDBClient(http, str(settings.graphdb_endpoint))
            yield

    app = FastAPI(title="Group01 Traffic Accident Explorer", version="0.4.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_credentials=False,
        allow_methods=["GET"],
        allow_headers=["Accept", "Content-Type"],
    )

    @app.exception_handler(GraphDBError)
    async def graphdb_error(request: Request, exc: GraphDBError):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": {"code": exc.code, "message": str(exc)}},
        )

    app.include_router(router)
    return app


app = create_app()
