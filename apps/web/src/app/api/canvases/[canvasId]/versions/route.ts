import { NextResponse } from "next/server";
import { z } from "zod";
import { requireProjectEdit, requireProjectView } from "@/lib/authorization";
import { getOptionalUserId, handleRouteError, requireUserId } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";

const createVersionSchema = z.object({
  label: z.string().min(1).max(80),
  description: z.string().max(1000).optional()
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ canvasId: string }> }
): Promise<NextResponse> {
  try {
    const userId = await getOptionalUserId();
    const { canvasId } = await context.params;
    const canvas = await prisma.canvas.findUnique({ where: { id: canvasId }, select: { projectId: true } });

    if (canvas === null) {
      return NextResponse.json({ message: "Canvas not found." }, { status: 404 });
    }

    await requireProjectView(canvas.projectId, userId);
    const versions = await prisma.canvasVersion.findMany({
      where: { canvasId },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
        snapshot: { select: { sequenceNumber: true, createdAt: true } }
      }
    });

    return NextResponse.json({ versions });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ canvasId: string }> }
): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const { canvasId } = await context.params;
    const payload = createVersionSchema.parse(await request.json());
    const canvas = await prisma.canvas.findUnique({
      where: { id: canvasId },
      include: {
        snapshots: {
          orderBy: { sequenceNumber: "desc" },
          take: 1
        }
      }
    });

    if (canvas === null || canvas.snapshots[0] === undefined) {
      return NextResponse.json({ message: "Canvas has no snapshot to version." }, { status: 404 });
    }

    await requireProjectEdit(canvas.projectId, userId);
    const version = await prisma.canvasVersion.create({
      data: {
        canvasId,
        snapshotId: canvas.snapshots[0].id,
        label: sanitizePlainText(payload.label, 80),
        description:
          payload.description === undefined ? null : sanitizePlainText(payload.description, 1000),
        createdById: userId
      }
    });

    await prisma.activityLog.create({
      data: {
        projectId: canvas.projectId,
        userId,
        action: "VERSION_CREATED",
        metadata: { canvasId, versionId: version.id, label: version.label }
      }
    });

    return NextResponse.json({ version }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
