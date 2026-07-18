from fastapi.testclient import TestClient

from app.main import create_app
from app.schemas.analyze import AnalyzeResponse, PosTag
from app.settings import Settings


class FakeJiayanService:
    def analyze(self, text: str) -> AnalyzeResponse:
        return AnalyzeResponse(
            original_text=text,
            tokens=["乾坤", "一氣"],
            lexicon_tokens=["乾坤", "一", "氣"],
            pos_tags=[
                PosTag(token="乾坤", tag="n"),
                PosTag(token="一氣", tag="n"),
            ],
            sentences=[text],
            punctuated_text=f"{text}。",
        )

    def construct_lexicon(self, text: str, limit: int) -> dict[str, object]:
        return {
            "original_text": text,
            "total_entries": 2,
            "entries": [
                {
                    "word": "乾坤",
                    "frequency": 12,
                    "pmi": 120.0,
                    "right_entropy": 2.5,
                    "left_entropy": 2.7,
                }
            ],
        }


def test_health_endpoint() -> None:
    app = create_app(
        settings=Settings(jiayan_model_dir="/tmp/not-used"),
        service_factory=lambda settings: FakeJiayanService(),
    )

    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_analyze_endpoint_uses_loaded_service() -> None:
    app = create_app(
        settings=Settings(jiayan_model_dir="/tmp/not-used"),
        service_factory=lambda settings: FakeJiayanService(),
    )

    with TestClient(app) as client:
        response = client.post("/api/v1/analyze", json={"text": "  乾坤一氣  "})

    assert response.status_code == 200
    assert response.json() == {
        "original_text": "乾坤一氣",
        "tokens": ["乾坤", "一氣"],
        "lexicon_tokens": ["乾坤", "一", "氣"],
        "pos_tags": [
            {"token": "乾坤", "tag": "n"},
            {"token": "一氣", "tag": "n"},
        ],
        "sentences": ["乾坤一氣"],
        "punctuated_text": "乾坤一氣。",
    }


def test_analyze_endpoint_rejects_empty_text() -> None:
    app = create_app(
        settings=Settings(jiayan_model_dir="/tmp/not-used"),
        service_factory=lambda settings: FakeJiayanService(),
    )

    with TestClient(app) as client:
        response = client.post("/api/v1/analyze", json={"text": "   "})

    assert response.status_code == 422


def test_construct_lexicon_endpoint_uses_loaded_service() -> None:
    app = create_app(
        settings=Settings(jiayan_model_dir="/tmp/not-used"),
        service_factory=lambda settings: FakeJiayanService(),
    )

    with TestClient(app) as client:
        response = client.post(
            "/api/v1/lexicon/construct",
            json={"text": "  乾坤乾坤  ", "limit": 1},
        )

    assert response.status_code == 200
    assert response.json() == {
        "original_text": "乾坤乾坤",
        "total_entries": 2,
        "entries": [
            {
                "word": "乾坤",
                "frequency": 12,
                "pmi": 120.0,
                "right_entropy": 2.5,
                "left_entropy": 2.7,
            }
        ],
    }
