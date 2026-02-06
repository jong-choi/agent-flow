import {
  type CreditAttendanceSummary,
  getCreditAttendanceSummary,
} from "@/features/credits/server/queries";
import { claimDailyAttendance } from "@/features/credits/server/actions";

export type AttendanceResult = {
  credited: boolean;
  reward: number;
  balance: number;
  attendance: CreditAttendanceSummary;
};

export async function POST() {
  try {
    const claimResult = await claimDailyAttendance();
    const attendance = await getCreditAttendanceSummary();

    if (!claimResult.credited && claimResult.reason === "already_claimed") {
      return Response.json(
        {
          error: "이미 오늘 출석체크를 완료했습니다.",
          attendance,
          balance: claimResult.balance,
        },
        { status: 409 },
      );
    }

    return Response.json({
      credited: claimResult.credited,
      reward: claimResult.reward,
      balance: claimResult.balance,
      attendance,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "사용자 정보가 없습니다.") {
      return Response.json({ error: "인증이 필요합니다." }, { status: 401 });
    }
    console.error("POST /api/credits/attendance error:", error);
    return Response.json(
      { error: "출석 체크에 실패했습니다." },
      { status: 500 },
    );
  }
}
