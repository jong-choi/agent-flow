import { expect, test } from "@playwright/test";
import { loginWithDevPassword } from "../helpers/auth";

test.describe("Auth: /login", () => {
  test("로그인 UI가 표시된다", async ({ page }) => {
    await page.goto("/login", {
      waitUntil: "domcontentloaded",
    });

    await expect(page).toHaveURL(/\/login(?:\?.*)?$/);

    const googleLoginForm = page
      .locator("form")
      .filter({ has: page.locator('input[name="callbackUrl"]') })
      .first();
    const googleButton = googleLoginForm.getByRole("button").first();
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();

    const devPasswordInput = page.locator('input[name="password"][type="password"]');

    if (await devPasswordInput.count()) {
      await expect(devPasswordInput).toBeVisible();

      const devLoginButton = page
        .locator('form:has(input[name="password"][type="password"])')
        .first()
        .getByRole("button")
        .first();

      await expect(devLoginButton).toBeVisible();
      await expect(devLoginButton).toBeEnabled();
    } else {
      await expect(devPasswordInput).toHaveCount(0);
    }
  });

  test("Dev 로그인으로 홈으로 이동한다", async ({ page }) => {
    await loginWithDevPassword(page);
  });
});
