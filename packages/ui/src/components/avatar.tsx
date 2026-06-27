import { type HTMLAttributes, type ReactElement } from "react";
import { cn } from "../lib/cn";

export type AvatarProps = HTMLAttributes<HTMLDivElement> & {
  name: string;
  imageUrl?: string | null;
  color?: string;
};

export function Avatar({ name, imageUrl, color = "#22d3ee", className, ...props }: AvatarProps): ReactElement {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className={cn(
        "grid size-9 place-items-center overflow-hidden rounded-full text-xs font-semibold text-slate-950 shadow-sm ring-1 ring-white/20",
        className
      )}
      style={{ backgroundColor: imageUrl === undefined || imageUrl === null ? color : undefined }}
      {...props}
    >
      {imageUrl === undefined || imageUrl === null ? (
        <span>{initials}</span>
      ) : (
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      )}
    </div>
  );
}
