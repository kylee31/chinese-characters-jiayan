FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        cmake \
        git \
        libboost-all-dev \
        libbz2-dev \
        libeigen3-dev \
        liblzma-dev \
        zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY services/api/requirements.txt /tmp/requirements.txt
RUN pip install --upgrade pip setuptools wheel \
    && pip install -r /tmp/requirements.txt

RUN pip install git+https://github.com/jiaeyan/Jiayan.git@28c9638a071f1f0ab69d0ee971081147aa682a5b \
    && python -c "from jiayan import WordNgramTokenizer; WordNgramTokenizer()"

FROM base AS test
COPY services/api /app
COPY model_data/jiayan /models/jiayan
ENV JIAYAN_MODEL_DIR=/models/jiayan
CMD ["pytest", "-q"]

FROM base AS runtime
RUN useradd --create-home --uid 10001 appuser

COPY services/api/app /app/app
COPY model_data/jiayan /models/jiayan
RUN chown -R appuser:appuser /app /models

USER appuser
ENV JIAYAN_MODEL_DIR=/models/jiayan \
    PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --workers 1"]
