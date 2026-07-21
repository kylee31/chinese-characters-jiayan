import { EmptyLine } from "./EmptyLine";
import { SectionHeader } from "./SectionHeader";

type TokenSectionProps = {
  tokens: string[];
  onCopy: () => void;
};

export const TokenSection = ({ tokens, onCopy }: TokenSectionProps) => {
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
