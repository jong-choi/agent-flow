import { expect, test } from "@playwright/test";
import { loginWithDevPassword } from "../helpers/auth";

test.describe("Presets", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithDevPassword(page);
  });

  test("프리셋 마켓 목록과 구매 다이얼로그가 동작한다", async ({ page }) => {
    await page.goto("/presets?page=9999");
    await expect(page).not.toHaveURL(/page=9999/);

    await expect(page.getByText("프리셋 마켓").first()).toBeVisible();

    const emptyState = page.getByText("공개된 프리셋이 없습니다").first();
    if (await emptyState.count()) {
      await expect(emptyState).toBeVisible();
      return;
    }

    const detailLink = page.getByRole("link", { name: "상세 보기" }).first();
    await expect(detailLink).toBeVisible();

    const purchaseButton = page
      .getByRole("button", { name: /구매하기|무료로 받기|이미 보유함/ })
      .first();
    await expect(purchaseButton).toBeVisible();

    if (await purchaseButton.isEnabled()) {
      await purchaseButton.click();
      await expect(page.getByText("프리셋 구매").first()).toBeVisible();
      await page.keyboard.press("Escape");
    }
  });

  test("프리셋 상세/수정 페이지가 렌더링된다", async ({ page }) => {
    await page.goto("/presets");

    const detailLink = page.getByRole("link", { name: "상세 보기" }).first();
    if (!(await detailLink.count())) {
      test.skip(true, "프리셋이 없어 상세 페이지를 확인할 수 없습니다.");
    }

    await expect(detailLink).toHaveAttribute("href", /\/presets\/.+/);
    await detailLink.press("Enter");
    await expect(page).toHaveURL(/\/presets\/.+/);

    await expect(page.getByText("가격 및 구매").first()).toBeVisible();

    const editLink = page.getByRole("link", { name: "프리셋 수정" });
    if (await editLink.count()) {
      await editLink.click();
      await expect(page.getByText("프리셋 수정").first()).toBeVisible();
      await expect(
        page.getByRole("button", { name: "프리셋 삭제" }),
      ).toBeVisible();
    }
  });

  test("프리셋 생성 플로우가 렌더링된다", async ({ page }) => {
    await page.goto("/presets/new");

    await expect(page.getByText("워크플로우 선택").first()).toBeVisible();

    const emptyWorkflow = page.getByText("워크플로우가 없습니다").first();
    if (await emptyWorkflow.count()) {
      await expect(emptyWorkflow).toBeVisible();
      return;
    }

    const workflowLink = page.locator('a[href^="/presets/new/"]').first();
    await expect(workflowLink).toBeVisible();
    await expect(workflowLink).toHaveAttribute("href", /\/presets\/new\/.+/);
    await workflowLink.click();
    await expect(page).toHaveURL(/\/presets\/new\/.+/);
    await expect(page.getByText("프리셋 정보 입력").first()).toBeVisible();

    const cancelLink = page.getByRole("link", { name: "취소" });
    await expect(cancelLink).toBeVisible();
    await cancelLink.click();

    await expect(page).toHaveURL("/presets/new");
  });

  test("내 프리셋 라이브러리가 렌더링된다", async ({ page }) => {
    await page.goto("/presets/purchased?page=9999");
    await expect(page).not.toHaveURL(/page=9999/);

    await expect(page.getByText("내 프리셋").first()).toBeVisible();

    const ownedEmpty = page.getByText("아직 만든 프리셋이 없습니다").first();
    if (await ownedEmpty.count()) {
      await expect(ownedEmpty).toBeVisible();
    }

    const purchasedEmpty = page.getByText("구매한 프리셋이 없습니다").first();
    if (await purchasedEmpty.count()) {
      await expect(purchasedEmpty).toBeVisible();
    }
  });
});
