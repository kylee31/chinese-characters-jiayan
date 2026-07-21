"use client";

import { FormEvent, useMemo, useState } from "react";

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

const SAMPLE_TEXT =
  "是故内圣外王之道，暗而不明，郁而不发，天下之人各为其所欲焉以自为方。";
const PUNCTUATION_PATTERN = /[，。？！、；：]/u;

const formatApiError = (data: unknown, fallback: string): string => {
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
};

const asStringArray = (value: unknown): string[] => {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
};

const normalizeAnalysisResponse = (data: unknown): AnalyzeResponse => {
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
};

const countPunctuation = (value: string): number => {
  return Array.from(value).filter((char) => PUNCTUATION_PATTERN.test(char))
    .length;
};

const createCsv = (entries: LexiconEntry[]): string => {
  const header = ["word", "frequency", "pmi", "left_entropy", "right_entropy"];
  const rows = entries.map((entry) => [
    entry.word,
    entry.frequency,
    entry.pmi.toFixed(2),
    entry.left_entropy.toFixed(2),
    entry.right_entropy.toFixed(2),
  ]);

  return [header, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");
};

export const AnalyzerClient = () => {
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

  const displayText = useMemo(() => text.trim() || "분석할 원문을 입력하세요", [text]);
  const isBusy = isAnalyzing || isConstructingLexicon;

  const requestAnalysis = async () => {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(formatApiError(data, "Analysis failed"));
    }

    return normalizeAnalysisResponse(data);
  };

  const requestLexicon = async () => {
    const response = await fetch("/api/lexicon/construct", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, limit: 50 }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(formatApiError(data, "Lexicon construction failed"));
    }

    return data as LexiconResponse;
  };

  const handleAnalyze = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setAnalysisResult(null);
    setLexiconResult(null);
    setIsAnalyzing(true);
    setIsConstructingLexicon(true);

    const [analysis, lexicon] = await Promise.allSettled([
      requestAnalysis(),
      requestLexicon(),
    ]);

    if (analysis.status === "fulfilled") {
      setAnalysisResult(analysis.value);
    }

    if (lexicon.status === "fulfilled") {
      setLexiconResult(lexicon.value);
    }

    const errors = [analysis, lexicon].flatMap((result) => {
      if (result.status === "fulfilled") {
        return [];
      }

      return result.reason instanceof Error
        ? [result.reason.message]
        : ["Analysis request failed"];
    });

    setError(errors.length > 0 ? errors.join(" / ") : null);
    setIsAnalyzing(false);
    setIsConstructingLexicon(false);
  };

  const handleConstructLexicon = async () => {
    setError(null);
    setLexiconResult(null);
    setIsConstructingLexicon(true);

    try {
      setLexiconResult(await requestLexicon());
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Next.js lexicon API route is not reachable",
      );
    } finally {
      setIsConstructingLexicon(false);
    }
  };

  const handleCopyTokens = async () => {
    const tokens = analysisResult?.tokens ?? [];

    if (tokens.length > 0) {
      await navigator.clipboard.writeText(tokens.join(" "));
    }
  };

  const handleDownloadCsv = () => {
    if (!lexiconResult || lexiconResult.entries.length === 0) {
      return;
    }

    const blob = new Blob([createCsv(lexiconResult.entries)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "jiayan-lexicon.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-[#e9e9ec] p-0 text-zinc-900 font-sans">
      <div className="mx-auto flex h-screen w-full max-w-[1920px] flex-col overflow-hidden bg-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)]">
        <header className="flex h-16 flex-none items-center justify-between border-b border-[#ededed] px-5 sm:px-8 lg:h-28 lg:px-20">
          <div className="flex items-baseline gap-3 lg:gap-4">
            <span className="text-xl font-bold tracking-normal text-zinc-900 lg:text-[26px]">
              Jiayan
            </span>
            <span className="font-serif-sc text-base text-zinc-400 lg:text-[22px]">
              字言
            </span>
          </div>
        </header>

        <form
          className="flex min-h-0 flex-1 flex-col lg:flex-row"
          onSubmit={handleAnalyze}
        >
          <section className="flex min-h-0 flex-none flex-col border-b border-[#ededed] px-5 py-6 sm:px-8 lg:w-[40%] lg:border-b-0 lg:border-r lg:px-16 lg:py-[52px]">
            <div className="mb-3 flex items-baseline justify-between lg:mb-8">
              <label
                className="text-[11px] uppercase tracking-[0.18em] text-zinc-400 lg:text-[13px] lg:tracking-[0.23em]"
                htmlFor="text"
              >
                입력
              </label>
            </div>

            <textarea
              id="text"
              className="min-h-[120px] w-full flex-1 resize-none overflow-y-auto bg-transparent font-serif-sc text-lg leading-[1.9] text-zinc-900 outline-none placeholder:text-zinc-300 lg:min-h-0 lg:text-3xl lg:leading-[2.2]"
              value={text}
              maxLength={5000}
              placeholder="昔者莊周夢爲胡蝶"
              onChange={(event) => setText(event.target.value)}
            />

            <div className="mt-4 flex flex-col gap-4 border-t border-[#ededed] pt-4 sm:flex-row sm:items-center sm:justify-between lg:mt-9 lg:pt-7">
              <span className="text-xs text-zinc-400 lg:text-sm">
                {text.length}자 · 최대 5000자
              </span>
              <div className="flex items-center gap-5">
                <button
                  className="border-b-2 border-transparent pb-0.5 text-sm font-semibold text-zinc-500 transition hover:border-emerald-500 hover:text-zinc-900 disabled:cursor-not-allowed disabled:text-zinc-300 lg:text-[17px]"
                  type="button"
                  disabled={isBusy || !text.trim()}
                  onClick={handleConstructLexicon}
                >
                  {isConstructingLexicon ? "분석 중..." : "어휘 분석"}
                </button>
                <button
                  className="border-b-2 border-emerald-500 pb-0.5 text-sm font-semibold text-zinc-900 transition hover:text-emerald-700 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-300 lg:text-[17px]"
                  type="submit"
                  disabled={isBusy || !text.trim()}
                >
                  {isBusy ? "분석 중..." : "전체 분석 →"}
                </button>
              </div>
            </div>
          </section>

          <section className="flex min-h-0 flex-1 flex-col bg-[#fafafa]">
            <div className="flex flex-none items-center justify-between border-b border-[#ededed] bg-white px-5 py-4 sm:px-8 lg:px-16 lg:py-7">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-900 lg:text-[13px] lg:tracking-[0.23em]">
                전체 분석
              </span>
              <span className="hidden text-sm text-zinc-400 sm:block">
                {displayText.length}자 원문
              </span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 sm:px-8 lg:px-16">
              {error ? (
                <section className="my-5 border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700 lg:my-7">
                  {error}
                </section>
              ) : null}

              <LexiconSection
                result={lexiconResult}
                onDownloadCsv={handleDownloadCsv}
              />
              <TokenSection
                tokens={analysisResult?.tokens ?? []}
                onCopy={handleCopyTokens}
              />
              <PosSection items={analysisResult?.pos_tags ?? []} />
              <SentenceSection sentences={analysisResult?.sentences ?? []} />
              <PunctuationSection
                text={analysisResult?.punctuated_text ?? ""}
                count={countPunctuation(analysisResult?.punctuated_text ?? "")}
              />
            </div>
          </section>
        </form>
      </div>
    </main>
  );
};

const SectionHeader = ({
  label,
  detail,
  action,
}: {
  label: string;
  detail?: string;
  action?: React.ReactNode;
}) => {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4 lg:mb-5">
      <span className="text-xs font-semibold uppercase tracking-[0.09em] text-teal-700 lg:text-sm lg:tracking-[0.15em]">
        {label}
        {detail ? (
          <span className="ml-2 font-normal text-zinc-400">{detail}</span>
        ) : null}
      </span>
      {action}
    </div>
  );
};

