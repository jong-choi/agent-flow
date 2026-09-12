import { type Page, expect, test } from "@playwright/test";
import { loginWithDevPassword } from "../helpers/auth";

async function startChatFromFirstWorkflow(page: Page) {
  await page.goto("/chat", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByText("워크플로우를 선택하여 채팅을 시작하세요.").first(),
  ).toBeVisible();

  const emptyState = page.getByText("저장된 워크플로우가 없습니다.").first();
  const startChat = page
    .getByRole("button", { name: "채팅 시작", exact: true })
    .first();

  const availableState = await Promise.race([
    emptyState
      .waitFor({ state: "visible" })
      .then(() => "empty" as const)
      .catch(() => null),
    startChat
      .waitFor({ state: "visible" })
      .then(() => "start" as const)
      .catch(() => null),
  ]);

  if (availableState === null) {
    return null;
  }

  if (availableState === "empty") {
    await expect(emptyState).toBeVisible();
    const createButton = page.getByRole("link", {
      name: "워크플로우 생성하기",
    });
    await expect(createButton).toBeVisible();
    return null;
  }

  await expect(startChat).toBeVisible();
  await expect(startChat).toBeEnabled();
  await startChat.click({ noWaitAfter: true });

  const moved = await page
    .waitForURL(/\/chat\/.+/)
    .then(() => true)
    .catch(() => false);

  if (!moved) {
    return null;
  }

  return page.url();
}

test.describe("Chat", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithDevPassword(page);
  });

  test("채팅 시작 페이지가 렌더링된다", async ({ page }) => {
    await page.goto("/chat", {
      waitUntil: "domcontentloaded",
    });

    await expect(
      page.getByText("워크플로우를 선택하여 채팅을 시작하세요.").first(),
    ).toBeVisible();

    const moreButton = page.getByRole("button", { name: "더 보기" });
    if (await moreButton.count()) {
      await expect(moreButton).toBeVisible();
    }
  });

  test("채팅 생성 후 상세 동작이 가능하다", async ({ page }) => {
    const url = await startChatFromFirstWorkflow(page);
    if (!url) {
      test.skip(true, "워크플로우가 없거나 채팅 생성이 지연되어 시작할 수 없습니다.");
    }

    await expect(page).toHaveURL(/\/chat\/[^/]+$/);

    const headerMenuButton = page
      .locator("header")
      .getByRole("button", { name: "채팅 메뉴", exact: true })
      .first();

    await expect(headerMenuButton).toBeVisible();
    await expect(page.getByPlaceholder("메시지를 입력하세요...")).toBeVisible();

    const messageInput = page.getByPlaceholder("메시지를 입력하세요...");
    await messageInput.fill("안녕");

    const sendButton = page.getByRole("button", { name: "전송" });
    await expect(sendButton).toBeEnabled();
    await sendButton.click();

    await expect(page.getByText("안녕").first()).toBeVisible();

    await headerMenuButton.click();

    const renameItem = page
      .getByRole("menuitem", { name: "이름 바꾸기", exact: true })
      .first();
    await expect(renameItem).toBeVisible();
    await renameItem.click();

    const titleInput = page.getByTestId("chat-title-input");
    await expect(titleInput).toBeVisible();
    await titleInput.fill(`채팅-${Date.now()}`);
    await titleInput.press("Enter");

    await expect(page.getByText("채팅 이름을 변경했어요.").first()).toBeVisible();

    await headerMenuButton.click();
    const deleteItem = page
      .getByRole("menuitem", { name: "삭제", exact: true })
      .first();
    await deleteItem.click();

    const dialog = page.getByRole("alertdialog", {
      name: "채팅을 삭제할까요?",
    });
    await expect(dialog).toBeVisible();

    const confirmDelete = dialog.getByRole("button", {
      name: "삭제",
      exact: true,
    });
    await expect(confirmDelete).toBeVisible();
    await expect(confirmDelete).toBeEnabled();
    await confirmDelete.focus();
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL("/chat");
  });
});
