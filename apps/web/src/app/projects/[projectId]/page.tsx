import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Clock, ImageIcon, Plus } from "lucide-react";
import { canViewProject } from "@pixelsync/shared";
import { AppHeader } from "@/components/app-header";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getProjectAccess } from "@/lib/authorization";
import { ShareDialog } from "@/features/projects/share-dialog";
import { Button, Card, CardContent } from "@pixelsync/ui";

export default async function ProjectPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}): Promise<JSX.Element> {
  const session = await auth();
  const { projectId } = await params;
  const access = await getProjectAccess(projectId, session?.user?.id ?? null);

  if (access === null) {
    notFound();
  }

  if (!canViewProject(access.role, access.visibility)) {
    redirect("/sign-in");
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      canvases: { orderBy: { updatedAt: "desc" } },
      members: { include: { user: { select: { id: true, name: true, image: true } } } },
      activities: { orderBy: { createdAt: "desc" }, take: 12 }
    }
  });

  if (project === null) {
    notFound();
  }

  return (
    <div className="min-h-screen dark bg-slate-950 text-white">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm text-cyan-300">{project.visibility.toLowerCase()} project</p>
            <h1 className="text-3xl font-semibold">{project.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{project.description ?? "No description yet."}</p>
          </div>
          <div className="flex gap-2">
            {access.role === "OWNER" ? <ShareDialog projectId={project.id} /> : null}
            {access.role === "OWNER" || access.role === "EDITOR" ? (
              <Link href={`/projects/${project.id}/new-canvas`}>
                <Button variant="primary"><Plus size={18} aria-hidden="true" /> Canvas</Button>
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-400">Canvases</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {project.canvases.map((canvas) => (
                <Link key={canvas.id} href={`/projects/${project.id}/canvases/${canvas.id}`}>
                  <Card className="border-white/10 bg-white/[0.03] text-white transition hover:bg-white/[0.06]">
                    <CardContent>
                      <div className="mb-4 grid aspect-video place-items-center rounded-2xl bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)] bg-[length:18px_18px] shadow-inner shadow-black/30">
                        <ImageIcon className="text-cyan-200" aria-hidden="true" />
                      </div>
                      <h3 className="font-semibold">{canvas.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">{canvas.width} x {canvas.height}, sequence {canvas.currentSequence}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <Card className="border-white/10 bg-white/[0.03] text-white">
              <CardContent>
                <h2 className="mb-3 font-semibold">Members</h2>
                <div className="space-y-3">
                  {project.members.map((member) => (
                    <div key={member.userId} className="flex items-center justify-between text-sm">
                      <span>{member.user.name ?? "Unnamed user"}</span>
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-300 ring-1 ring-white/10">{member.role.toLowerCase()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/[0.03] text-white">
              <CardContent>
                <h2 className="mb-3 font-semibold">Activity</h2>
                <div className="space-y-3">
                  {project.activities.map((activity) => (
                    <div key={activity.id} className="text-sm text-slate-300">
                      <div className="flex items-center gap-2">
                        <Clock size={14} aria-hidden="true" />
                        <span>{activity.action.replaceAll("_", " ").toLowerCase()}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{activity.createdAt.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