const EmptyLine = ({ children }: { children: React.ReactNode }) => {
  return (
    <p className="font-serif-sc text-lg leading-8 text-zinc-300 lg:text-[22px] lg:leading-9">
      {children}
    </p>
  );
};

const TokenSection = ({
  tokens,
  onCopy,
}: {
  tokens: string[];
  onCopy: () => void;
}) => {
  return (
    <section className="border-b border-[#ededed] py-5 lg:py-9">
      <SectionHeader
        label="02 · 토큰화"
        detail={tokens.length > 0 ? `${tokens.length} tokens` : "대기"}
        action={
          <button
            className="text-xs text-zinc-400 transition hover:text-zinc-900 lg:text-[13px]"
            type="button"
            disabled={tokens.length === 0}
            onClick={onCopy}
          >
            복사
          </button>
        }
      />
      {tokens.length > 0 ? (
        <div className="flex flex-wrap">
          {tokens.map((token, index) => (
            <span
              className="border border-r-0 border-[#ededed] bg-white px-3 py-2 font-serif-sc text-xl leading-none last:border-r lg:px-[18px] lg:py-3 lg:text-[28px]"
              key={`${token}-${index}`}
            >
              {token}
            </span>
          ))}
        </div>
      ) : (
        <EmptyLine>토큰 결과가 아직 없습니다.</EmptyLine>
      )}
    </section>
  );
};

const PosSection = ({ items }: { items: PosTag[] }) => {
  return (
    <section className="border-b border-[#ededed] py-5 lg:py-9">
      <SectionHeader
        label="03 · 품사 태깅"
        detail={items.length > 0 ? "名 動 副 助 ..." : "대기"}
      />
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-x-2.5 gap-y-3 lg:gap-x-3.5 lg:gap-y-4">
          {items.map((item, index) => (
            <span
              className="inline-flex flex-col items-center gap-1.5 lg:gap-2"
              key={`${item.token}-${item.tag}-${index}`}
            >
              <span className="font-serif-sc text-[22px] leading-none lg:text-[26px]">
                {item.token}
              </span>
              <span className="border border-[#ededed] px-2.5 py-1 text-xs tracking-[0.08em] text-zinc-500 lg:text-base">
                {item.tag}
              </span>
            </span>
          ))}
        </div>
      ) : (
        <EmptyLine>품사 태그 결과가 아직 없습니다.</EmptyLine>
      )}
    </section>
  );
};

