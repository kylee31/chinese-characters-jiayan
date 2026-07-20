"use client";

import { FormEvent, useState } from "react";

type PosTag = {
  token: string;
  tag: string;
};

type AnalyzeResponse = {
  original_text: string;
  tokens: string[];
  lexicon_tokens: string[];
  pos_tags: PosTag[];
  sentences: string[];
  punctuated_text: string;
};

type LexiconEntry = {
  word: string;
  frequency: number;
  pmi: number;
  right_entropy: number;
  left_entropy: number;
};

type LexiconResponse = {
  original_text: string;
  total_entries: number;
  entries: LexiconEntry[];
};

const SAMPLE_TEXT = "昔者莊周夢爲胡蝶";

function formatApiError(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const record = data as Record<string, unknown>;
  const message =
    typeof record.error === "string"
      ? record.error
      : typeof record.detail === "string"
        ? record.detail
        : fallback;
  const backendUrl =
    typeof record.backend_url === "string" ? record.backend_url : "";
  const detail =
    typeof record.detail === "string" && record.detail !== message
      ? record.detail
      : "";

  return [message, backendUrl ? `Backend: ${backendUrl}` : "", detail]
    .filter(Boolean)
    .join(" / ");
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeAnalysisResponse(data: unknown): AnalyzeResponse {
  const value = data && typeof data === "object" ? data : {};
  const record = value as Record<string, unknown>;

  return {
    original_text:
      typeof record.original_text === "string" ? record.original_text : "",
    tokens: asStringArray(record.tokens),
    lexicon_tokens: asStringArray(record.lexicon_tokens),
    pos_tags: Array.isArray(record.pos_tags)
      ? record.pos_tags.flatMap((item) => {
          if (!item || typeof item !== "object") {
            return [];
          }

          const posTag = item as Record<string, unknown>;
          return typeof posTag.token === "string" &&
            typeof posTag.tag === "string"
            ? [{ token: posTag.token, tag: posTag.tag }]
            : [];
        })
      : [],
    sentences: asStringArray(record.sentences),
    punctuated_text:
      typeof record.punctuated_text === "string" ? record.punctuated_text : "",
  };
}

function joinOrFallback(values: string[]): string {
  return values.length > 0 ? values.join(" | ") : "No data returned";
}

export function AnalyzerClient() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResponse | null>(
    null,
  );
  const [lexiconResult, setLexiconResult] = useState<LexiconResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConstructingLexicon, setIsConstructingLexicon] = useState(false);

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setAnalysisResult(null);
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(formatApiError(data, "Analysis failed"));
        return;
      }

      setAnalysisResult(normalizeAnalysisResponse(data));
    } catch {
      setError("Next.js API route is not reachable");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleConstructLexicon() {
    setError(null);
    setLexiconResult(null);
    setIsConstructingLexicon(true);

    try {
      const response = await fetch("/api/lexicon/construct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, limit: 50 }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(formatApiError(data, "Lexicon construction failed"));
        return;
      }

      setLexiconResult(data);
    } catch {
      setError("Next.js lexicon API route is not reachable");
    } finally {
      setIsConstructingLexicon(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 bg-white px-6 py-10 sm:px-10">
      <section className="flex flex-col gap-3">
        <p className="text-sm font-medium text-zinc-500">Jiayan + FastAPI</p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
          Classical Chinese analyzer
        </h1>
        <p className="max-w-2xl text-base leading-7 text-zinc-600">
          Jiayan의 5가지 기능을 FastAPI로 호출합니다. 분석은 즉시 실행하고,
          어휘 구축은 별도 API로 분리해 말뭉치 기준 결과를 확인합니다.
        </p>
      </section>

      <form className="flex flex-col gap-4" onSubmit={handleAnalyze}>
        <label className="text-sm font-medium text-zinc-700" htmlFor="text">
          Text
        </label>
        <textarea
          id="text"
          className="min-h-40 w-full resize-y rounded-md border border-zinc-300 bg-white p-4 text-lg leading-8 text-zinc-950 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200"
          value={text}
          maxLength={5000}
          onChange={(event) => setText(event.target.value)}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-zinc-500">{text.length} / 5000</span>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="rounded-md border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-400"
              type="button"
              disabled={isConstructingLexicon || !text.trim()}
              onClick={handleConstructLexicon}
            >
              {isConstructingLexicon ? "Building..." : "Build lexicon"}
            </button>
            <button
              className="rounded-md bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
              type="submit"
              disabled={isAnalyzing || !text.trim()}
            >
              {isAnalyzing ? "Analyzing..." : "Analyze"}
            </button>
          </div>
        </div>
      </form>

      {error ? (
        <section className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </section>
      ) : null}

      {analysisResult ? (
        <section className="grid gap-4 md:grid-cols-2">
          <ResultBlock
            eyebrow="5. 자동 구두점"
            title="Punctuated text"
            value={analysisResult.punctuated_text}
          />
          <ResultBlock
            eyebrow="4. 문장 분할"
            title="Sentences"
            value={
              analysisResult.sentences.length > 0
                ? analysisResult.sentences.join(" / ")
                : "No data returned"
            }
          />
          <ResultBlock
            eyebrow="2. 토큰화"
            title="HMM tokens"
            value={joinOrFallback(analysisResult.tokens)}
          />
          <ResultBlock
            eyebrow="2. 토큰화"
            title="Lexicon tokens"
            value={joinOrFallback(analysisResult.lexicon_tokens)}
          />
          <div className="rounded-md border border-zinc-200 bg-white p-5">
            <p className="mb-1 text-xs font-medium text-zinc-500">
              3. 품사 태깅
            </p>
            <h2 className="mb-3 text-sm font-semibold text-zinc-950">
              POS tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {analysisResult.pos_tags.map((item, index) => (
                <span
                  className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
                  key={`${item.token}-${item.tag}-${index}`}
                >
                  {item.token}
                  <span className="ml-2 text-zinc-400">{item.tag}</span>
                </span>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {lexiconResult ? (
        <section className="rounded-md border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex flex-col gap-1">
            <p className="text-xs font-medium text-zinc-500">1. 어휘 구축</p>
            <h2 className="text-sm font-semibold text-zinc-950">
              Lexicon construction
            </h2>
            <p className="text-sm text-zinc-600">
              총 {lexiconResult.total_entries}개 후보 중 상위{" "}
              {lexiconResult.entries.length}개를 표시합니다. 짧은 문장보다 반복
              패턴이 있는 긴 말뭉치에서 결과가 잘 나옵니다.
            </p>
          </div>

          {lexiconResult.entries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500">
                    <th className="py-2 pr-4 font-medium">Word</th>
                    <th className="py-2 pr-4 font-medium">Frequency</th>
                    <th className="py-2 pr-4 font-medium">PMI</th>
                    <th className="py-2 pr-4 font-medium">R Entropy</th>
                    <th className="py-2 pr-4 font-medium">L Entropy</th>
                  </tr>
                </thead>
                <tbody>
                  {lexiconResult.entries.map((entry) => (
                    <tr className="border-b border-zinc-100" key={entry.word}>
                      <td className="py-2 pr-4 text-zinc-950">{entry.word}</td>
                      <td className="py-2 pr-4 text-zinc-700">
                        {entry.frequency}
                      </td>
                      <td className="py-2 pr-4 text-zinc-700">
                        {entry.pmi.toFixed(2)}
                      </td>
                      <td className="py-2 pr-4 text-zinc-700">
                        {entry.right_entropy.toFixed(2)}
                      </td>
                      <td className="py-2 pr-4 text-zinc-700">
                        {entry.left_entropy.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-zinc-600">
              어휘 후보가 없습니다. 입력 텍스트가 너무 짧거나 반복/공기 패턴이
              부족할 수 있습니다.
            </p>
          )}
        </section>
      ) : null}
    </main>
  );
}

function ResultBlock({
  eyebrow,
  title,
  value,
}: {
  eyebrow: string;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-5">
      <p className="mb-1 text-xs font-medium text-zinc-500">{eyebrow}</p>
      <h2 className="mb-3 text-sm font-semibold text-zinc-950">{title}</h2>
      <p className="text-base leading-8 text-zinc-700">{value}</p>
    </div>
  );
}
