import { NextResponse } from "next/server";
import { requireProjectEdit } from "@/lib/authorization";
import { handleRouteError, requireUserId } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  context: { params: Promise<{ canvasId: string; versionId: string }> }
): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const { canvasId, versionId } = await context.params;
    const version = await prisma.canvasVersion.findUnique({
      where: { id: versionId },
      include: {
        canvas: true,
        snapshot: true
      }
    });

    if (version === null || version.canvasId !== canvasId) {
      return NextResponse.json({ message: "Version not found." }, { status: 404 });
    }

    await requireProjectEdit(version.canvas.projectId, userId);
    const canvas = await prisma.canvas.update({
      where: { id: canvasId },
      data: {
        currentSnapshotId: version.snapshotId,
        currentSequence: version.snapshot.sequenceNumber
      }
    });

    await prisma.activityLog.create({
      data: {
        projectId: version.canvas.projectId,
        userId,
        action: "VERSION_RESTORED",
        metadata: { canvasId, versionId }
      }
    });

    return NextResponse.json({ canvas });
  } catch (error) {
    return handleRouteError(error);
  }
}
