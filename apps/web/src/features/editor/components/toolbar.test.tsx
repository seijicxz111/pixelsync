import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Toolbar } from "./toolbar";
import { useEditorStore } from "../store/use-editor-store";

describe("Toolbar", () => {
  it("changes the active drawing tool", () => {
    render(<Toolbar canEdit />);

    fireEvent.click(screen.getByLabelText("Eraser"));

    expect(useEditorStore.getState().tool).toBe("ERASER");
    expect(screen.getByLabelText("Eraser")).toHaveAttribute("aria-pressed", "true");
  });

  it("disables editing tools for viewers", () => {
    render(<Toolbar canEdit={false} />);

    expect(screen.getByLabelText("Pencil")).toBeDisabled();
    expect(screen.getByLabelText("Pan")).not.toBeDisabled();
  });
});
