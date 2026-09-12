import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { expect, test } from "@playwright/test";
import { loginWithDevPassword } from "../helpers/auth";

test("model cards preserve legacy references and reflect operator price/status updates", async ({
  page,
}) => {
  expect(new URL(process.env.DATABASE_URL!).hostname).toBe("127.0.0.1");
  const sql = postgres(process.env.DATABASE_URL!);
  const user = "5cf2324c-1bbc-4f9c-b30e-071513cefcee";
  const model = randomUUID(),
    workflow = randomUUID(),
    chat = randomUUID();
  const alias = `registry-e2e-${model}`;
  try {
    await sql`insert into ai_models (id,model_id,upstream_model_id,provider,name,price,is_active,lifecycle,app_max_output_tokens,context_window) values (${model},${alias},${alias},'groq','Registry E2E Model',7,true,'active',1024,131072)`;
    await sql`insert into workflows (id,title,owner_id) values (${workflow},'Registry E2E workflow',${user})`;
    for (const [i, type] of ["startNode", "chatNode", "endNode"].entries())
      await sql`insert into workflow_nodes (workflow_id,owner_id,node_id,type,pos_x,pos_y,label,value,target_count,source_count) values (${workflow},${user},${["start", "chat", "end"][i]},${type},${i * 280},0,${type},${type === "chatNode" ? alias : null},${i === 0 ? 0 : 1},${i === 2 ? 0 : 1})`;
    for (const [source, target] of [
      ["start", "chat"],
      ["chat", "end"],
    ]) {
      const id = randomUUID();
      await sql`insert into workflow_edges (id,edge_id,workflow_id,owner_id,source,target,"sourceHandle","targetHandle") values (${id},${id},${workflow},${user},${source},${target},'source','target')`;
    }
    await sql`insert into chats (id,user_id,workflow_id,title) values (${chat},${user},${workflow},'Registry E2E chat')`;
    await loginWithDevPassword(page);
    await page.goto(`/workflows/canvas/${workflow}`);
    const card = page
      .getByTestId("model-card")
      .filter({ visible: true })
      .first();
    await expect(card).toContainText("7 크레딧");
    await expect(card).toContainText("8,000");
    await expect(
      page.getByTestId("model-selector").filter({ visible: true }).first(),
    ).toContainText("Registry E2E Model");
    await sql`update ai_models set price=9, name='Updated Registry Model', updated_at=now() where id=${model}`;
    await page.reload();
    await expect(card).toContainText("9 크레딧");
    await expect(
      page.getByTestId("model-selector").filter({ visible: true }).first(),
    ).toContainText("Updated Registry Model");
    await sql`update ai_models set lifecycle='retired', is_active=false where id=${model}`;
    await page.reload();
    await expect(card).toContainText("은퇴한 모델");
    const selector = page
      .getByTestId("model-selector")
      .filter({ visible: true })
      .first();
    await selector.getByRole("combobox").click();
    await expect(
      page.getByRole("option", { name: /Updated Registry Model/ }),
    ).toHaveAttribute("data-disabled", "");
    await page.keyboard.press("Escape");
    await page.goto(`/chat/${chat}`);
    await expect(
      page.getByText("모델 또는 가격 확인 필요").filter({ visible: true }),
    ).toBeVisible();
    const [node] =
      await sql`select value from workflow_nodes where workflow_id=${workflow} and type='chatNode'`;
    expect(node.value).toBe(alias); // Reading a legacy workflow never silently rewrites it.
    await sql`delete from ai_models where id=${model}`;
    await page.goto(`/workflows/canvas/${workflow}`);
    await expect(card).toContainText("알 수 없는 모델");
    await expect(card).toContainText("가격 확인 필요");
  } finally {
    await sql`delete from chats where id=${chat}`;
    await sql`delete from workflows where id=${workflow}`;
    await sql`delete from ai_models where id=${model}`;
    await sql.end();
  }
});
