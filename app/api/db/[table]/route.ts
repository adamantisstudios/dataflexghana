// app/api/db/[table]/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { applyFiltersToSupabaseQuery, coerceFilterValue, OP_KEY_REGEX, PATTERN_KEY_REGEX } from "@/lib/db-filter-utils";

type RouteContext = { params: Promise<{ table: string }> };

function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      `Missing Supabase config: ${!url ? "NEXT_PUBLIC_SUPABASE_URL " : ""}${!serviceKey ? "SUPABASE_SERVICE_ROLE_KEY" : ""}`.trim()
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function logRouteError(method: string, table: string | undefined, error: unknown) {
  console.error(`[api/db/${table ?? "?"}] ${method} failed:`, error);
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Server error";
}

function parseExtraOrder(value: string): { column: string; ascending: boolean } | null {
  const dot = value.lastIndexOf(".");
  if (dot === -1) return null;
  const column = value.slice(0, dot);
  const dir = value.slice(dot + 1);
  return { column, ascending: dir !== "desc" };
}

export async function GET(request: NextRequest, context: RouteContext) {
  let table: string | undefined;
  try {
    const resolved = await context.params;
    table = resolved.table;

    if (!table?.trim()) {
      return NextResponse.json({ message: "Missing table name" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const eqFilters: Record<string, string | boolean | number> = {};
    const inFilters: Record<string, string[]> = {};
    const opFilters: { op: "gt" | "gte" | "lt" | "lte" | "neq"; column: string; value: string }[] = [];
    const patternFilters: { op: "like" | "ilike"; column: string; value: string }[] = [];
    const isNullFilters: string[] = [];
    const isNotNullFilters: string[] = [];
    const orderClauses: { column: string; ascending: boolean }[] = [];
    let orFilter: string | null = null;
    let selectColumns = "*";
    let countMode: "exact" | "planned" | "estimated" | null = null;
    let headOnly = false;
    let limit: number | null = null;
    let offset = 0;

    searchParams.forEach((value, key) => {
      if (key === "_limit") limit = parseInt(value, 10) || null;
      else if (key === "_offset") offset = parseInt(value, 10) || 0;
      else if (key === "_orderBy") {
        const dir = searchParams.get("_orderDir");
        orderClauses.push({ column: value, ascending: dir !== "desc" });
      } else if (key === "_orderDir") return;
      else if (key === "_order") {
        const parsed = parseExtraOrder(value);
        if (parsed) orderClauses.push(parsed);
      } else if (key === "_or") orFilter = value;
      else if (key === "_select") selectColumns = value;
      else if (key === "_count") countMode = value as "exact" | "planned" | "estimated";
      else if (key === "_head") headOnly = value === "true";
      else if (key === "_columns") return;
      else if (key.endsWith(".in")) {
        const col = key.replace(/\.in$/, "");
        if (!inFilters[col]) inFilters[col] = [];
        inFilters[col].push(value);
      } else {
        const opMatch = key.match(OP_KEY_REGEX);
        if (opMatch) {
          opFilters.push({
            op: opMatch[1] as "gt" | "gte" | "lt" | "lte" | "neq",
            column: opMatch[2],
            value,
          });
        } else {
          const patternMatch = key.match(PATTERN_KEY_REGEX);
          if (patternMatch) {
            patternFilters.push({
              op: patternMatch[1] as "like" | "ilike",
              column: patternMatch[2],
              value,
            });
            return;
          }
          if (value === "is.null") {
            isNullFilters.push(key);
          } else if (value === "not.is.null") {
            isNotNullFilters.push(key);
          } else {
            eqFilters[key] = coerceFilterValue(value);
          }
        }
      }
    });

    const selectOptions: { count?: "exact" | "planned" | "estimated"; head?: boolean } = {};
    if (countMode) selectOptions.count = countMode;
    if (headOnly) selectOptions.head = true;

    let query =
      countMode || headOnly
        ? supabaseAdmin.from(table).select(selectColumns, selectOptions)
        : supabaseAdmin.from(table).select(selectColumns);

    if (orFilter) {
      query = query.or(orFilter);
    }

    Object.entries(eqFilters).forEach(([k, v]) => {
      query = query.eq(k, v);
    });

    for (const column of isNullFilters) {
      query = query.is(column, null);
    }

    for (const column of isNotNullFilters) {
      query = query.not.is(column, null);
    }

    for (const { op, column, value } of opFilters) {
      const coerced = coerceFilterValue(value);
      switch (op) {
        case "gt":
          query = query.gt(column, coerced);
          break;
        case "gte":
          query = query.gte(column, coerced);
          break;
        case "lt":
          query = query.lt(column, coerced);
          break;
        case "lte":
          query = query.lte(column, coerced);
          break;
        case "neq":
          query = query.neq(column, coerced);
          break;
      }
    }

    for (const { op, column, value } of patternFilters) {
      query = op === "ilike" ? query.ilike(column, value) : query.like(column, value);
    }

    Object.entries(inFilters).forEach(([col, vals]) => {
      query = query.in(col, vals);
    });

    for (const { column, ascending } of orderClauses) {
      query = query.order(column, { ascending });
    }

    if (limit !== null && limit > 0) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error, count } = await query;
    if (error) {
      console.error(`[api/db/${table}] GET Supabase error:`, error);
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (countMode || headOnly) {
      return NextResponse.json({ data: data ?? [], count: count ?? 0 });
    }

    return NextResponse.json(data ?? []);
  } catch (error: unknown) {
    logRouteError("GET", table, error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  let table: string | undefined;
  try {
    const resolved = await context.params;
    table = resolved.table;

    if (!table?.trim()) {
      return NextResponse.json({ message: "Missing table name" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const payload = await request.json();
    const rows = Array.isArray(payload) ? payload : [payload];
    const { data, error } = await supabaseAdmin.from(table).insert(rows).select();

    if (error) {
      console.error(`[api/db/${table}] POST Supabase error:`, error);
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    logRouteError("POST", table, error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  let table: string | undefined;
  try {
    const resolved = await context.params;
    table = resolved.table;

    if (!table?.trim()) {
      return NextResponse.json({ message: "Missing table name" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { filters, data, or, select: selectColumns } = body;

    if (!filters || !data) {
      return NextResponse.json({ message: "Missing filters or data" }, { status: 400 });
    }

    const filterKeys = Object.keys(filters as Record<string, unknown>);
    if (filterKeys.length === 0 && !or) {
      return NextResponse.json({ message: "UPDATE requires a WHERE clause" }, { status: 400 });
    }

    let query = supabaseAdmin.from(table).update(data);

    if (or) {
      query = query.or(or);
    }

    query = applyFiltersToSupabaseQuery(query, filters as Record<string, unknown>);

    const selectStr = typeof selectColumns === "string" ? selectColumns : "*";
    const { data: result, error } = await query.select(selectStr);

    if (error) {
      console.error(`[api/db/${table}] PATCH Supabase error:`, error);
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    logRouteError("PATCH", table, error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  let table: string | undefined;
  try {
    const resolved = await context.params;
    table = resolved.table;

    if (!table?.trim()) {
      return NextResponse.json({ message: "Missing table name" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { filters, or } = body;

    if (!filters) {
      return NextResponse.json({ message: "Missing filters" }, { status: 400 });
    }

    const filterKeys = Object.keys(filters as Record<string, unknown>);
    if (filterKeys.length === 0 && !or) {
      return NextResponse.json({ message: "DELETE requires a WHERE clause" }, { status: 400 });
    }

    let query = supabaseAdmin.from(table).delete();

    if (or) {
      query = query.or(or);
    }

    query = applyFiltersToSupabaseQuery(query, filters as Record<string, unknown>);

    const { error } = await query;
    if (error) {
      console.error(`[api/db/${table}] DELETE Supabase error:`, error);
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logRouteError("DELETE", table, error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}
