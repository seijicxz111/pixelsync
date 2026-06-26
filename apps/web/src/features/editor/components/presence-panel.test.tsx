import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { type PresenceUser } from "@pixelsync/shared";
import { PresencePanel } from "./presence-panel";

const user: PresenceUser = {
  userId: "user_123",
  displayName: "Ada",
  avatarUrl: null,
  collaborationColor: "#22d3ee",
  activeTool: "PENCIL",
  selectedColor: 0x22d3eeff,
  cursor: { x: 1, y: 2 },
  status: "CONNECTED",
  lastActiveAt: new Date().toISOString()
};

describe("PresencePanel", () => {
  it("shows connection status and collaborators", () => {
    render(<PresencePanel status="CONNECTED" users={[user]} />);

    expect(screen.getByText("connected")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
  });
});
