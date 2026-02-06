import { expect, test } from "@playwright/test";
import { loginWithDevPassword } from "../helpers/auth";

test.describe("Developers: /developers/apis", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithDevPassword(page);
  });

  test("워크플로우 API 목록과 다이얼로그가 렌더링된다", async ({ page }) => {
    await page.goto("/developers/apis");

    await expect(page.getByText("워크플로우 API").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "서비스 키 관리" })).toBeVisible();

    const emptyCard = page.getByText("워크플로우가 없습니다").first();
    if (await emptyCard.count()) {
      await expect(emptyCard).toBeVisible();
      return;
    }

    const apiCardTrigger = page.getByText("API 코드 보기").first();
    await expect(apiCardTrigger).toBeVisible();
    await apiCardTrigger.click();

    await expect(page.getByText("X-CANVAS-ID").first()).toBeVisible();

    const rotateButton = page.getByRole("button", {
      name: "재발급",
      exact: true,
    });
    await expect(rotateButton).toBeVisible();

    const revokeButton = page.getByRole("button", {
      name: "비활성화",
      exact: true,
    });
    await expect(revokeButton).toBeVisible();
  });
});
