from app.settings import Settings


VERCEL_ORIGIN = "https://chinese-characters-jiayan.vercel.app"


def test_settings_allows_vercel_origin_by_default() -> None:
    assert VERCEL_ORIGIN in Settings().cors_origins


def test_settings_normalizes_cors_origin_trailing_slash() -> None:
    settings = Settings(cors_origins=[f"{VERCEL_ORIGIN}/"])

    assert settings.cors_origins == [VERCEL_ORIGIN]
