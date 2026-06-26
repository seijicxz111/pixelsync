import "server-only";

import { type ProjectRole } from "@prisma/client";
import { canEditProject, canManageProject, canViewProject } from "@pixelsync/shared";
import { prisma } from "./prisma";

export type ProjectAccess = {
  projectId: string;
  role: ProjectRole | null;
  visibility: "PRIVATE" | "LINK" | "PUBLIC";
};

export async function getProjectAccess(projectId: string, userId: string | null): Promise<ProjectAccess | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      visibility: true,
      members: {
        where: { userId: userId ?? "__anonymous__" },
        select: { role: true },
        take: 1
      }
    }
  });

  if (project === null) {
    return null;
  }

  const role = project.members[0]?.role ?? null;
  return { projectId: project.id, role, visibility: project.visibility };
}

export async function requireProjectView(projectId: string, userId: string | null): Promise<ProjectAccess> {
  const access = await getProjectAccess(projectId, userId);

  if (access === null || !canViewProject(access.role, access.visibility)) {
    throw new Response("Project not found", { status: 404 });
  }

  return access;
}

export async function requireProjectEdit(projectId: string, userId: string): Promise<ProjectAccess> {
  const access = await requireProjectView(projectId, userId);

  if (!canEditProject(access.role)) {
    throw new Response("You do not have permission to edit this project.", { status: 403 });
  }

  return access;
}

export async function requireProjectOwner(projectId: string, userId: string): Promise<ProjectAccess> {
  const access = await requireProjectView(projectId, userId);

  if (!canManageProject(access.role)) {
    throw new Response("Only project owners can manage this project.", { status: 403 });
  }

  return access;
}
