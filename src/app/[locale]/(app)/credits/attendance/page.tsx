import { AttendanceClient } from "@/app/[locale]/(app)/credits/attendance/_components/attendance-client";
import { getCreditAttendanceSummary } from "@/db/query/credit";

export default async function AttendancePage() {
  const summary = await getCreditAttendanceSummary();

  return <AttendanceClient summary={summary} />;
}
