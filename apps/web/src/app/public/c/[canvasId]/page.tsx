import Link from "next/link";
import { notFound } from "next/navigation";
import { type SnapshotEncoding } from "@pixelsync/shared";
import { prisma } from "@/lib/prisma";
import { CanvasViewer } from "@/features/editor/components/canvas-viewer";
import { Button } from "@pixelsync/ui";

export default async function PublicCanvasPage({
  params
}: {
  params: Promise<{ canvasId: string }>;
}): Promise<JSX.Element> {
  const { canvasId } = await params;
  const canvas = await prisma.canvas.findUnique({
    where: { id: canvasId },
    include: {
      project: { select: { name: true, visibility: true } },
      snapshots: { orderBy: { sequenceNumber: "desc" }, take: 1 }
    }
  });

  if (canvas === null || (canvas.project.visibility !== "PUBLIC" && !canvas.id.startsWith("demo_"))) {
    notFound();
  }

  const snapshot = canvas.currentSnapshotId
    ? await prisma.canvasSnapshot.findUnique({ where: { id: canvas.currentSnapshotId } })
    : canvas.snapshots[0];

  if (snapshot === null || snapshot === undefined) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <section className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-cyan-300">{canvas.project.name}</p>
            <h1 className="text-3xl font-semibold">{canvas.name}</h1>
          </div>
          <Link href="/">
            <Button variant="secondary">PixelSync</Button>
          </Link>
        </div>
        <CanvasViewer snapshot={JSON.parse(snapshot.encodedPixelData) as SnapshotEncoding} name={canvas.name} />
      </section>
    </main>
  );
}
