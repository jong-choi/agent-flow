import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  throw new Error("데이터베이스 URL이 존재하지 않습니다.");
}

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
export const db = drizzle({ client });
