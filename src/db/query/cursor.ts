import { type SQL, asc, desc, sql } from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm";

/**
 * Cursor 기반 페이지네이션 공용 입력값.
 * - cursor: 현재 기준이 되는 row id
 * - dir: next/prev 방향
 * - limit: 페이지 크기
 */
export type CursorOptions = {
  cursor?: string;
  dir?: "next" | "prev";
  limit?: number;
};

type CursorDir = "next" | "prev";
type CursorSortDirection = "asc" | "desc";
type CursorValue = string | number;

type CursorSortField = {
  value: AnyColumn | SQL;
  direction: CursorSortDirection;
};

type CursorWhereField = CursorSortField & {
  cursor: CursorValue;
};

/**
 * timestamp 커서 비교용 문자열 표현으로 변환한다.
 *
 * 이유:
 * - JS Date를 그대로 바인딩하면 드라이버/타임존 처리 차이로 비교 쿼리가 실패할 수 있다.
 * - anchor 조회 시 동일 포맷 문자열로 고정해서 where cursor 비교값으로 사용한다.
 */
export const toCursorTimestamp = (value: AnyColumn | SQL) =>
  sql<string>`to_char(${value}, 'YYYY-MM-DD HH24:MI:SS.US')`;

const reverseDirection = (
  direction: CursorSortDirection,
): CursorSortDirection => (direction === "asc" ? "desc" : "asc");

const currentDirection = (
  direction: CursorSortDirection,
  dir: CursorDir,
): CursorSortDirection =>
  dir === "next" ? direction : reverseDirection(direction);

const buildBranch = (
  fields: CursorWhereField[],
  index: number,
  dir: CursorDir,
) => {
  const parts: SQL[] = [];

  for (let i = 0; i < index; i += 1) {
    parts.push(sql`${fields[i].value} = ${fields[i].cursor}`);
  }

  const compareDirection = currentDirection(fields[index].direction, dir);
  parts.push(
    compareDirection === "asc"
      ? sql`${fields[index].value} > ${fields[index].cursor}`
      : sql`${fields[index].value} < ${fields[index].cursor}`,
  );

  return parts.length === 1 ? parts[0] : sql`(${sql.join(parts, sql` and `)})`;
};

/**
 * keyset pagination용 where 절을 생성한다.
 *
 * 동작:
 * - 다중 정렬 필드 순서대로 lexicographic 비교식을 만든다.
 * - next/prev 방향에 따라 비교 연산자(>, <)를 자동 전환한다.
 *
 * 반환값:
 * - fields가 비어 있으면 undefined
 * - 있으면 SQL where fragment
 */
export const buildCursorWhere = (
  fields: CursorWhereField[],
  dir: CursorDir,
): SQL | undefined => {
  if (fields.length === 0) {
    return undefined;
  }

  const branches = fields.map((_, index) => buildBranch(fields, index, dir));
  return branches.length === 1
    ? branches[0]
    : sql`(${sql.join(branches, sql` or `)})`;
};

/**
 * keyset pagination용 orderBy 배열을 생성한다.
 *
 * 동작:
 * - 필드의 기본 정렬 방향(asc/desc)을 기준으로
 * - prev 요청 시 방향을 뒤집어서 반환한다.
 */
export const buildCursorOrderBy = (fields: CursorSortField[], dir: CursorDir) =>
  fields.map((field) => {
    const direction = currentDirection(field.direction, dir);
    return direction === "asc" ? asc(field.value) : desc(field.value);
  });
