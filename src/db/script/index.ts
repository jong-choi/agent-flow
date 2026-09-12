import "dotenv/config";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

async function main() {
  const saver = PostgresSaver.fromConnString(process.env.DATABASE_URL!);
  try {
    await saver.setup();
    console.log("Checkpoint schema ready");
  } finally {
    await saver.end();
  }
}
void main()
  .then(() => process.exit(0))
  .catch(() => {
    console.error("Checkpoint setup failed");
    process.exit(1);
  });
