import { expect, test } from "@playwright/test";

test("Basic auth", async ({ page }) => {
  if (!process.env.TEST_PASSWORD) {
    throw new TypeError("Missing TEST_PASSWORD env");
  }

  await test.step("로그인 후 홈 페이지로 이동한다", async () => {
    await page.goto("/login");
    await page.getByPlaceholder("password").fill(process.env.TEST_PASSWORD!);
    await page.getByRole("button", { name: "Dev password로 로그인" }).click();
    await expect(page).toHaveURL("/");
  });

  await test.step("로그인 후 로그인 페이지에 접속시 홈으로 리다이렉트 된다", async () => {
    await page.goto("/login");
    await expect(page).toHaveURL("/");
  });

  await test.step("로그아웃을 하면 로그인 페이지로 리다이렉트 된다", async () => {
    await page.goto("/");

    const trigger = page.getByTestId("user-menu-trigger");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await page.getByTestId("user-signout-button").click();
    await expect(page).toHaveURL("/login");
  });
});
