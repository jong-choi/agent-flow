import { expect, test } from "@playwright/test";
import { loginWithDevPassword } from "../helpers/auth";

test.describe("Workflows", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithDevPassword(page);
  });

  test("워크플로우 목록과 새 워크플로우 이동이 동작한다", async ({ page }) => {
    await page.goto("/workflows");

    await expect(page.getByText("내 워크플로우").first()).toBeVisible();

    const createButton = page.getByRole("link", { name: "새 워크플로우" });
    await expect(createButton).toBeVisible();
    await createButton.click();

    await expect(page).toHaveURL("/workflows/canvas");
  });

  test("워크플로우 캔버스 기본 UI가 렌더링된다", async ({ page }) => {
    await page.goto("/workflows/canvas");

    await expect(page.getByTestId("flow-canvas")).toBeVisible();

    const startButton = page.getByRole("button", { name: "채팅하기" });
    const loadPresetButton = page.getByRole("button", {
      name: "프리셋 불러오기",
    });
    const saveButton = page.getByRole("button", { name: "저장" });

    await expect(startButton).toBeVisible();
    await expect(loadPresetButton).toBeVisible();
    await expect(saveButton).toBeVisible();

    await loadPresetButton.click();
    await expect(page.getByText("프리셋 불러오기").first()).toBeVisible();
    await page.keyboard.press("Escape");

    if (await saveButton.isEnabled()) {
      await saveButton.click();
      await expect(page.getByText("워크플로우 저장").first()).toBeVisible();
      await page.keyboard.press("Escape");
    } else {
      await expect(saveButton).toBeDisabled();
    }
  });

  test("수정 캔버스 저장 다이얼로그가 현재 워크플로우 값을 채운다", async ({
    page,
  }) => {
    await page.goto("/workflows");

    const workflowCard = page.locator('a[href^="/workflows/canvas/"]').first();
    if (!(await workflowCard.count())) {
      test.skip(
        true,
        "워크플로우가 없어 캔버스 수정 다이얼로그를 확인할 수 없습니다.",
      );
    }

    await workflowCard.press("Enter");
    await expect(page).toHaveURL(/\/workflows\/canvas\/.+/);

    const saveButton = page.getByRole("button", { name: "저장" });
    if (!(await saveButton.isEnabled())) {
      test.skip(
        true,
        "그래프가 유효하지 않아 저장 다이얼로그를 열 수 없습니다.",
      );
    }

    const headerTitle = (
      await page.getByTestId("flow-canvas").locator("h3").first().textContent()
    )?.trim();
    const headerDescription = (
      await page.getByTestId("flow-canvas").locator("p").first().textContent()
    )?.trim();
    const expectedTitle = headerTitle ?? "";
    const expectedDescription =
      headerDescription === "설명이 기재되지 않았습니다"
        ? ""
        : (headerDescription ?? "");

    await saveButton.click();
    await expect(page.getByText("워크플로우 수정 저장").first()).toBeVisible();

    const titleInput = page.locator("#workflow-dialog-title");
    const descriptionInput = page.locator("#workflow-dialog-description");

    await expect(titleInput).toHaveValue(expectedTitle);
    await expect(descriptionInput).toHaveValue(expectedDescription);

    await titleInput.fill("임시 제목");
    await descriptionInput.fill("임시 설명");
    await page.getByRole("button", { name: "닫기" }).click();

    await saveButton.click();
    await expect(titleInput).toHaveValue(expectedTitle);
    await expect(descriptionInput).toHaveValue(expectedDescription);
  });

  test("워크플로우 상세 페이지에서 캔버스로 이동한다", async ({ page }) => {
    await page.goto("/workflows");

    const workflowCard = page.locator('a[href^="/workflows/canvas/"]').first();
    if (!(await workflowCard.count())) {
      test.skip(true, "워크플로우가 없어 상세 페이지를 확인할 수 없습니다.");
    }

    await workflowCard.press("Enter");
    await expect(page).toHaveURL(/\/workflows\/canvas\/.+/);

    const workflowId = page.url().split("/workflows/canvas/")[1];
    await expect(
      page.getByRole("button", { name: "프리셋 불러오기" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "채팅하기" })).toBeVisible();
    await page.goto(`/workflows/${workflowId}`);

    await expect(page.getByRole("link", { name: "목록으로" })).toBeVisible();
    const openCanvas = page.getByRole("link", { name: "캔버스에서 열기" });
    await expect(openCanvas).toBeVisible();
    await openCanvas.click();

    await expect(page).toHaveURL(`/workflows/canvas/${workflowId}`);
  });
});
