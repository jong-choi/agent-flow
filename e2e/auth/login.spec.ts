import { expect, test } from "@playwright/test";
import { loginWithDevPassword } from "../helpers/auth";

test.describe("Auth: /login", () => {
  test("로그인 UI가 표시된다", async ({ page }) => {
    await page.goto("/login", {
      waitUntil: "domcontentloaded",
    });

    const googleButton = page.getByRole("button", {
      name: "Google 계정으로 계속하기",
      exact: true,
    });
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();

    const devLoginButton = page.getByRole("button", {
      name: "Dev password로 로그인",
      exact: true,
    });

    if (await devLoginButton.count()) {
      const devPasswordInput = page.getByPlaceholder("password");
      await expect(devPasswordInput).toBeVisible();
      await expect(devLoginButton).toBeVisible();
    } else {
      await expect(devLoginButton).toHaveCount(0);
    }
  });

  test("Dev 로그인으로 홈으로 이동한다", async ({ page }) => {
    await loginWithDevPassword(page);
  });
});
