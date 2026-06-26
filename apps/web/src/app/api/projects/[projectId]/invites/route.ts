import { NextResponse } from "next/server";
import { z } from "zod";
import { requireProjectOwner } from "@/lib/authorization";
import { createInviteToken, hashInviteToken } from "@/lib/invites";
import { env } from "@/lib/env";
import { handleRouteError, requireUserId } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const createInviteSchema = z.object({
  role: z.enum(["EDITOR", "VIEWER"]).default("VIEWER"),
  expiresInDays: z.number().int().min(1).max(30).default(7)
});

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> }
): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const { projectId } = await context.params;
    const payload = createInviteSchema.parse(await request.json());
    await requireProjectOwner(projectId, userId);

    const token = createInviteToken();
    const invite = await prisma.invite.create({
      data: {
        projectId,
        role: payload.role,
        tokenHash: hashInviteToken(token),
        expiresAt: new Date(Date.now() + payload.expiresInDays * 24 * 60 * 60 * 1000),
        createdById: userId
      }
    });

    return NextResponse.json({
      invite: {
        id: invite.id,
        role: invite.role,
        expiresAt: invite.expiresAt,
        url: `${env.NEXT_PUBLIC_APP_URL}/invite/${token}`
      }
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
