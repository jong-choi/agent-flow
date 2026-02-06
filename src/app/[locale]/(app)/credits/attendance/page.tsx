import { AttendanceClient } from "@/features/credits/components/attendance/attendance-client";
import { getCreditAttendanceSummary } from "@/features/credits/server/queries";

export default async function AttendancePage() {
  const summary = await getCreditAttendanceSummary();

  return <AttendanceClient summary={summary} />;
}
