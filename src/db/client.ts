import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  throw new Error("데이터베이스 URL이 존재하지 않습니다.");
}

const runtime = globalThis as typeof globalThis & {
  agentflowDatabaseClients?: Map<string, ReturnType<typeof postgres>>;
};
const clients = (runtime.agentflowDatabaseClients ??= new Map());
const url = process.env.DATABASE_URL!;
let client = clients.get(url);
if (!client) {
  client = postgres(url, {
    prepare: false,
    max: 5,
    idle_timeout: 30,
    connect_timeout: 10,
  });
  clients.set(url, client);
}
export const db = drizzle({ client });
