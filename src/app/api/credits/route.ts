import { getCreditBalance } from "@/features/credits/server/queries";

export type CreditsBalanceResult = {
  balance: number;
};

export async function GET() {
  try {
    const balance = await getCreditBalance();
    return Response.json({ balance } satisfies CreditsBalanceResult);
  } catch (error) {
    if (error instanceof Error && error.message === "사용자 정보가 없습니다.") {
      return Response.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    console.error("GET /api/credits error:", error);
    return Response.json(
      { error: "크레딧 정보를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
