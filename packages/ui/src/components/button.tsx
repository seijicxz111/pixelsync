import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "icon";
};

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "border border-cyan-200/40 bg-gradient-to-b from-cyan-300 to-cyan-400 text-slate-950 shadow-[0_10px_28px_rgba(34,211,238,0.18),inset_0_1px_0_rgba(255,255,255,0.45)] hover:from-cyan-200 hover:to-cyan-300",
  secondary:
    "border border-slate-200 bg-slate-950/[0.04] text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] hover:border-slate-300 hover:bg-slate-950/[0.07] hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.08] dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] dark:hover:border-white/[0.18] dark:hover:bg-white/[0.13]",
  ghost:
    "text-slate-600 hover:bg-slate-950/[0.06] hover:text-slate-950 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white",
  danger:
    "border border-red-300/20 bg-gradient-to-b from-red-500 to-red-600 text-white shadow-[0_10px_26px_rgba(239,68,68,0.18)] hover:from-red-400 hover:to-red-500"
};

const sizeClass = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  icon: "h-9 w-9 p-0"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "secondary", size = "md", type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:pointer-events-none disabled:opacity-50",
        "rounded-xl transition-all duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:translate-y-0 disabled:shadow-none",
        variantClass[variant],
        sizeClass[size],
        className
      )}
      {...props}
    />
  );
});
