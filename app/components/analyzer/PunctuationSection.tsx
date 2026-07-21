import { PUNCTUATION_PATTERN } from "./constants";
import { EmptyLine } from "./EmptyLine";
import { SectionHeader } from "./SectionHeader";

type PunctuationSectionProps = {
  text: string;
  count: number;
};

export const PunctuationSection = ({
  text,
  count,
}: PunctuationSectionProps) => {
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
