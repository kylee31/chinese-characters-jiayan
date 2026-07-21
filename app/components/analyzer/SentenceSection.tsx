import { EmptyLine } from "./EmptyLine";
import { SectionHeader } from "./SectionHeader";

type SentenceSectionProps = {
  sentences: string[];
};

export const SentenceSection = ({ sentences }: SentenceSectionProps) => {
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
