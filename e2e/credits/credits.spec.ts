import { expect, test } from "@playwright/test";
import { loginWithDevPassword } from "../helpers/auth";

test.describe("Credits", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithDevPassword(page);
  });

  test("크레딧 요약과 출석/내역 이동이 동작한다", async ({ page }) => {
    await page.goto("/credits", {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByText("크레딧").first()).toBeVisible();

    const goAttendance = page.getByRole("button", {
      name: "출석하러 가기",
      exact: true,
    });
    const doneAttendance = page.getByRole("button", {
      name: "출석 완료",
      exact: true,
    });

    if (await goAttendance.count()) {
      await expect(goAttendance).toBeVisible();
      await goAttendance.click();
      await expect(page).toHaveURL("/credits/attendance");
    } else {
      await expect(doneAttendance).toBeVisible();
      await expect(doneAttendance).toBeDisabled();
    }

    await page.goto("/credits", {
      waitUntil: "domcontentloaded",
    });
    const historyLink = page.getByRole("link", {
      name: "전체 보기",
    });
    await expect(historyLink).toBeVisible();
    await historyLink.click();

    await expect(page).toHaveURL("/credits/history");
  });

  test("출석 체크 페이지 상태가 반영된다", async ({ page }) => {
    await page.goto("/credits/attendance", {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByText("출석 체크").first()).toBeVisible();

    const checkButton = page.getByRole("button", {
      name: "출석 체크하기",
      exact: true,
    });

    if (await checkButton.count()) {
      await expect(checkButton).toBeEnabled();
      await checkButton.click();
      await expect(page.getByText("출석 완료!").first()).toBeVisible();
    } else {
      await expect(page.getByText("출석 완료!").first()).toBeVisible();
    }
  });

  test("크레딧 내역 필터가 반영된다", async ({ page }) => {
    await page.goto("/credits/history?type=earn", {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByText("크레딧 내역").first()).toBeVisible();
    await expect(page.getByText("유형: 획득").first()).toBeVisible();

    const empty = page.getByText("해당하는 내역이 없습니다.").first();
    if (await empty.count()) {
      await expect(empty).toBeVisible();
    }
  });
});
