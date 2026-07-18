from pathlib import Path
from tempfile import NamedTemporaryFile
from threading import Lock

from jiayan import (
    CharHMMTokenizer,
    CRFPunctuator,
    CRFSentencizer,
    CRFPOSTagger,
    PMIEntropyLexiconConstructor,
    WordNgramTokenizer,
    load_lm,
)

from app.schemas.analyze import AnalyzeResponse, LexiconEntry, LexiconResponse, PosTag
from app.settings import Settings


class JiayanService:
    REQUIRED_FILES = ("jiayan.klm", "pos_model", "cut_model", "punc_model")

    def __init__(self, model_dir: Path) -> None:
        self.model_dir = model_dir
        self._lock = Lock()
        self._validate_model_files()
        self._load_models()

    @classmethod
    def from_settings(cls, settings: Settings) -> "JiayanService":
        return cls(settings.jiayan_model_dir)

    def _validate_model_files(self) -> None:
        missing = [
            name for name in self.REQUIRED_FILES if not (self.model_dir / name).is_file()
        ]
        if missing:
            joined = ", ".join(missing)
            raise FileNotFoundError(f"Missing Jiayan model file(s): {joined}")

    def _load_models(self) -> None:
        language_model = load_lm(str(self.model_dir / "jiayan.klm"))
        self.tokenizer = CharHMMTokenizer(language_model)
        self.lexicon_tokenizer = WordNgramTokenizer()
        self.pos_tagger = CRFPOSTagger()
        self.pos_tagger.load(str(self.model_dir / "pos_model"))
        self.sentencizer = CRFSentencizer(language_model)
        self.sentencizer.load(str(self.model_dir / "cut_model"))
        self.punctuator = CRFPunctuator(language_model, str(self.model_dir / "cut_model"))
        self.punctuator.load(str(self.model_dir / "punc_model"))

    def analyze(self, text: str) -> AnalyzeResponse:
        stripped = text.strip()
        if not stripped:
            raise ValueError("Text must not be empty")

        with self._lock:
            tokens = list(self.tokenizer.tokenize(stripped))
            lexicon_tokens = list(self.lexicon_tokenizer.tokenize(stripped))
            raw_pos_tags = list(self.pos_tagger.postag(tokens))
            sentences = list(self.sentencizer.sentencize(stripped))
            punctuated_text = self.punctuator.punctuate(stripped)

        return AnalyzeResponse(
            original_text=stripped,
            tokens=tokens,
            lexicon_tokens=lexicon_tokens,
            pos_tags=[
                PosTag(token=token, tag=tag)
                for token, tag in zip(tokens, raw_pos_tags, strict=False)
            ],
            sentences=sentences,
            punctuated_text=punctuated_text,
        )

    def construct_lexicon(self, text: str, limit: int = 100) -> LexiconResponse:
        stripped = text.strip()
        if not stripped:
            raise ValueError("Text must not be empty")

        with NamedTemporaryFile("w", encoding="utf-8", suffix=".txt") as data_file:
            data_file.write(stripped)
            data_file.flush()

            constructor = PMIEntropyLexiconConstructor()
            raw_lexicon = constructor.construct_lexicon(data_file.name)

        sorted_words = sorted(
            raw_lexicon,
            key=lambda word: (
                len(word),
                -raw_lexicon[word][0],
                -raw_lexicon[word][1],
                -raw_lexicon[word][2],
                -raw_lexicon[word][3],
            ),
        )
        entries = [
            LexiconEntry(
                word=word,
                frequency=raw_lexicon[word][0],
                pmi=raw_lexicon[word][1],
                right_entropy=raw_lexicon[word][2],
                left_entropy=raw_lexicon[word][3],
            )
            for word in sorted_words[:limit]
        ]

        return LexiconResponse(
            original_text=stripped,
            total_entries=len(raw_lexicon),
            entries=entries,
        )
