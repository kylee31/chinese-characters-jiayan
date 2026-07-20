from __future__ import annotations

from collections.abc import Callable
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.analyze import router
from app.services.jiayan_service import JiayanService
from app.settings import Settings, get_settings


def create_app(
    settings: Settings | None = None,
    service_factory: Callable[[Settings], JiayanService] | None = None,
) -> FastAPI:
    resolved_settings = settings or get_settings()
    resolved_factory = service_factory or JiayanService.from_settings

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.jiayan_service = resolved_factory(resolved_settings)
        yield

    app = FastAPI(title="Jiayan API", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=resolved_settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )
    app.include_router(router)
    return app


app = create_app()
