import { connection } from "next/server";
import { asc, ilike } from "drizzle-orm";
import { db } from "@/db/client";
import { presetTags } from "@/db/schema/presets";

const MAX_RESULTS = 12;

export async function GET(request: Request) {
  await connection();

  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("query") ?? "").trim();

    if (!query) {
      return Response.json({ tags: [] });
    }

    const pattern = `%${query}%`;
    const rows = await db
      .select({ tag: presetTags.tag })
      .from(presetTags)
      .where(ilike(presetTags.tag, pattern))
      .groupBy(presetTags.tag)
      .orderBy(asc(presetTags.tag))
      .limit(MAX_RESULTS);

    return Response.json({ tags: rows.map((row) => row.tag) });
  } catch (error) {
    console.error("프리셋 태그 검색 실패:", error);
    return Response.json(
      { error: "프리셋 태그 검색에 실패했습니다." },
      { status: 500 },
    );
  }
}
