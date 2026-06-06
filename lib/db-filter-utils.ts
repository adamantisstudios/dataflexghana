/** Shared filter serialization / application for /api/db and the client wrapper. */

export type DbOp = "gt" | "gte" | "lt" | "lte" | "neq";
export type DbPatternOp = "like" | "ilike";

export const OP_KEY_REGEX = /^__(gte|gt|lte|lt|neq)__(.+)$/;
export const PATTERN_KEY_REGEX = /^__(like|ilike)__(.+)$/;
export const IS_KEY_REGEX = /^__is__(.+)$/;

export function isOpFilterKey(key: string): boolean {
  return key.startsWith("__in__") || OP_KEY_REGEX.test(key) || PATTERN_KEY_REGEX.test(key) || IS_KEY_REGEX.test(key);
}

export function parseFilterKey(
  key: string,
): { type: "eq" | "in" | "op" | "pattern" | "is"; column: string; op?: DbOp | DbPatternOp; isNull?: boolean } | null {
  if (key.startsWith("__in__")) {
    return { type: "in", column: key.replace(/^__in__/, "") };
  }
  const isMatch = key.match(IS_KEY_REGEX);
  if (isMatch) {
    return { type: "is", column: isMatch[1] };
  }
  const m = key.match(OP_KEY_REGEX);
  if (m) {
    return { type: "op", column: m[2], op: m[1] as DbOp };
  }
  const patternMatch = key.match(PATTERN_KEY_REGEX);
  if (patternMatch) {
    return { type: "pattern", column: patternMatch[2], op: patternMatch[1] as DbPatternOp };
  }
  return { type: "eq", column: key };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyFiltersToSupabaseQuery(query: any, filters: Record<string, unknown>) {
  let q = query;

  for (const [k, v] of Object.entries(filters)) {
    const parsed = parseFilterKey(k);
    if (!parsed) continue;

    if (parsed.type === "in") {
      q = q.in(parsed.column, v as unknown[]);
    } else if (parsed.type === "is") {
      if (v === null || v === "null") {
        q = q.is(parsed.column, null);
      } else {
        q = q.not.is(parsed.column, null);
      }
    } else if (parsed.type === "op" && parsed.op) {
      switch (parsed.op) {
        case "gt":
          q = q.gt(parsed.column, v);
          break;
        case "gte":
          q = q.gte(parsed.column, v);
          break;
        case "lt":
          q = q.lt(parsed.column, v);
          break;
        case "lte":
          q = q.lte(parsed.column, v);
          break;
        case "neq":
          q = q.neq(parsed.column, v);
          break;
      }
    } else if (parsed.type === "pattern" && parsed.op) {
      q = parsed.op === "ilike" ? q.ilike(parsed.column, v) : q.like(parsed.column, v);
    } else {
      q = q.eq(k, v);
    }
  }

  return q;
}

export function coerceFilterValue(value: string): string | boolean | number {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value !== "" && !Number.isNaN(Number(value)) && /^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }
  return value;
}
