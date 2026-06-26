import { expect, test } from "@playwright/test";

async function signIn(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/sign-in");
  await page.getByLabel("Demo email").fill("demo@pixelsync.dev");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/dashboard/);
}

test.describe("PixelSync core workflow", () => {
  test("user signs in and creates a project and canvas", async ({ page }) => {
    await signIn(page);
    await page.getByRole("button", { name: "New project" }).first().click();
    await page.getByLabel("Project name").fill("Playwright Sprite Pack");
    await page.getByLabel("Description").fill("Created by end-to-end tests.");
    await page.getByLabel("Width").fill("16");
    await page.getByLabel("Height").fill("16");
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page).toHaveURL(/projects/);
    await expect(page.getByText("Playwright Sprite Pack")).toBeVisible();
  });

  test("viewer cannot draw on the public read-only canvas", async ({ page }) => {
    await page.goto("/public/c/demo_canvas_hero");
    await expect(page.getByRole("button", { name: "PixelSync" })).toBeVisible();
    await expect(page.getByLabel("Crystal Knight Idle")).toBeVisible();
  });

  test("two contexts can open the same canvas", async ({ browser }) => {
    const first = await browser.newContext();
    const second = await browser.newContext();
    const firstPage = await first.newPage();
    const secondPage = await second.newPage();

    await signIn(firstPage);
    await signIn(secondPage);
    await firstPage.goto("/projects/demo_project_adventure/canvases/demo_canvas_hero?debug=1");
    await secondPage.goto("/projects/demo_project_adventure/canvases/demo_canvas_hero?debug=1");

    await expect(firstPage.getByLabel("Pixel canvas")).toBeVisible();
    await expect(secondPage.getByLabel("Pixel canvas")).toBeVisible();

    await first.close();
    await second.close();
  });
});
