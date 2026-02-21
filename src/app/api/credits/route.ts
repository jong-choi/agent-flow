import { connection } from "next/server";
import { apiErrorResponse } from "@/app/api/_errors/api-error";
import { getCreditBalance } from "@/features/credits/server/queries";

export type CreditsBalanceResult = {
  balance: number;
};

export async function GET() {
  await connection();

  try {
    const balance = await getCreditBalance();
    return Response.json({ balance } satisfies CreditsBalanceResult);
  } catch (error) {
    console.error("GET /api/credits error:", error);
    return apiErrorResponse(error);
  }
}
