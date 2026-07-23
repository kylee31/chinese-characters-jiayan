from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    jiayan_model_dir: Path = Field(default=Path("/models/jiayan"))
    cors_origins: list[str] = Field(
        default=[
            "http://localhost:3000",
            "https://chinese-characters-jiayan.vercel.app",
        ]
    )

    model_config = SettingsConfigDict(env_file=".env", env_prefix="", extra="ignore")

    @field_validator("cors_origins")
    @classmethod
    def normalize_cors_origins(cls, origins: list[str]) -> list[str]:
        return [origin.rstrip("/") for origin in origins]


@lru_cache
def get_settings() -> Settings:
    return Settings()
