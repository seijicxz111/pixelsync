import { NextResponse } from "next/server";
import { z } from "zod";
import { canvasDimensionsSchema } from "@pixelsync/shared";
import { requireProjectEdit } from "@/lib/authorization";
import { handleRouteError, requireUserId } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { createBlankSnapshot } from "@/lib/snapshots";

const createCanvasSchema = z.object({
  name: z.string().min(1).max(80),
  dimensions: canvasDimensionsSchema,
  backgroundMode: z.enum(["TRANSPARENT", "SOLID", "CHECKERBOARD"]).default("CHECKERBOARD")
});

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> }
): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const { projectId } = await context.params;
    const payload = createCanvasSchema.parse(await request.json());
    await requireProjectEdit(projectId, userId);

    const canvas = await prisma.$transaction(async (tx) => {
      const created = await tx.canvas.create({
        data: {
          projectId,
          name: sanitizePlainText(payload.name, 80),
          width: payload.dimensions.width,
          height: payload.dimensions.height,
          backgroundMode: payload.backgroundMode
        }
      });

      const snapshot = await tx.canvasSnapshot.create({
        data: {
          canvasId: created.id,
          width: payload.dimensions.width,
          height: payload.dimensions.height,
          encodedPixelData: createBlankSnapshot(payload.dimensions.width, payload.dimensions.height),
          sequenceNumber: 0,
          createdById: userId
        }
      });

      await tx.canvas.update({
        where: { id: created.id },
        data: { currentSnapshotId: snapshot.id }
      });

      await tx.activityLog.create({
        data: {
          projectId,
          userId,
          action: "CANVAS_CREATED",
          metadata: { canvasId: created.id, name: created.name }
        }
      });

      return created;
    });

    return NextResponse.json({ canvas }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
