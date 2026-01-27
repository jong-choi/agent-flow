import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  claimDailyAttendance,
  getCreditAttendanceSummary,
} from "@/db/query/credit";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function POST() {
  try {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
      return Response.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return Response.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 401 },
      );
    }

    const claimResult = await claimDailyAttendance(user.id);
    const attendance = await getCreditAttendanceSummary(user.id);

    return Response.json({
      credited: claimResult.credited,
      reward: claimResult.reward,
      balance: claimResult.balance,
      attendance,
    });
  } catch (error) {
    console.error("POST /api/credits/attendance error:", error);
    return Response.json(
      { error: "출석 체크에 실패했습니다." },
      { status: 500 },
    );
  }
}
