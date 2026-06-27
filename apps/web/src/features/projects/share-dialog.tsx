"use client";

import { Copy, Link2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button, Dialog, Input, Label } from "@pixelsync/ui";

export function ShareDialog({ projectId }: { projectId: string }): JSX.Element {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("VIEWER");
  const [url, setUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function createInvite(): void {
    startTransition(async () => {
      setError(null);
      const response = await fetch(`/api/projects/${projectId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, expiresInDays: 7 })
      });
      const result = (await response.json()) as { invite?: { url: string }; message?: string };

      if (!response.ok || result.invite === undefined) {
        setError(result.message ?? "Invite could not be created.");
        return;
      }

      setUrl(result.invite.url);
    });
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Link2 size={18} aria-hidden="true" />
        Share
      </Button>
      <Dialog open={open} title="Share project" description="Create an expiring invite link." onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-role" className="text-white">Invite role</Label>
            <select
              id="invite-role"
              value={role}
              onChange={(event) => setRole(event.target.value as "EDITOR" | "VIEWER")}
              className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            >
              <option value="VIEWER">Viewer</option>
              <option value="EDITOR">Editor</option>
            </select>
          </div>
          <Button variant="primary" onClick={createInvite} disabled={isPending}>
            {isPending ? "Creating..." : "Create invite"}
          </Button>
          {url ? (
            <div className="space-y-2">
              <Label htmlFor="invite-url" className="text-white">Invite URL</Label>
              <div className="flex gap-2">
                <Input id="invite-url" readOnly value={url} />
                <Button
                  aria-label="Copy invite URL"
                  size="icon"
                  className="shrink-0"
                  onClick={() => {
                    void navigator.clipboard.writeText(url);
                  }}
                >
                  <Copy size={18} aria-hidden="true" />
                </Button>
              </div>
            </div>
          ) : null}
          {error === null ? null : <p role="alert" className="text-sm text-red-300">{error}</p>}
        </div>
      </Dialog>
    </>
  );
}
