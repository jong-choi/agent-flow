import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { expect, test } from "@playwright/test";
import { loginWithDevPassword } from "../helpers/auth";

test("retired models block execution before calls and can be replaced across a saved workflow", async ({
  page,
}) => {
  expect(new URL(process.env.DATABASE_URL!).hostname).toBe("127.0.0.1");
  const sql = postgres(process.env.DATABASE_URL!);
  const user = "5cf2324c-1bbc-4f9c-b30e-071513cefcee",
    old = randomUUID(),
    replacement = randomUUID(),
    workflow = randomUUID(),
    chat = randomUUID();
  const legacy = `retired-${old}`;
  try {
    await sql`insert into ai_models(id,model_id,upstream_model_id,provider,name,price,is_active,lifecycle) values(${replacement},${`target-${replacement}`},${`target-${replacement}`},'groq','Replacement E2E',3,true,'active')`;
    await sql`insert into ai_models(id,model_id,upstream_model_id,provider,name,price,is_active,lifecycle,replacement_model_id,retirement_reason) values(${old},${legacy},${legacy},'groq','Retired E2E',7,false,'retired',${replacement},'Provider retirement confirmed')`;
    await sql`insert into workflows(id,title,owner_id) values(${workflow},'Retirement E2E',${user})`;
    for (const [i, type] of [
      "startNode",
      "chatNode",
      "chatNode",
      "endNode",
    ].entries())
      await sql`insert into workflow_nodes(workflow_id,owner_id,node_id,type,pos_x,pos_y,label,value,target_count,source_count) values(${workflow},${user},${String(i)},${type},${i * 280},0,${type},${type === "chatNode" ? (i === 1 ? legacy : old) : null},${i === 0 ? 0 : 1},${i === 3 ? 0 : 1})`;
    for (let i = 0; i < 3; i++) {
      const id = randomUUID();
      await sql`insert into workflow_edges(id,edge_id,workflow_id,owner_id,source,target,"sourceHandle","targetHandle") values(${id},${id},${workflow},${user},${String(i)},${String(i + 1)},'source','target')`;
    }
    const edges =
      await sql`select source,target,"sourceHandle","targetHandle" from workflow_edges where workflow_id=${workflow} order by source`;
    await sql`insert into chats(id,user_id,workflow_id,title) values(${chat},${user},${workflow},'Retirement E2E')`;
    await loginWithDevPassword(page);
    const posted = await page.request.post(`/api/chat/persistent/${chat}`, {
      data: { message: "should not call any model" },
    });
    expect(posted.ok()).toBe(true);
    const stream = await page.request.get(`/api/chat/persistent/${chat}`);
    const raw = await stream.text();
    expect(raw).toContain('"code":"invalid_model"');
    expect(raw).not.toContain('"on_chat_model_start"');
    expect(
      (
        await sql`select count(*)::int n from ai_model_executions where thread_id=${chat}`
      )[0].n,
    ).toBe(0);
    await page.goto(`/workflows/canvas/${workflow}`);
    const source = page
      .getByTestId("model-replacement")
      .filter({ visible: true })
      .first();
    await expect(source).toBeVisible();
    await source
      .getByRole("button", { name: "이 워크플로우에서 모두 변경", exact: true })
      .click();
    for (const id of ["1", "2"])
      await expect(
        page
          .locator(`.react-flow__node[data-id="${id}"]`)
          .getByTestId("model-selector"),
      ).toContainText("Replacement E2E");
    await page
      .getByTestId("flow-canvas")
      .getByRole("button", { name: "저장", exact: true })
      .click();
    const dialog = page.getByRole("dialog", { name: "워크플로우 수정 저장" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "수정", exact: true }).click();
    await expect
      .poll(async () =>
        (
          await sql`select value from workflow_nodes where workflow_id=${workflow} and type='chatNode' order by node_id`
        ).map((n) => n.value),
      )
      .toEqual([replacement, replacement]);
    expect([
      ...(await sql`select source,target,"sourceHandle","targetHandle" from workflow_edges where workflow_id=${workflow} order by source`),
    ]).toEqual([...edges]);
    await page.reload();
    await expect(
      page
        .locator('.react-flow__node[data-id="1"]')
        .getByTestId("model-selector"),
    ).toContainText("Replacement E2E");
  } finally {
    await sql`delete from chats where id=${chat}`;
    await sql`delete from workflows where id=${workflow}`;
    await sql`delete from ai_models where id in (${old},${replacement})`;
    await sql.end();
  }
});
