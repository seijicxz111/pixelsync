import { z } from "zod";

export const projectVisibilitySchema = z.enum(["PRIVATE", "LINK", "PUBLIC"]);
export const projectRoleSchema = z.enum(["OWNER", "EDITOR", "VIEWER"]);

export type ProjectVisibility = z.infer<typeof projectVisibilitySchema>;
export type ProjectRole = z.infer<typeof projectRoleSchema>;

const roleRank: Record<ProjectRole, number> = {
  VIEWER: 1,
  EDITOR: 2,
  OWNER: 3
};

export function canViewProject(role: ProjectRole | null, visibility: ProjectVisibility): boolean {
  return visibility === "PUBLIC" || visibility === "LINK" || role !== null;
}

export function canEditProject(role: ProjectRole | null): boolean {
  return role === "OWNER" || role === "EDITOR";
}

export function canManageProject(role: ProjectRole | null): boolean {
  return role === "OWNER";
}

export function roleMeets(role: ProjectRole | null, required: ProjectRole): boolean {
  if (role === null) {
    return false;
  }

  return roleRank[role] >= roleRank[required];
}
