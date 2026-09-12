import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { expect, test } from "@playwright/test";
import { loginWithDevPassword } from "../helpers/auth";

// Browser contract test: deterministic SSE, no live provider requests.
test("영속 채팅의 한글 스트림과 다시 열기", async ({ page }) => {
  const url = new URL(process.env.DATABASE_URL!);
  expect(url.hostname, "E2E writes must target the local development DB").toBe(
    "127.0.0.1",
  );
  const sql = postgres(process.env.DATABASE_URL!);
  const user = "5cf2324c-1bbc-4f9c-b30e-071513cefcee";
  const workflow = randomUUID();
  const chat = randomUUID();
  const answer = "순차 실행은 20분입니다.";
  try {
    await sql`insert into workflows (id,title,owner_id) values (${workflow},'E2E stream contract',${user})`;
    await sql`insert into chats (id,user_id,workflow_id,title) values (${chat},${user},${workflow},'E2E stream contract')`;
    await loginWithDevPassword(page);
    await page.route(`**/api/chat/persistent/${chat}`, async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      const events = [
        {
          type: "chatNode",
          event: "on_chat_model_start",
          langgraph_node: "chat",
        },
        ...["순차 실행은 ", "20분", "입니다."].map((content) => ({
          type: "chatNode",
          event: "on_chat_model_stream",
          langgraph_node: "chat",
          chunk: { content },
        })),
        {
          type: "chatNode",
          event: "on_chat_model_end",
          langgraph_node: "chat",
        },
        { type: "endNode", event: "on_chain_end", langgraph_node: "end" },
      ];
      await sql`insert into chat_messages (chat_id,role,content,model_messages) values (${chat},'assistant',${answer},${sql.json([{ type: "ai", data: { content: answer, additional_kwargs: { signature: "fixture-private-signature" } } }])})`;
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join(""),
      });
    });
    await page.goto(`/chat/${chat}`);
    const input = page
      .getByPlaceholder("메시지를 입력하세요...")
      .filter({ visible: true });
    await expect(input).toBeVisible();
    await input.fill("12분과 8분의 합은?");
    await page
      .getByRole("button", { name: "전송", exact: true })
      .filter({ visible: true })
      .click();
    await expect(
      page.locator("article").getByText(answer, { exact: true }),
    ).toBeVisible();
    await page.reload();
    const html = await (await page.request.get(`/chat/${chat}`)).text();
    expect(html).not.toContain("fixture-private-signature");
    await expect(
      page.locator("article").getByText(answer, { exact: true }),
    ).toBeVisible();
  } finally {
    await sql`delete from chats where id=${chat}`;
    await sql`delete from workflows where id=${workflow}`;
    await sql.end();
  }
});
