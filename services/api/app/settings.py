from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    jiayan_model_dir: Path = Field(default=Path("/models/jiayan"))
    cors_origins: list[str] = Field(default=["http://localhost:3000"])

    model_config = SettingsConfigDict(env_file=".env", env_prefix="", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
