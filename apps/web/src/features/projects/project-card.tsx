import Link from "next/link";
import { CalendarDays, Eye, Link2, Lock, Users } from "lucide-react";
import { Avatar, Badge, Card, CardContent } from "@pixelsync/ui";
import { type DashboardProject } from "./types";

const visibilityIcon = {
  PRIVATE: Lock,
  LINK: Link2,
  PUBLIC: Eye
};

export function ProjectCard({ project }: { project: DashboardProject }): JSX.Element {
  const VisibilityIcon = visibilityIcon[project.visibility];

  return (
    <Link href={`/projects/${project.id}`} className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500">
      <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-lg">
        <CardContent>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-950 dark:text-white">{project.name}</h2>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                {project.description ?? "No description yet."}
              </p>
            </div>
            <Badge className="gap-1 bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200">
              <VisibilityIcon size={13} aria-hidden="true" />
              {project.visibility.toLowerCase()}
            </Badge>
          </div>

          <div className="mb-5 grid grid-cols-3 gap-2">
            {project.canvases.slice(0, 3).map((canvas) => (
              <div key={canvas.id} className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-500 shadow-sm shadow-slate-950/5 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
                <div className="font-medium text-slate-800 dark:text-slate-100">{canvas.name}</div>
                <div>{canvas.width} x {canvas.height}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Users size={14} aria-hidden="true" />
              <div className="flex -space-x-2">
                {project.members.map((member) => (
                  <Avatar
                    key={member.user.id}
                    name={member.user.name ?? "User"}
                    imageUrl={member.user.image}
                    className="size-7 border border-white"
                  />
                ))}
              </div>
            </div>
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={14} aria-hidden="true" />
              {new Date(project.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
