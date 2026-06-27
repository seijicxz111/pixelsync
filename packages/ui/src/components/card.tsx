import { type HTMLAttributes, type ReactElement } from "react";
import { cn } from "../lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>): ReactElement {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5 dark:border-white/10 dark:bg-slate-950/90 dark:shadow-black/20",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>): ReactElement {
  return <div className={cn("border-b border-slate-200 p-5 dark:border-white/10", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>): ReactElement {
  return <div className={cn("p-5", className)} {...props} />;
}
