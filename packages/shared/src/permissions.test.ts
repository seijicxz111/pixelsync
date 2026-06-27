import { describe, expect, it } from "vitest";
import { canEditProject, canManageProject, canViewProject, roleMeets } from "./permissions";

describe("permission utilities", () => {
  it("allows public viewing without membership", () => {
    expect(canViewProject(null, "PUBLIC")).toBe(true);
    expect(canViewProject(null, "LINK")).toBe(true);
    expect(canViewProject(null, "PRIVATE")).toBe(false);
  });

  it("distinguishes editor and owner capabilities", () => {
    expect(canEditProject("EDITOR")).toBe(true);
    expect(canEditProject("VIEWER")).toBe(false);
    expect(canManageProject("OWNER")).toBe(true);
    expect(canManageProject("EDITOR")).toBe(false);
  });

  it("compares role ranks", () => {
    expect(roleMeets("OWNER", "VIEWER")).toBe(true);
    expect(roleMeets("VIEWER", "EDITOR")).toBe(false);
    expect(roleMeets(null, "VIEWER")).toBe(false);
  });
});
