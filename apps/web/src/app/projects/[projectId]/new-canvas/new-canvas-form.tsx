"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button, Card, CardContent, Input, Label } from "@pixelsync/ui";

type CanvasForm = {
  name: string;
  width: number;
  height: number;
  backgroundMode: "TRANSPARENT" | "SOLID" | "CHECKERBOARD";
};

const presets = [16, 32, 64, 128] as const;

export function NewCanvasForm({ projectId }: { projectId: string }): JSX.Element {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<CanvasForm>({
    defaultValues: {
      name: "Untitled canvas",
      width: 32,
      height: 32,
      backgroundMode: "CHECKERBOARD"
    }
  });

  function submit(values: CanvasForm): void {
    startTransition(async () => {
      setError(null);
      const response = await fetch(`/api/projects/${projectId}/canvases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          dimensions: { width: values.width, height: values.height },
          backgroundMode: values.backgroundMode
        })
      });
      const result = (await response.json()) as { canvas?: { id: string }; message?: string };

      if (!response.ok || result.canvas === undefined) {
        setError(result.message ?? "Canvas could not be created.");
        return;
      }

      router.push(`/projects/${projectId}/canvases/${result.canvas.id}`);
      router.refresh();
    });
  }

  return (
    <Card className="mt-6 border-white/10 bg-white/[0.03] text-white">
      <CardContent>
        <form className="space-y-5" onSubmit={form.handleSubmit(submit)}>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">Canvas name</Label>
            <Input id="name" required {...form.register("name")} />
          </div>
          <div>
            <Label className="text-white">Presets</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {presets.map((size) => (
                <Button
                  key={size}
                  variant="secondary"
                  onClick={() => {
                    form.setValue("width", size);
                    form.setValue("height", size);
                  }}
                >
                  {size} x {size}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="width" className="text-white">Width</Label>
              <Input id="width" type="number" min={1} max={512} {...form.register("width", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height" className="text-white">Height</Label>
              <Input id="height" type="number" min={1} max={512} {...form.register("height", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="background" className="text-white">Background</Label>
              <select
                id="background"
                className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm"
                {...form.register("backgroundMode")}
              >
                <option value="CHECKERBOARD">Checkerboard</option>
                <option value="TRANSPARENT">Transparent</option>
                <option value="SOLID">Solid</option>
              </select>
            </div>
          </div>
          {error === null ? null : <p role="alert" className="text-sm text-red-300">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={isPending}>{isPending ? "Creating..." : "Create canvas"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
