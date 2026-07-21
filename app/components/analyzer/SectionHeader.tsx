import type { ReactNode } from "react";

type SectionHeaderProps = {
  label: string;
  detail?: string;
  action?: ReactNode;
};

export const SectionHeader = ({
  label,
  detail,
  action,
}: SectionHeaderProps) => {
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
