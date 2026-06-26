import { NextResponse } from "next/server";
import { z } from "zod";
import { requireProjectEdit } from "@/lib/authorization";
import { handleRouteError, requireUserId } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { uploadCanvasExport } from "@/lib/storage";

const uploadExportSchema = z.object({
  filename: z.string().min(1).max(120),
  pngBase64: z.string().min(1)
});

export async function POST(
  request: Request,
  context: { params: Promise<{ canvasId: string }> }
): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const { canvasId } = await context.params;
    const payload = uploadExportSchema.parse(await request.json());
    const canvas = await prisma.canvas.findUnique({ where: { id: canvasId }, select: { projectId: true } });

    if (canvas === null) {
      return NextResponse.json({ message: "Canvas not found." }, { status: 404 });
    }

    await requireProjectEdit(canvas.projectId, userId);
    const asset = await uploadCanvasExport({
      canvasId,
      filename: payload.filename,
      pngBytes: Uint8Array.from(Buffer.from(payload.pngBase64, "base64"))
    });

    await prisma.activityLog.create({
      data: {
        projectId: canvas.projectId,
        userId,
        action: "CANVAS_EXPORTED",
        metadata: { canvasId, assetPath: asset.path, publicUrl: asset.publicUrl }
      }
    });

    return NextResponse.json({ asset });
  } catch (error) {
    return handleRouteError(error);
  }
}
