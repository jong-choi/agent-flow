import { expect, test } from "@playwright/test";

test.describe("Landing: /", () => {
  test("랜딩 히어로와 시작 CTA가 렌더링된다", async ({ page }) => {
    await page.goto("/");

    const homeLink = page.locator("header a[href='/']").first();
    await expect(homeLink).toBeVisible();

    const heroSection = page.locator("#hero");
    await expect(heroSection).toBeVisible();

    const startCta = heroSection.locator("a[href='/workflows/canvas']").first();
    await expect(startCta).toBeVisible();
    await startCta.click();

    await expect(page).toHaveURL(/\/(login|workflows\/canvas)(\?.*)?$/);
  });
});
