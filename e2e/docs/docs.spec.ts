import { expect, test } from "@playwright/test";
import { loginWithDevPassword } from "../helpers/auth";
import { expectNotFoundPage } from "../helpers/not-found";

test.describe("Docs: /docs", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithDevPassword(page);
  });

  test("문서 목록/검색/정렬 UI가 렌더링된다", async ({ page }) => {
    await page.goto("/docs");

    await expect(page.getByText("문서 관리").first()).toBeVisible();

    const searchInput = page.getByPlaceholder("문서 제목으로 검색");
    await expect(searchInput).toBeVisible();

    const query = `search-${Date.now()}`;
    await searchInput.fill(query);
    await page.getByRole("button", { name: "검색", exact: true }).click();

    await expect(page).toHaveURL(new RegExp(`q=${query}`));

    const emptyResult = page.getByText("검색 결과 없음").first();
    if (await emptyResult.count()) {
      await expect(emptyResult).toBeVisible();
    }

    const latestSort = page.getByRole("link", {
      name: "최신순",
    });
    await expect(latestSort).toBeVisible();
    await latestSort.click();

    await expect(page).toHaveURL(/\/docs\?.*sort=latest/);
  });

  test("문서 생성/저장/삭제 흐름이 동작한다", async ({ page }) => {
    await page.goto("/docs");

    const createButton = page.getByRole("button", { name: "새 문서" });
    await expect(createButton).toBeVisible();
    await expect(createButton).toBeEnabled();
    await createButton.click();

    await expect(page).toHaveURL(/\/docs\/.+\?edit=true/);

    const titleInput = page.getByTestId("document-title-input");
    await expect(titleInput).toBeVisible();

    const newTitle = `E2E 문서 ${Date.now()}`;
    await titleInput.fill(newTitle);

    const saveButton = page.getByRole("button", {
      name: "저장하기",
      exact: true,
    });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    await expect(page).toHaveURL(/\/docs\/[^/?]+$/);
    await expect(page.getByRole("link", { name: "목록으로" })).toBeVisible();
    await expect(page.getByRole("heading", { name: newTitle })).toBeVisible();

    const docUrl = new URL(page.url());
    const docId = docUrl.pathname.split("/").pop();
    expect(docId).toBeTruthy();

    // 하드 리프레시 없이 사이드바 이동으로 변경 반영 확인
    await page.getByRole("link", { name: "프로필" }).first().click();
    await expect(page).toHaveURL(/\/profile(?:\?.*)?$/);

    await page.getByRole("link", { name: "문서" }).first().click();
    await expect(page).toHaveURL(/\/docs(?:\?.*)?$/);
    await expect(page.getByText("문서 관리").first()).toBeVisible();

    const createdDocLink = page.locator(`a[href="/docs/${docId}"]`).first();
    await expect(createdDocLink).toBeVisible();
    await createdDocLink.click();
    await expect(page).toHaveURL(new RegExp(`/docs/${docId}$`));
    await expect(page.getByRole("heading", { name: newTitle })).toBeVisible();

    const deleteButton = page.getByRole("button", {
      name: "삭제하기",
      exact: true,
    });
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    const dialog = page.getByRole("alertdialog", {
      name: "문서를 삭제하시겠어요?",
    });
    await expect(dialog).toBeVisible();

    const confirmDelete = dialog.getByRole("button", {
      name: "삭제",
      exact: true,
    });
    await expect(confirmDelete).toBeEnabled();
    await confirmDelete.click();

    await expect(page).toHaveURL("/docs");
  });

  test("존재하지 않는 문서는 404 처리된다", async ({ page }) => {
    const missingDocId = crypto.randomUUID();
    await page.goto(`/docs/${missingDocId}`);
    await expectNotFoundPage(page);
  });
});
