import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { getCreditAttendanceSummary } from "@/db/query/credit";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { AttendanceClient } from "./attendance-client";

export default async function AttendancePage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("사용자 정보를 불러올 수 없습니다.");
  }

  const summary = await getCreditAttendanceSummary(userId);

  return <AttendanceClient summary={summary} />;
}
