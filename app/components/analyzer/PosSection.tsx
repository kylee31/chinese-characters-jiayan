import { EmptyLine } from "./EmptyLine";
import { SectionHeader } from "./SectionHeader";
import type { PosTag } from "./types";

type PosSectionProps = {
  items: PosTag[];
};

export const PosSection = ({ items }: PosSectionProps) => {
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
