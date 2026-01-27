import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CreditsHistoryClient } from "./history-client";
import { db } from "@/db/client";
import { getCreditHistory } from "@/db/query/credit";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";

export default async function CreditsHistoryPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    notFound();
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    notFound();
  }

  const { transactions } = await getCreditHistory(user.id);

  return <CreditsHistoryClient transactions={transactions} />;
}
