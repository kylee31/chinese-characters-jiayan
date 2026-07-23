from pathlib import Path
import tarfile

import pytest

from app.model_bootstrap import REQUIRED_MODEL_FILES, ensure_model_files
from app.model_bootstrap import _authenticated_gcs_request


def _write_model_archive(archive_path: Path, source_dir: Path) -> None:
    nested = source_dir / "jiayan"
    nested.mkdir()
    for name in REQUIRED_MODEL_FILES:
        (nested / name).write_text(name, encoding="utf-8")

    with tarfile.open(archive_path, "w:gz") as archive:
        archive.add(nested, arcname="jiayan")


def test_ensure_model_files_downloads_archive_when_models_are_missing(
    tmp_path: Path,
) -> None:
    archive_path = tmp_path / "jiayan-model.tar.gz"
    source_dir = tmp_path / "source"
    source_dir.mkdir()
    _write_model_archive(archive_path, source_dir)

    model_dir = tmp_path / "models" / "jiayan"

    ensure_model_files(model_dir, archive_path.as_uri())

    assert sorted(path.name for path in model_dir.iterdir()) == sorted(
        REQUIRED_MODEL_FILES
    )


def test_ensure_model_files_requires_archive_url_when_models_are_missing(
    tmp_path: Path,
) -> None:
    with pytest.raises(FileNotFoundError, match="JIAYAN_MODEL_ARCHIVE_URL"):
        ensure_model_files(tmp_path / "models" / "jiayan", None)


def test_authenticated_gcs_request_uses_private_object_download_url(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("app.model_bootstrap._metadata_server_token", lambda: "token")

    request = _authenticated_gcs_request("gs://bucket-name/path/to/model.tar.gz")

    assert request.full_url == (
        "https://storage.googleapis.com/storage/v1/b/"
        "bucket-name/o/path%2Fto%2Fmodel.tar.gz?alt=media"
    )
    assert request.headers["Authorization"] == "Bearer token"
