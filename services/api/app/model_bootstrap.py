from __future__ import annotations

import os
import shutil
import tarfile
import tempfile
from pathlib import Path
from urllib.parse import quote
from urllib.parse import urlparse
from urllib.request import Request
from urllib.request import urlopen

REQUIRED_MODEL_FILES = ("jiayan.klm", "pos_model", "cut_model", "punc_model")


def missing_model_files(model_dir: Path) -> list[str]:
    return [name for name in REQUIRED_MODEL_FILES if not (model_dir / name).is_file()]


def _download_file(url: str, destination: Path) -> None:
    request: str | Request = url
    if url.startswith("gs://"):
        request = _authenticated_gcs_request(url)

    with urlopen(request) as response, destination.open("wb") as output:
        shutil.copyfileobj(response, output)


def _metadata_server_token() -> str:
    request = Request(
        "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
        headers={"Metadata-Flavor": "Google"},
    )
    with urlopen(request) as response:
        token_response = response.read().decode("utf-8")

    import json

    return str(json.loads(token_response)["access_token"])


def _authenticated_gcs_request(gs_url: str) -> Request:
    parsed = urlparse(gs_url)
    if parsed.scheme != "gs" or not parsed.netloc or not parsed.path:
        raise ValueError(f"Invalid GCS model archive URL: {gs_url}")

    object_name = parsed.path.lstrip("/")
    https_url = (
        "https://storage.googleapis.com/storage/v1/b/"
        f"{quote(parsed.netloc, safe='')}/o/{quote(object_name, safe='')}"
        "?alt=media"
    )
    return Request(https_url, headers={"Authorization": f"Bearer {_metadata_server_token()}"})


def _extract_tar_safely(archive: Path, destination: Path) -> None:
    destination_resolved = destination.resolve()
    with tarfile.open(archive) as tar:
        for member in tar.getmembers():
            target = (destination / member.name).resolve()
            if destination_resolved not in target.parents and target != destination_resolved:
                raise ValueError(f"Unsafe path in model archive: {member.name}")
        tar.extractall(destination)


def _find_model_root(extracted_dir: Path) -> Path:
    candidates = [extracted_dir, *[path for path in extracted_dir.rglob("*") if path.is_dir()]]
    for candidate in candidates:
        if not missing_model_files(candidate):
            return candidate
    raise FileNotFoundError(
        "Downloaded model archive does not contain required files: "
        + ", ".join(REQUIRED_MODEL_FILES)
    )


def ensure_model_files(model_dir: Path, archive_url: str | None) -> None:
    if not missing_model_files(model_dir):
        return

    if not archive_url:
        raise FileNotFoundError(
            f"Missing Jiayan model files in {model_dir}. Set JIAYAN_MODEL_ARCHIVE_URL "
            "to a tar.gz archive containing jiayan.klm, pos_model, cut_model, and punc_model."
        )

    model_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as temp_dir_name:
        temp_dir = Path(temp_dir_name)
        archive = temp_dir / "jiayan-model.tar.gz"
        extracted = temp_dir / "extracted"
        extracted.mkdir()

        _download_file(archive_url, archive)
        _extract_tar_safely(archive, extracted)
        model_root = _find_model_root(extracted)

        for name in REQUIRED_MODEL_FILES:
            shutil.copy2(model_root / name, model_dir / name)


def main() -> None:
    model_dir = Path(os.environ.get("JIAYAN_MODEL_DIR", "/models/jiayan"))
    archive_url = os.environ.get("JIAYAN_MODEL_ARCHIVE_URL")
    ensure_model_files(model_dir, archive_url)


if __name__ == "__main__":
    main()
