import { type ReactElement, type ReactNode } from "react";
import { cn } from "../lib/cn";

export type TooltipProps = {
  label: string;
  side?: "top" | "right" | "bottom" | "left";
  children: ReactNode;
};

const sideClass = {
  top: "bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2",
  right: "left-[calc(100%+8px)] top-1/2 -translate-y-1/2",
  bottom: "left-1/2 top-[calc(100%+6px)] -translate-x-1/2",
  left: "right-[calc(100%+8px)] top-1/2 -translate-y-1/2"
};

export function Tooltip({ label, side = "top", children }: TooltipProps): ReactElement {
  return (
    <span className="group relative inline-flex overflow-visible">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 hidden max-w-56 whitespace-normal rounded-xl bg-slate-950 px-2.5 py-1.5 text-left text-xs leading-snug text-white shadow-lg ring-1 ring-white/10 group-hover:block group-focus-within:block",
          sideClass[side]
        )}
      >
        {label}
      </span>
    </span>
  );
}
