import {
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactElement,
  type TextareaHTMLAttributes
} from "react";
import { cn } from "../lib/cn";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>): ReactElement {
  return <label className={cn("text-sm font-medium text-slate-800 dark:text-slate-100", className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>): ReactElement {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>): ReactElement {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white",
        className
      )}
      {...props}
    />
  );
}
