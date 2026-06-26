"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button, Dialog, Input, Label, Textarea } from "@pixelsync/ui";

type ProjectForm = {
  name: string;
  description: string;
  visibility: "PRIVATE" | "LINK" | "PUBLIC";
  canvasName: string;
  width: number;
  height: number;
};

export function CreateProjectDialog(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const form = useForm<ProjectForm>({
    defaultValues: {
      name: "",
      description: "",
      visibility: "PRIVATE",
      canvasName: "Main canvas",
      width: 32,
      height: 32
    }
  });

  function submit(values: ProjectForm): void {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          description: values.description,
          visibility: values.visibility,
          canvasName: values.canvasName,
          canvas: { width: values.width, height: values.height }
        })
      });

      const result = (await response.json()) as { project?: { id: string; defaultCanvasId?: string }; message?: string };

      if (!response.ok || result.project === undefined) {
        setError(result.message ?? "Project could not be created.");
        return;
      }

      setOpen(false);
      router.refresh();
      router.push(`/projects/${result.project.id}`);
    });
  }

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus size={18} aria-hidden="true" />
        New project
      </Button>
      <Dialog open={open} title="Create project" description="Start a collaborative pixel workspace." onClose={() => setOpen(false)}>
        <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">Project name</Label>
            <Input id="name" required {...form.register("name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">Description</Label>
            <Textarea id="description" {...form.register("description")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="visibility" className="text-white">Visibility</Label>
              <select
                id="visibility"
                className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm"
                {...form.register("visibility")}
              >
                <option value="PRIVATE">Private</option>
                <option value="LINK">Link access</option>
                <option value="PUBLIC">Public</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="width" className="text-white">Width</Label>
              <Input id="width" type="number" min={1} max={512} {...form.register("width", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height" className="text-white">Height</Label>
              <Input id="height" type="number" min={1} max={512} {...form.register("height", { valueAsNumber: true })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="canvasName" className="text-white">First canvas</Label>
            <Input id="canvasName" required {...form.register("canvasName")} />
          </div>
          {error === null ? null : <p role="alert" className="text-sm text-red-300">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={isPending}>{isPending ? "Creating..." : "Create"}</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
