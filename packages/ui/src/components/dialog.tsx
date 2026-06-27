"use client";

import { X } from "lucide-react";
import { useEffect, useId, type ReactElement, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "./button";
import { cn } from "../lib/cn";

export type DialogProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
};

export function Dialog({ open, title, description, children, onClose }: DialogProps): ReactElement | null {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      role="presentation"
      className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate-950/[0.72] p-4 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description === undefined ? undefined : descriptionId}
        className={cn(
          "animate-[panel-in_180ms_ease-out] flex max-h-[min(760px,calc(100vh-2rem))] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950/[0.96] text-white shadow-2xl shadow-black/50 backdrop-blur-xl"
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            {description === undefined ? null : (
              <p id={descriptionId} className="mt-1 text-sm text-slate-400">
                {description}
              </p>
            )}
          </div>
          <Button aria-label="Close dialog" className="shrink-0" size="icon" variant="ghost" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </Button>
        </header>
        <div className="min-h-0 overflow-y-auto px-5 py-5">
          {children}
        </div>
      </section>
    </div>,
    document.body
  );
}
