import { notFound, redirect } from "next/navigation";
import { canEditProject, canViewProject, type SnapshotEncoding } from "@pixelsync/shared";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getProjectAccess } from "@/lib/authorization";
import { PixelEditor } from "@/features/editor/components/pixel-editor";

export default async function EditorPage({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string; canvasId: string }>;
  searchParams: Promise<{ debug?: string }>;
}): Promise<JSX.Element> {
  const session = await auth();
  const { projectId, canvasId } = await params;
  const { debug } = await searchParams;
  const access = await getProjectAccess(projectId, session?.user?.id ?? null);

  if (access === null) {
    notFound();
  }

  if (!canViewProject(access.role, access.visibility)) {
    redirect("/sign-in");
  }

  const canvas = await prisma.canvas.findFirst({
    where: { id: canvasId, projectId },
    include: {
      project: { select: { name: true } },
      snapshots: { orderBy: { sequenceNumber: "desc" }, take: 1 }
    }
  });

  if (canvas === null) {
    notFound();
  }

  const snapshotRecord =
    canvas.currentSnapshotId === null
      ? canvas.snapshots[0]
      : await prisma.canvasSnapshot.findUnique({ where: { id: canvas.currentSnapshotId } });

  if (snapshotRecord === null || snapshotRecord === undefined) {
    notFound();
  }

  return (
    <PixelEditor
      projectId={projectId}
      projectName={canvas.project.name}
      canvasId={canvas.id}
      canvasName={canvas.name}
      initialSnapshot={JSON.parse(snapshotRecord.encodedPixelData) as SnapshotEncoding}
      initialSequence={snapshotRecord.sequenceNumber}
      currentUser={{
        id: session?.user?.id ?? null,
        name: session?.user?.name ?? "Guest viewer",
        image: session?.user?.image ?? null
      }}
      canEdit={canEditProject(access.role)}
      debug={debug === "1" || process.env.NODE_ENV === "development"}
    />
  );
}
