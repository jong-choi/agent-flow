import { type Page, expect } from "@playwright/test";

export async function expectNotFoundPage(page: Page) {
  await expect(page.getByText("404 Lost in Flow")).toBeVisible();
}
