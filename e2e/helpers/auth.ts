import { type Page, expect, test } from "@playwright/test";

async function hasAuthenticatedSession(page: Page) {
  try {
    const response = await page.request.get("/api/auth/session");
    if (!response.ok()) return false;

    const session = (await response.json()) as { user?: unknown } | null;
    return Boolean(session?.user);
  } catch {
    return false;
  }
}

function isLoginPath(urlString: string) {
  const pathname = new URL(urlString).pathname;
  return pathname === "/login" || pathname.endsWith("/login");
}

export async function loginWithDevPassword(page: Page) {
  const password = process.env.TEST_PASSWORD;

  if (!password) {
    test.skip(true, "TEST_PASSWORD env is required for dev login.");
    return;
  }

  if (await hasAuthenticatedSession(page)) {
    return;
  }

  await page.goto("/login", {
    waitUntil: "domcontentloaded",
  });

  if (!isLoginPath(page.url()) || (await hasAuthenticatedSession(page))) {
    return;
  }

  const passwordInput = page.locator('input[name="password"][type="password"]');

  if (!(await passwordInput.isVisible())) {
    test.skip(true, "Dev login UI is disabled.");
    return;
  }

  await passwordInput.fill(password);

  const devLoginButton = page
    .locator('form:has(input[name="password"][type="password"])')
    .first()
    .getByRole("button")
    .first();

  await expect(devLoginButton).toBeEnabled();
  await devLoginButton.click({ noWaitAfter: true });

  await page.waitForURL((url) => !isLoginPath(url.href)).catch(() => null);

  await expect.poll(() => hasAuthenticatedSession(page)).toBe(true);

  if (isLoginPath(page.url())) {
    await page.goto("/", {
      waitUntil: "domcontentloaded",
    });
  }
}
