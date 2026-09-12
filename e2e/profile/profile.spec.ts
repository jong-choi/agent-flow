import { expect, test } from "@playwright/test";
import { loginWithDevPassword } from "../helpers/auth";

test.describe("Profile: /profile", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithDevPassword(page);
  });

  test("프로필 정보 수정이 가능하다", async ({ page }) => {
    await page.goto("/profile");

    await expect(page.getByText("프로필 설정").first()).toBeVisible();

    const avatarHashInput = page.locator('input[name="avatarHash"]');
    const beforeHash = await avatarHashInput.inputValue();

    const avatarTrigger = page.getByTestId("profile-avatar-trigger");
    await expect(avatarTrigger).toBeVisible();
    await avatarTrigger.click();

    await expect(avatarHashInput).not.toHaveValue(beforeHash);

    const nameInput = page.getByPlaceholder("닉네임을 입력하세요");
    await expect(nameInput).toBeVisible();

    const newName = `playwright-${Date.now()}`;
    await nameInput.fill(newName);

    await expect(page.getByText("사용 가능한 닉네임입니다.").first()).toBeVisible();

    const saveButton = page.getByRole("button", { name: "변경 저장" });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    await expect(page.getByText("닉네임이 변경되었습니다.").first()).toBeVisible();

    // 하드 리프레시 없이 사이드바 이동으로 변경 반영 확인
    await page.getByRole("link", { name: "문서" }).first().click();
    await expect(page).toHaveURL(/\/docs/);

    await page.getByRole("link", { name: "프로필" }).first().click();
    await expect(page).toHaveURL(/\/profile/);
    await expect(nameInput).toHaveValue(newName);
  });
});
