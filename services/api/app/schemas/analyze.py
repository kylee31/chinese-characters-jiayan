from typing import Annotated

from pydantic import BaseModel, Field, field_validator


class AnalyzeRequest(BaseModel):
    text: Annotated[str, Field(min_length=1, max_length=5000)]

    @field_validator("text", mode="before")
    @classmethod
    def strip_text(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class PosTag(BaseModel):
    token: str
    tag: str


class LexiconEntry(BaseModel):
    word: str
    frequency: int
    pmi: float
    right_entropy: float
    left_entropy: float


class AnalyzeResponse(BaseModel):
    original_text: str
    tokens: list[str]
    lexicon_tokens: list[str]
    pos_tags: list[PosTag]
    sentences: list[str]
    punctuated_text: str


class LexiconRequest(BaseModel):
    text: Annotated[str, Field(min_length=1, max_length=50000)]
    limit: Annotated[int, Field(ge=1, le=1000)] = 100

    @field_validator("text", mode="before")
    @classmethod
    def strip_text(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class LexiconResponse(BaseModel):
    original_text: str
    total_entries: int
    entries: list[LexiconEntry]
