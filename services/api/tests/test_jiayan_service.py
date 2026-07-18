from pathlib import Path

import pytest

from app.services.jiayan_service import JiayanService


def test_service_reports_missing_model_files(tmp_path: Path) -> None:
    with pytest.raises(FileNotFoundError, match="jiayan.klm"):
        JiayanService(tmp_path)


def test_service_analyzes_real_jiayan_models() -> None:
    model_dir = Path("/models/jiayan")
    if not model_dir.exists():
        pytest.skip("Real Jiayan model data is only available inside the container")

    service = JiayanService(model_dir)

    result = service.analyze("昔者莊周夢爲胡蝶")

    assert result.original_text == "昔者莊周夢爲胡蝶"
    assert result.tokens
    assert result.lexicon_tokens
    assert len(result.pos_tags) == len(result.tokens)
    assert result.sentences
    assert result.punctuated_text


def test_service_constructs_lexicon_from_text() -> None:
    service = object.__new__(JiayanService)

    result = service.construct_lexicon("天地玄黃宇宙洪荒天地玄黃宇宙洪荒" * 12, limit=5)

    assert result.original_text.startswith("天地玄黃")
    assert result.total_entries >= len(result.entries)
    assert len(result.entries) <= 5
    assert all(entry.word for entry in result.entries)
