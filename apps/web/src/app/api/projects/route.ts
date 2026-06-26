import { NextResponse } from "next/server";
import { z } from "zod";
import { canvasDimensionsSchema, createPixelBuffer, encodeSnapshot } from "@pixelsync/shared";
import { handleRouteError, requireUserId } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";

const createProjectSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  visibility: z.enum(["PRIVATE", "LINK", "PUBLIC"]).default("PRIVATE"),
  canvasName: z.string().min(1).max(80).default("Main canvas"),
  canvas: canvasDimensionsSchema.default({ width: 32, height: 32 })
});

export async function GET(): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: { userId }
        }
      },
      orderBy: { updatedAt: "desc" },
      include: {
        canvases: {
          select: { id: true, name: true, width: true, height: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: 3
        },
        members: {
          include: {
            user: { select: { id: true, name: true, image: true } }
          },
          take: 6
        },
        activities: {
          select: { id: true, action: true, metadata: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 5
        }
      }
    });

    return NextResponse.json({ projects });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const payload = createProjectSchema.parse(await request.json());
    const snapshot = JSON.stringify(encodeSnapshot(createPixelBuffer(payload.canvas.width, payload.canvas.height)));

    const project = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          ownerId: userId,
          name: sanitizePlainText(payload.name, 80),
          description:
            payload.description === undefined ? null : sanitizePlainText(payload.description, 500),
          visibility: payload.visibility,
          members: {
            create: { userId, role: "OWNER" }
          }
        }
      });

      const canvas = await tx.canvas.create({
        data: {
          projectId: created.id,
          name: sanitizePlainText(payload.canvasName, 80),
          width: payload.canvas.width,
          height: payload.canvas.height
        }
      });

      const createdSnapshot = await tx.canvasSnapshot.create({
        data: {
          canvasId: canvas.id,
          width: payload.canvas.width,
          height: payload.canvas.height,
          encodedPixelData: snapshot,
          sequenceNumber: 0,
          createdById: userId
        }
      });

      await tx.canvas.update({
        where: { id: canvas.id },
        data: { currentSnapshotId: createdSnapshot.id }
      });

      await tx.activityLog.create({
        data: {
          projectId: created.id,
          userId,
          action: "PROJECT_CREATED",
          metadata: { canvasId: canvas.id }
        }
      });

      return { ...created, defaultCanvasId: canvas.id };
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