const SentenceSection = ({ sentences }: { sentences: string[] }) => {
  return (
    <section className="border-b border-[#ededed] py-5 lg:py-9">
      <SectionHeader
        label="04 · 문장 분할"
        detail={sentences.length > 0 ? `${sentences.length} 문장` : "대기"}
      />
      {sentences.length > 0 ? (
        <div className="flex flex-col gap-2.5 lg:gap-3">
          {sentences.map((sentence, index) => (
            <div
              className="flex items-baseline gap-3 lg:gap-4"
              key={`${sentence}-${index}`}
            >
              <span className="font-mono text-[11px] text-zinc-300 lg:text-xs">
                {index + 1}
              </span>
              <span className="font-serif-sc text-lg leading-[1.6] text-zinc-900 lg:text-[22px] lg:leading-[1.7]">
                {sentence}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyLine>문장 분할 결과가 아직 없습니다.</EmptyLine>
      )}
    </section>
  );
};

const PunctuationSection = ({
  text,
  count,
}: {
  text: string;
  count: number;
}) => {
  return (
    <section className="border-b border-[#ededed] py-5 lg:py-9">
      <SectionHeader
        label="05 · 자동 구두점"
        detail={text ? `부호 ${count}개` : "대기"}
      />
      {text ? (
        <p className="font-serif-sc text-[19px] leading-[1.9] text-zinc-900 lg:text-2xl lg:leading-[2]">
          {Array.from(text).map((char, index) => (
            <span
              className={PUNCTUATION_PATTERN.test(char) ? "text-teal-700" : ""}
              key={`${char}-${index}`}
            >
              {char}
            </span>
          ))}
        </p>
      ) : (
        <EmptyLine>자동 구두점 결과가 아직 없습니다.</EmptyLine>
      )}
    </section>
  );
};

const LexiconSection = ({
  result,
  onDownloadCsv,
}: {
  result: LexiconResponse | null;
  onDownloadCsv: () => void;
}) => {
  const entries = result?.entries ?? [];

  return (
    <section className="py-5 lg:py-9">
      <SectionHeader
        label="01 · 어휘 구축"
        detail={result ? `${entries.length} / ${result.total_entries} 후보` : "대기"}
        action={
          <button
            className="bg-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-emerald-600 disabled:bg-zinc-200 lg:px-4 lg:py-2 lg:text-[13px]"
            type="button"
            disabled={entries.length === 0}
            onClick={onDownloadCsv}
          >
            CSV
          </button>
        }
      />

      {entries.length > 0 ? (
        <div className="overflow-x-auto border border-[#ededed] bg-white">
          <table className="w-full min-w-[620px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#ededed] bg-[#fafafa] text-[10px] uppercase tracking-[0.08em] text-zinc-400 lg:text-[11px]">
                <th className="w-[28%] px-2.5 py-2 font-medium lg:px-[18px] lg:py-3">
                  단어
                </th>
                <th className="border-l border-[#ededed] px-2 py-2 font-medium lg:px-3.5 lg:py-3">
                  빈도
                </th>
                <th className="border-l border-[#ededed] px-2 py-2 font-medium lg:px-3.5 lg:py-3">
                  PMI
                </th>
                <th className="border-l border-[#ededed] px-2 py-2 font-medium lg:px-3.5 lg:py-3">
                  L_Ent
                </th>
                <th className="border-l border-[#ededed] px-2 py-2 font-medium lg:px-3.5 lg:py-3">
                  R_Ent
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  className="border-b border-[#f4f4f5] text-xs last:border-b-0 lg:text-[15px]"
                  key={entry.word}
                >
                  <td className="px-2.5 py-2 font-serif-sc text-[17px] text-zinc-900 lg:px-[18px] lg:py-3 lg:text-[22px]">
                    {entry.word}
                  </td>
                  <td className="border-l border-[#f4f4f5] px-2 py-2 text-zinc-700 lg:px-3.5 lg:py-3">
                    {entry.frequency}
                  </td>
                  <td className="border-l border-[#f4f4f5] px-2 py-2 text-teal-700 lg:px-3.5 lg:py-3">
                    {entry.pmi.toFixed(2)}
                  </td>
                  <td className="border-l border-[#f4f4f5] px-2 py-2 text-zinc-700 lg:px-3.5 lg:py-3">
                    {entry.left_entropy.toFixed(2)}
                  </td>
                  <td className="border-l border-[#f4f4f5] px-2 py-2 text-zinc-700 lg:px-3.5 lg:py-3">
                    {entry.right_entropy.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyLine>
          어휘 분석 결과가 아직 없습니다.
        </EmptyLine>
      )}
    </section>
  );
};
