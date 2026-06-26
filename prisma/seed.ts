import { PrismaClient } from "@prisma/client";
import {
  applyPixelChanges,
  createPixelBuffer,
  encodeSnapshot,
  linePoints,
  packRgba,
  pencilStroke,
  rectanglePoints
} from "../packages/shared/src/pixel";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@pixelsync.dev" },
    update: {},
    create: {
      id: "demo_user",
      name: "PixelSync Demo",
      email: "demo@pixelsync.dev",
      image: "https://api.dicebear.com/9.x/identicon/svg?seed=PixelSync"
    }
  });

  const collaborator = await prisma.user.upsert({
    where: { email: "artist@pixelsync.dev" },
    update: {},
    create: {
      id: "demo_artist",
      name: "Demo Artist",
      email: "artist@pixelsync.dev",
      image: "https://api.dicebear.com/9.x/identicon/svg?seed=Artist"
    }
  });

  const project = await prisma.project.upsert({
    where: { id: "demo_project_adventure" },
    update: {},
    create: {
      id: "demo_project_adventure",
      ownerId: demoUser.id,
      name: "Crystal Caverns",
      description: "Sprite concepts for a cooperative cave explorer.",
      visibility: "LINK",
      allowGuests: true,
      members: {
        create: [
          { userId: demoUser.id, role: "OWNER" },
          { userId: collaborator.id, role: "EDITOR" }
        ]
      },
      palettes: {
        create: [
          {
            name: "Cavern Glow",
            colors: ["#0f172a", "#1e293b", "#22d3ee", "#a7f3d0", "#fef08a", "#f87171"]
          }
        ]
      }
    }
  });

  await prisma.project.upsert({
    where: { id: "demo_project_tiles" },
    update: {},
    create: {
      id: "demo_project_tiles",
      ownerId: demoUser.id,
      name: "Skyline Tiles",
      description: "Tile and prop experiments for a side-scrolling city scene.",
      visibility: "PRIVATE",
      members: {
        create: [{ userId: demoUser.id, role: "OWNER" }]
      },
      palettes: {
        create: [
          {
            name: "Dusk City",
            colors: ["#111827", "#374151", "#60a5fa", "#f472b6", "#facc15", "#f8fafc"]
          }
        ]
      }
    }
  });

  const heroCanvas = await prisma.canvas.upsert({
    where: { id: "demo_canvas_hero" },
    update: {},
    create: {
      id: "demo_canvas_hero",
      projectId: project.id,
      name: "Crystal Knight Idle",
      width: 32,
      height: 32,
      backgroundMode: "CHECKERBOARD"
    }
  });

  const iconCanvas = await prisma.canvas.upsert({
    where: { id: "demo_canvas_icon" },
    update: {},
    create: {
      id: "demo_canvas_icon",
      projectId: project.id,
      name: "Pickup Icon",
      width: 16,
      height: 16,
      backgroundMode: "CHECKERBOARD"
    }
  });

  const heroSnapshot = await upsertSnapshot(heroCanvas.id, demoUser.id, 12, buildKnightSprite());
  const iconSnapshot = await upsertSnapshot(iconCanvas.id, demoUser.id, 4, buildCrystalIcon());

  await prisma.canvas.update({
    where: { id: heroCanvas.id },
    data: { currentSnapshotId: heroSnapshot.id, currentSequence: heroSnapshot.sequenceNumber }
  });

  await prisma.canvas.update({
    where: { id: iconCanvas.id },
    data: { currentSnapshotId: iconSnapshot.id, currentSequence: iconSnapshot.sequenceNumber }
  });

  await prisma.canvasVersion.upsert({
    where: { id: "demo_version_hero_v1" },
    update: {},
    create: {
      id: "demo_version_hero_v1",
      canvasId: heroCanvas.id,
      snapshotId: heroSnapshot.id,
      label: "Idle pose v1",
      description: "Initial readable silhouette with crystal accent lighting.",
      createdById: demoUser.id
    }
  });

  await prisma.canvasVersion.upsert({
    where: { id: "demo_version_icon_v1" },
    update: {},
    create: {
      id: "demo_version_icon_v1",
      canvasId: iconCanvas.id,
      snapshotId: iconSnapshot.id,
      label: "Readable at 16px",
      description: "Centered collectible icon with strong edge contrast.",
      createdById: collaborator.id
    }
  });

  await prisma.activityLog.createMany({
    data: [
      {
        id: "demo_activity_project_created",
        projectId: project.id,
        userId: demoUser.id,
        action: "PROJECT_CREATED",
        metadata: { name: project.name }
      },
      {
        id: "demo_activity_version_created",
        projectId: project.id,
        userId: collaborator.id,
        action: "VERSION_CREATED",
        metadata: { canvasId: iconCanvas.id, label: "Readable at 16px" }
      }
    ],
    skipDuplicates: true
  });
}

