import { expect, test } from "@playwright/test";
import { loginWithDevPassword } from "../helpers/auth";

test.describe("Developers: /developers", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithDevPassword(page);
  });

  test("서비스 키 발급/삭제 UI가 동작한다", async ({ page }) => {
    await page.goto("/developers");

    await expect(page.getByText("Developer API").first()).toBeVisible();
    await expect(page.getByText("서비스 키").first()).toBeVisible();

    const issueButton = page.getByRole("button", {
      name: "새 키 발급",
      exact: true,
    });
    await expect(issueButton).toBeVisible();
    await expect(issueButton).toBeEnabled();
    await issueButton.click();

    await expect(page.getByText("새 시크릿 키").first()).toBeVisible();
    await page.keyboard.press("Escape");

    const deleteTrigger = page
      .getByRole("button", { name: "삭제", exact: true })
      .first();

    if (await deleteTrigger.count()) {
      await expect(deleteTrigger).toBeVisible();
      await deleteTrigger.click();

      const confirmDialog = page.getByRole("alertdialog", {
        name: "시크릿 키를 삭제할까요?",
      });
      await expect(confirmDialog).toBeVisible();

      const confirmButton = confirmDialog.getByRole("button", {
        name: "삭제",
        exact: true,
      });
      await expect(confirmButton).toBeEnabled();
      await confirmButton.click();
    }
  });

  test("워크플로우 API 페이지로 이동한다", async ({ page }) => {
    await page.goto("/developers");

    const workflowApiLink = page.getByRole("link", {
      name: "워크플로우 API",
    }).first();
    await expect(workflowApiLink).toBeVisible();
    await workflowApiLink.click();

    await expect(page).toHaveURL("/developers/apis");
  });
});
