import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ColorPanel } from "./color-panel";
import { useEditorStore } from "../store/use-editor-store";

describe("ColorPanel", () => {
  it("updates foreground hex input", () => {
    render(<ColorPanel canvasName="Test Canvas" />);
    const input = screen.getByLabelText("Foreground");

    fireEvent.change(input, { target: { value: "#ff0000ff" } });

    expect(useEditorStore.getState().foregroundColor).toBe(0xff0000ff);
  });
});