async function upsertSnapshot(
  canvasId: string,
  createdById: string,
  sequenceNumber: number,
  buffer: ReturnType<typeof createPixelBuffer>
) {
  const encoded = encodeSnapshot(buffer);

  return prisma.canvasSnapshot.upsert({
    where: { canvasId_sequenceNumber: { canvasId, sequenceNumber } },
    update: {
      encodedPixelData: JSON.stringify(encoded),
      width: buffer.width,
      height: buffer.height,
      createdById
    },
    create: {
      canvasId,
      width: buffer.width,
      height: buffer.height,
      encodedPixelData: JSON.stringify(encoded),
      sequenceNumber,
      createdById
    }
  });
}

function buildKnightSprite(): ReturnType<typeof createPixelBuffer> {
  const buffer = createPixelBuffer(32, 32);
  const outline = packRgba({ r: 15, g: 23, b: 42, a: 255 });
  const armor = packRgba({ r: 148, g: 163, b: 184, a: 255 });
  const shine = packRgba({ r: 226, g: 232, b: 240, a: 255 });
  const cyan = packRgba({ r: 34, g: 211, b: 238, a: 255 });
  const cloak = packRgba({ r: 244, g: 114, b: 182, a: 255 });
  const gold = packRgba({ r: 250, g: 204, b: 21, a: 255 });

  applyPixelChanges(buffer, pencilStroke(rectanglePoints({ x: 11, y: 6 }, { x: 20, y: 14 }, true), armor));
  applyPixelChanges(buffer, pencilStroke(rectanglePoints({ x: 10, y: 5 }, { x: 21, y: 15 }, false), outline));
  applyPixelChanges(buffer, pencilStroke(rectanglePoints({ x: 13, y: 9 }, { x: 18, y: 11 }, true), cyan));
  applyPixelChanges(buffer, pencilStroke(rectanglePoints({ x: 8, y: 15 }, { x: 23, y: 24 }, true), cloak));
  applyPixelChanges(buffer, pencilStroke(rectanglePoints({ x: 11, y: 15 }, { x: 20, y: 24 }, true), armor));
  applyPixelChanges(buffer, pencilStroke(rectanglePoints({ x: 10, y: 15 }, { x: 21, y: 25 }, false), outline));
  applyPixelChanges(buffer, pencilStroke(linePoints({ x: 7, y: 15 }, { x: 4, y: 24 }), outline));
  applyPixelChanges(buffer, pencilStroke(linePoints({ x: 24, y: 15 }, { x: 27, y: 24 }), outline));
  applyPixelChanges(buffer, pencilStroke(rectanglePoints({ x: 13, y: 25 }, { x: 15, y: 28 }, true), outline));
  applyPixelChanges(buffer, pencilStroke(rectanglePoints({ x: 17, y: 25 }, { x: 19, y: 28 }, true), outline));
  applyPixelChanges(buffer, pencilStroke(rectanglePoints({ x: 14, y: 3 }, { x: 17, y: 5 }, true), gold));
  applyPixelChanges(buffer, pencilStroke([{ x: 13, y: 7 }, { x: 14, y: 7 }, { x: 15, y: 7 }], shine));

  return buffer;
}

function buildCrystalIcon(): ReturnType<typeof createPixelBuffer> {
  const buffer = createPixelBuffer(16, 16);
  const edge = packRgba({ r: 8, g: 47, b: 73, a: 255 });
  const cyan = packRgba({ r: 34, g: 211, b: 238, a: 255 });
  const light = packRgba({ r: 165, g: 243, b: 252, a: 255 });

  applyPixelChanges(buffer, pencilStroke(linePoints({ x: 7, y: 1 }, { x: 12, y: 6 }), edge));
  applyPixelChanges(buffer, pencilStroke(linePoints({ x: 12, y: 6 }, { x: 8, y: 14 }), edge));
  applyPixelChanges(buffer, pencilStroke(linePoints({ x: 8, y: 14 }, { x: 3, y: 6 }), edge));
  applyPixelChanges(buffer, pencilStroke(linePoints({ x: 3, y: 6 }, { x: 7, y: 1 }), edge));
  applyPixelChanges(buffer, pencilStroke(rectanglePoints({ x: 5, y: 5 }, { x: 10, y: 10 }, true), cyan));
  applyPixelChanges(buffer, pencilStroke(linePoints({ x: 6, y: 4 }, { x: 8, y: 3 }), light));
  applyPixelChanges(buffer, pencilStroke(linePoints({ x: 5, y: 6 }, { x: 7, y: 10 }), light));

  return buffer;
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
