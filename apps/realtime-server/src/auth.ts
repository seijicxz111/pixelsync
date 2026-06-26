import { type ProjectRole } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import { type Socket } from "socket.io";
import { canEditProject, canViewProject } from "@pixelsync/shared";
import { env } from "./env";
import { prisma } from "./prisma";

export type SocketIdentity = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  isGuest: boolean;
};

const sessionCookieNames = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token"
] as const;

export async function resolveSocketIdentity(socket: Socket): Promise<SocketIdentity | null> {
  const sessionToken = readSessionToken(socket.handshake.headers.cookie ?? "");

  if (sessionToken !== null) {
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: { select: { id: true, name: true, email: true, image: true } } }
    });

    if (session !== null && session.expires > new Date()) {
      return {
        userId: session.user.id,
        displayName: session.user.name ?? session.user.email ?? "PixelSync user",
        avatarUrl: session.user.image,
        isGuest: false
      };
    }
  }

  const jwtIdentity = await resolveJwtIdentity(socket.handshake.headers.cookie ?? "");
  if (jwtIdentity !== null) {
    return jwtIdentity;
  }

  const projectId = typeof socket.handshake.auth.projectId === "string" ? socket.handshake.auth.projectId : null;
  const displayName =
    typeof socket.handshake.auth.displayName === "string"
      ? socket.handshake.auth.displayName.slice(0, 60)
      : "Guest";

  if (projectId === null) {
    return null;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { allowGuests: true, visibility: true }
  });

  if (project?.allowGuests || project?.visibility === "PUBLIC") {
    return {
      userId: `guest_${socket.id}`,
      displayName,
      avatarUrl: null,
      isGuest: true
    };
  }

  return null;
}

async function resolveJwtIdentity(cookieHeader: string): Promise<SocketIdentity | null> {
  if (!cookieHeader) {
    return null;
  }

  const token = await getToken({
    req: {
      headers: {
        cookie: cookieHeader
      }
    },
    secret: env.AUTH_SECRET
  });

  if (token?.sub === undefined) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: token.sub },
    select: { id: true, name: true, email: true, image: true }
  });

  if (user === null) {
    return null;
  }

  return {
    userId: user.id,
    displayName: user.name ?? user.email ?? "PixelSync user",
    avatarUrl: user.image,
    isGuest: false
  };
}

export async function getProjectRole(projectId: string, identity: SocketIdentity): Promise<ProjectRole | null> {
  if (identity.isGuest) {
    return null;
  }

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: identity.userId } },
    select: { role: true }
  });

  return membership?.role ?? null;
}

export async function canJoinProject(projectId: string, identity: SocketIdentity): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { visibility: true, allowGuests: true }
  });

  if (project === null) {
    return false;
  }

  const role = await getProjectRole(projectId, identity);
  return canViewProject(role, project.visibility) || project.allowGuests || project.visibility === "PUBLIC";
}

export async function canModifyProject(projectId: string, identity: SocketIdentity): Promise<boolean> {
  if (identity.isGuest) {
    return false;
  }

  const role = await getProjectRole(projectId, identity);
  return canEditProject(role);
}

function readSessionToken(cookieHeader: string): string | null {
  const cookies = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separator = part.indexOf("=");
      return separator === -1
        ? ([part, ""] as const)
        : ([part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))] as const);
    });

  for (const name of sessionCookieNames) {
    const match = cookies.find(([cookieName]) => cookieName === name);
    if (match !== undefined) {
      return match[1];
    }
  }

  return null;
}
