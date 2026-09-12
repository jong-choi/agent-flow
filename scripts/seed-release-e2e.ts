import "dotenv/config";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { seedAiModels } from "../src/db/seed/ai-models";
import { seedSidebarNodes } from "../src/db/seed/sidebar-nodes";

async function main() {
  if (
    process.env.AI_PROVIDER_REPLAY !== "1" ||
    new URL(process.env.DATABASE_URL!).hostname !== "127.0.0.1"
  )
    throw Error("Local replay fixtures only");
  await seedAiModels();
  await seedSidebarNodes();
  const db = postgres(process.env.DATABASE_URL!);
  try {
    const user = "5cf2324c-1bbc-4f9c-b30e-071513cefcee";
    await db`insert into "user"(id,name,email) values(${user},'Bob Tester','bob@alice.com') on conflict(id) do nothing`;
    await db`insert into credit_accounts(user_id,balance,total_earned) values(${user},1000,1000) on conflict(user_id) do nothing`;
    const model = randomUUID(),
      workflow = randomUUID();
    await db`insert into ai_models(id,model_id,upstream_model_id,provider,name,price,is_active,lifecycle,metadata) values(${model},${model},'fixture-default','groq','Replay Model',1,true,'active','{"titlePriority":1}')`;
    await db`insert into workflows(id,title,owner_id) values(${workflow},'Release E2E workflow',${user})`;
    for (const [i, type] of ["startNode", "chatNode", "endNode"].entries())
      await db`insert into workflow_nodes(workflow_id,owner_id,node_id,type,pos_x,pos_y,label,value,target_count,source_count) values(${workflow},${user},${["start", "chat", "end"][i]},${type},${i * 240},0,${type},${type === "chatNode" ? model : null},${i === 0 ? 0 : 1},${i === 2 ? 0 : 1})`;
    for (const [source, target] of [
      ["start", "chat"],
      ["chat", "end"],
    ]) {
      const id = randomUUID();
      await db`insert into workflow_edges(id,edge_id,workflow_id,owner_id,source,target,"sourceHandle","targetHandle") values(${id},${id},${workflow},${user},${source},${target},'source','target')`;
    }
    const seller = "release-fixture-seller";
    await db`insert into "user"(id,name) values(${seller},'Fixture Seller') on conflict(id) do nothing`;
    await db`insert into presets(id,workflow_id,owner_id,title,price,is_published) values(${randomUUID()},${workflow},${seller},'Release fixture preset',0,true)`;
    console.log("Replay fixtures ready");
  } finally {
    await db.end();
  }
}
void main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
