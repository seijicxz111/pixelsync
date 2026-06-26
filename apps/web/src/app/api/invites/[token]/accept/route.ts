import { NextResponse } from "next/server";
import { hashInviteToken } from "@/lib/invites";
import { handleRouteError, requireUserId } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  context: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const { token } = await context.params;
    const invite = await prisma.invite.findUnique({
      where: { tokenHash: hashInviteToken(token) },
      include: { project: true }
    });

    if (invite === null || invite.expiresAt < new Date()) {
      return NextResponse.json({ message: "This invite is invalid or expired." }, { status: 404 });
    }

    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: invite.projectId, userId } },
      update: { role: invite.role },
      create: { projectId: invite.projectId, userId, role: invite.role }
    });

    await prisma.activityLog.create({
      data: {
        projectId: invite.projectId,
        userId,
        action: "INVITE_ACCEPTED",
        metadata: { role: invite.role }
      }
    });

    return NextResponse.json({ projectId: invite.projectId });
  } catch (error) {
    return handleRouteError(error);
  }
}
