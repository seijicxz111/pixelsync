"use client";

import { Keyboard } from "lucide-react";
import { useState } from "react";
import { Button, Dialog } from "@pixelsync/ui";

const shortcuts = [
  ["B", "Pencil"],
  ["E", "Eraser"],
  ["G", "Fill bucket"],
  ["I", "Eyedropper"],
  ["H", "Pan"],
  ["Ctrl/⌘ Z", "Undo"],
  ["Ctrl/⌘ Y", "Redo"],
  ["Wheel", "Zoom at pointer"],
  ["Alt drag", "Pan canvas"]
] as const;

export function ShortcutDialog(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Keyboard size={18} aria-hidden="true" />
        Shortcuts
      </Button>
      <Dialog open={open} title="Keyboard shortcuts" onClose={() => setOpen(false)}>
        <dl className="grid gap-2">
          {shortcuts.map(([key, label]) => (
            <div key={key} className="flex items-center justify-between rounded border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
              <dt className="font-mono text-cyan-200">{key}</dt>
              <dd className="text-slate-300">{label}</dd>
            </div>
          ))}
        </dl>
      </Dialog>
    </>
  );
}
