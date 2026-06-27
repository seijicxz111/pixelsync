"use client";

import { History } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useTransition } from "react";
import { Button, Dialog, Input, Label } from "@pixelsync/ui";

type Version = {
  id: string;
  label: string;
  description: string | null;
  createdAt: string;
  snapshot: {
    sequenceNumber: number;
  };
  createdBy: {
    name: string | null;
  } | null;
};

export function VersionHistoryPanel({ canvasId }: { canvasId: string }): JSX.Element {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("Checkpoint");
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["versions", canvasId],
    queryFn: async () => {
      const response = await fetch(`/api/canvases/${canvasId}/versions`);
      const result = (await response.json()) as { versions: Version[] };
      return result.versions;
    },
    enabled: open
  });

  function createVersion(): void {
    startTransition(async () => {
      await fetch(`/api/canvases/${canvasId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label })
      });
      await queryClient.invalidateQueries({ queryKey: ["versions", canvasId] });
    });
  }

  function restoreVersion(versionId: string): void {
    startTransition(async () => {
      await fetch(`/api/canvases/${canvasId}/versions/${versionId}/restore`, { method: "POST" });
      window.location.reload();
    });
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <History size={18} aria-hidden="true" />
        Versions
      </Button>
      <Dialog open={open} title="Version history" description="Create or restore explicit canvas checkpoints." onClose={() => setOpen(false)}>
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="version-label" className="text-white">Version label</Label>
                <Input id="version-label" value={label} onChange={(event) => setLabel(event.target.value)} />
              </div>
              <Button className="self-end" variant="primary" onClick={createVersion} disabled={isPending}>Save</Button>
            </div>
          </div>
          <div className="space-y-2">
            {query.isLoading ? <p className="text-sm text-slate-400">Loading versions...</p> : null}
            {query.isError ? <p role="alert" className="text-sm text-red-300">Version history could not be loaded.</p> : null}
            {!query.isLoading && query.data?.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.025] px-3 py-4 text-sm text-slate-400">
                No saved versions yet. Create a checkpoint before a major edit.
              </p>
            ) : null}
            {query.data?.map((version) => (
              <article key={version.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 shadow-sm shadow-black/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium">{version.label}</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Sequence {version.snapshot.sequenceNumber} by {version.createdBy?.name ?? "Unknown"}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => restoreVersion(version.id)} disabled={isPending}>Restore</Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Dialog>
    </>
  );
}
