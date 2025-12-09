import { expect, test } from "@playwright/test";

test("Basic auth", async ({ page }) => {
  if (!process.env.TEST_PASSWORD) {
    throw new TypeError("Missing TEST_PASSWORD env");
  }

  await test.step("로그인 후 홈 페이지로 이동한다", async () => {
    await page.goto("http://localhost:3000/login");
    await page.getByPlaceholder("password").fill(process.env.TEST_PASSWORD!);
    await page.getByRole("button", { name: "Dev password로 로그인" }).click();
    await page.waitForURL("http://localhost:3000");
    await expect(page).toHaveURL("http://localhost:3000");
  });

  await test.step("로그인 후 로그인 페이지에 접속시 홈으로 리다이렉트 된다", async () => {
    await page.goto("http://localhost:3000/login");
    await expect(page).toHaveURL("http://localhost:3000");
  });

  await test.step("로그아웃을 하면 로그인 페이지로 리다이렉트 된다", async () => {
    await page.goto("http://localhost:3000");
    await page.getByRole("button", { name: "로그아웃" }).click();
    await page.waitForURL("http://localhost:3000/login");
    await expect(page).toHaveURL("http://localhost:3000/login");
  });
});
