import "dotenv/config";
import { seedAiModels } from "@/db/seed/ai-models";
import { seedSidebarNodes } from "@/db/seed/sidebar-nodes";

async function main() {
  await seedAiModels();
  await seedSidebarNodes();
}

main()
  .then(() => {
    console.log("✅ Seed completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Seed failed", err);
    process.exit(1);
  });
