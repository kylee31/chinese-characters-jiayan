import pytest
from pydantic import ValidationError

from app.schemas.analyze import AnalyzeRequest


def test_request_trims_text() -> None:
    request = AnalyzeRequest(text="  乾坤一氣  ")

    assert request.text == "乾坤一氣"


def test_request_rejects_blank_text() -> None:
    with pytest.raises(ValidationError):
        AnalyzeRequest(text="   ")


def test_request_rejects_too_long_text() -> None:
    with pytest.raises(ValidationError):
        AnalyzeRequest(text="字" * 5001)

