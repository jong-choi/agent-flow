import "dotenv/config";
import { checkModelSchema, migrateModelSchema } from "./lib/model-release";

async function main() {
  const [command] = process.argv.slice(2);
  const url = process.env.DATABASE_URL!;
  if (command === "check") {
    console.log(JSON.stringify(await checkModelSchema(url), null, 2));
    return;
  }
  if (command === "migrate") {
    if (!process.argv.includes("--apply"))
      throw Error(
        "Use --apply; take a backup and stop writers before migration",
      );
    if (
      new URL(url).hostname !== "127.0.0.1" &&
      process.env.MODEL_SCHEMA_MIGRATION_APPROVED !== "true"
    )
      throw Error(
        "Remote migrations require MODEL_SCHEMA_MIGRATION_APPROVED=true during the approved deployment",
      );
    await migrateModelSchema(url);
    console.log("Model schema migrations applied");
    return;
  }
  throw Error("Usage: models:release check | migrate --apply");
}
void main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
