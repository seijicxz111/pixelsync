import { type ReactElement, type ReactNode } from "react";

export type TooltipProps = {
  label: string;
  children: ReactNode;
};

export function Tooltip({ label, children }: TooltipProps): ReactElement {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-30 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-950 px-2 py-1 text-xs text-white shadow-lg ring-1 ring-white/10 group-hover:block group-focus-within:block"
      >
        {label}
      </span>
    </span>
  );
}
