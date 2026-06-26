import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { requireProjectEdit } from "@/lib/authorization";
import { AppHeader } from "@/components/app-header";
import { NewCanvasForm } from "./new-canvas-form";

export const metadata = {
  title: "New canvas"
};

export default async function NewCanvasPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}): Promise<JSX.Element> {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const { projectId } = await params;
  await requireProjectEdit(projectId, session.user.id);

  return (
    <div className="min-h-screen dark bg-slate-950 text-white">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-semibold">New canvas</h1>
        <p className="mt-2 text-sm text-slate-400">Choose a sprite-friendly size or define custom dimensions.</p>
        <NewCanvasForm projectId={projectId} />
      </main>
    </div>
  );
}
