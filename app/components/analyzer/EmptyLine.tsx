import type { ReactNode } from "react";

type EmptyLineProps = {
  children: ReactNode;
};

export const EmptyLine = ({ children }: EmptyLineProps) => {
  return (
    <p className="font-serif-sc text-lg leading-8 text-zinc-300 lg:text-[22px] lg:leading-9">
      {children}
    </p>
  );
};
