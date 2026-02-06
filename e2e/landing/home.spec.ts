import { expect, test } from "@playwright/test";

test.describe("Landing: /", () => {
  test("랜딩 섹션과 로그인 CTA가 렌더링된다", async ({ page }) => {
    await page.goto("/");

    const brandLabel = page.getByText("AGENTFLOW").first();
    await expect(brandLabel).toBeVisible();

    const loginCta = page.getByRole("link", { name: "로그인" });
    await expect(loginCta).toBeVisible();
    await loginCta.click();

    await expect(page).toHaveURL("/login");
  });
});
