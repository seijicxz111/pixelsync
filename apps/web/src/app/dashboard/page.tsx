import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CreateProjectDialog } from "@/features/projects/create-project-dialog";
import { ProjectCard } from "@/features/projects/project-card";
import { type DashboardProject } from "@/features/projects/types";

export const metadata = {
  title: "Dashboard"
};

export default async function DashboardPage(): Promise<JSX.Element> {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const projects = await prisma.project.findMany({
    where: { members: { some: { userId: session.user.id } } },
    orderBy: { updatedAt: "desc" },
    include: {
      canvases: {
        select: { id: true, name: true, width: true, height: true, updatedAt: true },
        orderBy: { updatedAt: "desc" }
      },
      members: {
        include: { user: { select: { id: true, name: true, image: true } } },
        take: 5
      },
      activities: {
        select: { id: true, action: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5
      }
    }
  });

  const items: DashboardProject[] = projects.map((project) => ({
    ...project,
    updatedAt: project.updatedAt.toISOString(),
    canvases: project.canvases.map((canvas) => ({ ...canvas, updatedAt: canvas.updatedAt.toISOString() })),
    activities: project.activities.map((activity) => ({ ...activity, createdAt: activity.createdAt.toISOString() }))
  }));

  return (
    <div className="min-h-screen bg-slate-50 dark bg-slate-950">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-cyan-600 dark:text-cyan-300">Workspace</p>
            <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Recent projects</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Continue a canvas, invite collaborators, or create a new sprite workspace.
            </p>
          </div>
          <CreateProjectDialog />
        </div>

        {items.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm shadow-slate-950/5 dark:border-white/10 dark:bg-white/[0.03] dark:shadow-black/20">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">No projects yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
              Create your first project to start drawing with a versioned collaborative canvas.
            </p>
            <div className="mt-5">
              <CreateProjectDialog />
            </div>
          </section>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
