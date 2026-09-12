import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { expect, test } from "@playwright/test";
import { loginWithDevPassword } from "../helpers/auth";

// Requires the local server started with scripts/testing/provider-replay.mjs.
test("billing reserves, releases failures/cancellation and replays completed turns without charging again", async ({
  page,
}) => {
  test.skip(
    process.env.AI_PROVIDER_REPLAY !== "1",
    "Explicit provider replay server required",
  );
  const sql = postgres(process.env.DATABASE_URL!);
  expect(new URL(process.env.DATABASE_URL!).hostname).toBe("127.0.0.1");
  const user = "5cf2324c-1bbc-4f9c-b30e-071513cefcee";
  const models: string[] = [],
    workflows: string[] = [],
    chats: string[] = [],
    temporary: string[] = [];
  try {
    await loginWithDevPassword(page);
    await sql`update credit_accounts set balance=1000 where user_id=${user}`;
    for (const scenario of [
      "success",
      "error",
      "empty",
      "truncated",
      "cancel",
    ]) {
      const model = randomUUID(),
        workflow = randomUUID(),
        chat = randomUUID();
      models.push(model);
      workflows.push(workflow);
      chats.push(chat);
      await sql`insert into ai_models(id,model_id,upstream_model_id,provider,name,price,is_active,lifecycle) values(${model},${model},${"fixture-" + scenario},'groq',${"Billing " + scenario},7,true,'active')`;
      if (scenario === "success")
        await sql`update ai_models set metadata=${sql.json({ titlePriority: 0 })} where id=${model}`;
      await sql`insert into workflows(id,title,owner_id) values(${workflow},'Billing E2E',${user})`;
      for (const [i, type] of ["startNode", "chatNode", "endNode"].entries())
        await sql`insert into workflow_nodes(workflow_id,owner_id,node_id,type,pos_x,pos_y,label,value,target_count,source_count) values(${workflow},${user},${["start", "chat", "end"][i]},${type},${i * 200},0,${type},${type === "chatNode" ? model : null},${i === 0 ? 0 : 1},${i === 2 ? 0 : 1})`;
      for (const [source, target] of [
        ["start", "chat"],
        ["chat", "end"],
      ]) {
        const id = randomUUID();
        await sql`insert into workflow_edges(id,edge_id,workflow_id,owner_id,source,target,"sourceHandle","targetHandle") values(${id},${id},${workflow},${user},${source},${target},'source','target')`;
      }
      await sql`insert into chats(id,user_id,workflow_id,title) values(${chat},${user},${workflow},'Billing E2E')`;
      const before = (
        await sql`select balance from credit_accounts where user_id=${user}`
      )[0].balance;
      expect(
        (
          await page.request.post(`/api/chat/persistent/${chat}`, {
            data: { message: "billing fixture" },
          })
        ).ok(),
      ).toBe(true);
      if (scenario === "cancel") {
        await page.evaluate(async (id) => {
          const controller = new AbortController();
          const response = await fetch("/api/chat/persistent/" + id, {
            signal: controller.signal,
          });
          const reader = response.body!.getReader();
          let text = "";
          const decoder = new TextDecoder();
          while (!text.includes("부분")) {
            const part = await reader.read();
            if (part.done) break;
            text += decoder.decode(part.value);
          }
          const duplicate = await fetch("/api/chat/persistent/" + id);
          const error = await duplicate.json();
          if (error.error?.code !== "invalid_request")
            throw Error("Concurrent GET was not rejected");
          const post = await fetch("/api/chat/persistent/" + id, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ message: "duplicate" }),
          });
          if ((await post.json()).error?.code !== "invalid_request")
            throw Error("Concurrent POST was not rejected");
          controller.abort();
          await reader.cancel().catch(() => {});
        }, chat);
      } else {
        const raw = await (
          await page.request.get(`/api/chat/persistent/${chat}`)
        ).text();
        if (scenario === "success") {
          expect(raw).toContain("검증 응답입니다.");
          expect(raw).not.toContain('"error"');
          const replay = await (
            await page.request.get(`/api/chat/persistent/${chat}`)
          ).text();
          expect(replay).toContain("검증 응답입니다.");
          expect(
            (
              await sql`select count(*)::int n from chat_messages where chat_id=${chat} and role='assistant'`
            )[0].n,
          ).toBe(1);
          const title = await page.request.post(
            `/api/chat/persistent/${chat}/title`,
            { data: { message: "검증 제목" } },
          );
          expect(title.ok()).toBe(true);
          expect((await title.json()).title).toContain("검증");
          const created = await page.request.post(
            "/api/chat/temporary/workflows",
            { data: { workflowId: workflow } },
          );
          expect(created.ok()).toBe(true);
          const thread = (await created.json()).data.thread_id;
          temporary.push(thread);
          expect(
            (
              await page.request.post(`/api/chat/temporary/${thread}`, {
                data: { message: "temporary fixture" },
              })
            ).ok(),
          ).toBe(true);
          for (let retry = 0; retry < 2; retry++) {
            const raw = await (
              await page.request.get(`/api/chat/temporary/${thread}`)
            ).text();
            expect(raw).toContain("검증 응답입니다.");
            expect(raw).not.toContain('"error"');
          }
          expect(
            (
              await sql`select count(*)::int n from ai_model_executions where thread_id=${thread}`
            )[0].n,
          ).toBe(1);
        } else expect(raw).toContain('"error"');
      }
      await expect
        .poll(
          async () =>
            (
              await sql`select balance from credit_accounts where user_id=${user}`
            )[0].balance,
        )
        .toBe(before - (scenario === "success" ? 14 : 0));
      const executions =
        await sql`select id,status from ai_model_executions where thread_id=${chat}`;
      expect(executions).toHaveLength(1);
      expect(executions[0].status).toBe(
        scenario === "success" ? "succeeded" : "failed",
      );
      expect(
        (
          await sql`select status from ai_execution_billing where execution_id=${executions[0].id}`
        )[0].status,
      ).toBe(scenario === "success" ? "settled" : "released");
    }
    await sql`update credit_accounts set balance=3 where user_id=${user}`;
    const created = await page.request.post("/api/chat/temporary/workflows", {
      data: { workflowId: workflows[0] },
    });
    const thread = (await created.json()).data.thread_id;
    temporary.push(thread);
    await page.request.post(`/api/chat/temporary/${thread}`, {
      data: { message: "insufficient fixture" },
    });
    expect(
      await (await page.request.get(`/api/chat/temporary/${thread}`)).text(),
    ).toContain("insufficient_credit");
    expect(
      (
        await sql`select count(*)::int n from ai_model_executions where thread_id=${thread}`
      )[0].n,
    ).toBe(0);
  } finally {
    for (const chat of [...chats, ...temporary]) {
      await sql`delete from ai_execution_billing where execution_id in (select id from ai_model_executions where thread_id=${chat})`;
      await sql`delete from ai_model_executions where thread_id=${chat}`;
      await sql`delete from chats where id=${chat}`;
    }
    for (const workflow of workflows)
      await sql`delete from workflows where id=${workflow}`;
    for (const model of models)
      await sql`delete from ai_models where id=${model}`;
    await sql`update credit_accounts set balance=1000 where user_id=${user}`;
    await sql.end();
  }
});
