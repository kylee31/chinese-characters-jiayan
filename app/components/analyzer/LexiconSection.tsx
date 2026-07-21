import { EmptyLine } from "./EmptyLine";
import { SectionHeader } from "./SectionHeader";
import type { LexiconResponse } from "./types";

type LexiconSectionProps = {
  result: LexiconResponse | null;
  onDownloadCsv: () => void;
};

export const LexiconSection = ({
  result,
  onDownloadCsv,
}: LexiconSectionProps) => {
  const entries = result?.entries ?? [];

  return (
    <section className="py-5 lg:py-9">
      <SectionHeader
        label="01 · 어휘 구축"
        detail={
          result ? `${entries.length} / ${result.total_entries} 후보` : "대기"
        }
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
        <EmptyLine>어휘 분석 결과가 아직 없습니다.</EmptyLine>
      )}
    </section>
  );
};
