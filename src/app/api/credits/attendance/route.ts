import { apiErrorResponse, createApiError } from "@/app/api/_errors/api-error";
import { claimDailyAttendance } from "@/features/credits/server/mutations";
import {
  type CreditAttendanceSummary,
  getCreditAttendanceSummary,
} from "@/features/credits/server/queries";

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
      const errorPayload = createApiError("attendanceAlreadyClaimed", {
        message: JSON.stringify({
          reason: "already_claimed",
          attendance,
          balance: claimResult.balance,
        }),
      });
      return apiErrorResponse(errorPayload, { status: errorPayload.status });
    }

    return Response.json({
      credited: claimResult.credited,
      reward: claimResult.reward,
      balance: claimResult.balance,
      attendance,
    });
  } catch (error) {
    console.error("POST /api/credits/attendance error:", error);
    return apiErrorResponse(error);
  }
}
