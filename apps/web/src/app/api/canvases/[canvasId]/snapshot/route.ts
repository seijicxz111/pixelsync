import { NextResponse } from "next/server";
import { type SnapshotEncoding } from "@pixelsync/shared";
import { getOptionalUserId, handleRouteError } from "@/lib/http";
import { requireProjectView } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ canvasId: string }> }
): Promise<NextResponse> {
  try {
    const userId = await getOptionalUserId();
    const { canvasId } = await context.params;
    const canvas = await prisma.canvas.findUnique({
      where: { id: canvasId },
      include: {
        project: { select: { id: true, visibility: true } },
        snapshots: {
          orderBy: { sequenceNumber: "desc" },
          take: 1
        }
      }
    });

    if (canvas === null) {
      return NextResponse.json({ message: "Canvas not found." }, { status: 404 });
    }

    await requireProjectView(canvas.projectId, userId);
    const snapshot = canvas.snapshots[0] ?? null;

    return NextResponse.json({
      canvas: {
        id: canvas.id,
        projectId: canvas.projectId,
        name: canvas.name,
        width: canvas.width,
        height: canvas.height,
        backgroundMode: canvas.backgroundMode,
        currentSequence: canvas.currentSequence
      },
      snapshot: snapshot === null ? null : (JSON.parse(snapshot.encodedPixelData) as SnapshotEncoding)
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
