import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ShareDialog } from "./share-dialog";

describe("ShareDialog", () => {
  it("opens role controls", () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn() }
    });

    render(<ShareDialog projectId="project_123" />);
    fireEvent.click(screen.getByText("Share"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Invite role")).toBeInTheDocument();
  });
});
