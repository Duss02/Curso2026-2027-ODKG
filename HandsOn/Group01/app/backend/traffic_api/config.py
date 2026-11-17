from pathlib import Path

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[1] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    graphdb_endpoint: AnyHttpUrl = (
        "http://localhost:7200/repositories/group01-accidents"
    )
    graphdb_timeout_seconds: float = Field(default=15, gt=0, le=120)
