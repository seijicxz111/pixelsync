"use client";

import { X } from "lucide-react";
import { type ReactElement, type ReactNode } from "react";
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
  if (!open) {
    return null;
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description === undefined ? undefined : "dialog-description"}
        className={cn(
          "w-full max-w-lg rounded-lg border border-white/10 bg-slate-950 p-5 text-white shadow-2xl"
        )}
      >
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="dialog-title" className="text-lg font-semibold">
              {title}
            </h2>
            {description === undefined ? null : (
              <p id="dialog-description" className="mt-1 text-sm text-slate-400">
                {description}
              </p>
            )}
          </div>
          <Button aria-label="Close dialog" size="icon" variant="ghost" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </Button>
        </header>
        {children}
      </section>
    </div>
  );
}
