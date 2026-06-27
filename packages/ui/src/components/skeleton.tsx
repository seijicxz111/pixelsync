import { type HTMLAttributes, type ReactElement } from "react";
import { cn } from "../lib/cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>): ReactElement {
  return <div className={cn("animate-pulse rounded-xl bg-slate-200 dark:bg-white/10", className)} {...props} />;
}
