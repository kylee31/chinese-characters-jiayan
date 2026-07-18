from fastapi import APIRouter, HTTPException, Request

from app.schemas.analyze import (
    AnalyzeRequest,
    AnalyzeResponse,
    LexiconRequest,
    LexiconResponse,
)

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/api/v1/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest, request: Request) -> AnalyzeResponse:
    service = getattr(request.app.state, "jiayan_service", None)
    if service is None:
        raise HTTPException(status_code=503, detail="Jiayan service is not ready")

    try:
        return service.analyze(payload.text)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Jiayan analysis failed") from exc


@router.post("/api/v1/lexicon/construct", response_model=LexiconResponse)
def construct_lexicon(payload: LexiconRequest, request: Request) -> LexiconResponse:
    service = getattr(request.app.state, "jiayan_service", None)
    if service is None:
        raise HTTPException(status_code=503, detail="Jiayan service is not ready")

    try:
        return service.construct_lexicon(payload.text, payload.limit)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Jiayan lexicon construction failed") from exc
