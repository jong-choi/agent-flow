import "dotenv/config";
import { seedAiModels } from "@/db/seed/ai-models";

async function main() {
  await seedAiModels();
}

main()
  .then(() => {
    console.log("✅ AI model seed completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ AI model seed failed", err);
    process.exit(1);
  });
