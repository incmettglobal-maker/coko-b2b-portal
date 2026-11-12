import { test, expect } from "@playwright/test";

test("homepage loads and shows the scaffold placeholder", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Scaffold is live." })).toBeVisible();
});
