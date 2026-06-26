"use client";

import { Wifi, WifiOff } from "lucide-react";
import { Avatar, Badge } from "@pixelsync/ui";
import { type PresenceUser } from "@pixelsync/shared";

export function PresencePanel({
  status,
  users
}: {
  status: string;
  users: PresenceUser[];
}): JSX.Element {
  const connected = status === "CONNECTED";

  return (
    <section className="border-b border-white/10 bg-slate-950 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <Badge className={connected ? "bg-emerald-400/10 text-emerald-200" : "bg-amber-400/10 text-amber-200"}>
          {connected ? <Wifi size={14} aria-hidden="true" /> : <WifiOff size={14} aria-hidden="true" />}
          {status.toLowerCase()}
        </Badge>
        <div className="flex items-center gap-2">
          {users.map((user) => (
            <Avatar key={user.userId} name={user.displayName} imageUrl={user.avatarUrl} color={user.collaborationColor} className="size-8" />
          ))}
        </div>
      </div>
    </section>
  );
}
