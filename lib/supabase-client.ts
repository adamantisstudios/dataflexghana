// lib/supabase-client.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isOpFilterKey, OP_KEY_REGEX } from "@/lib/db-filter-utils";

function resolveApiUrl(path: string): string {
  if (path.startsWith("http")) return path;
  if (typeof window !== "undefined") return path;
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return `${base.replace(/\/$/, "")}${path}`;
}

type Filters = Record<string, unknown>;

function cloneFilters(filters: Filters): Filters {
  return { ...filters };
}

function appendFiltersToParams(params: URLSearchParams, filters: Filters, orFilter?: string) {
  if (orFilter) params.set("_or", orFilter);

  Object.entries(filters).forEach(([k, v]) => {
    if (!isOpFilterKey(k)) {
      params.append(k, String(v));
    }
  });

  Object.entries(filters).forEach(([k, v]) => {
    if (OP_KEY_REGEX.test(k)) {
      params.append(k, String(v));
    }
  });

  Object.entries(filters).forEach(([k, v]) => {
    if (k.startsWith("__in__")) {
      const column = k.replace(/^__in__/, "");
      (v as unknown[]).forEach((val) => {
        params.append(`${column}.in`, String(val));
      });
    }
  });

  Object.entries(filters).forEach(([k, v]) => {
    if (k.startsWith("__is__")) {
      const column = k.replace(/^__is__/, "");
      params.set(column, v === null || v === "null" ? "is.null" : "not.is.null");
    }
  });
}

type FilterableBuilder = {
  filters: Filters;
  orFilter?: string;
};

function mixinFilters<T extends FilterableBuilder>(builder: T): T & {
  eq: (column: string, value: unknown) => T;
  in: (column: string, values: unknown[]) => T;
  is: (column: string, value: unknown) => T;
  gt: (column: string, value: unknown) => T;
  gte: (column: string, value: unknown) => T;
  lt: (column: string, value: unknown) => T;
  lte: (column: string, value: unknown) => T;
  neq: (column: string, value: unknown) => T;
  or: (queryString: string) => T;
  not: (column: string, operator: string, value: unknown) => T;
  like: (column: string, value: unknown) => T;
  ilike: (column: string, value: unknown) => T;
} {
  const b = builder as T & FilterableBuilder;
  return Object.assign(builder, {
    eq(column: string, value: unknown) {
      b.filters[column] = value;
      return builder;
    },
    in(column: string, values: unknown[]) {
      b.filters[`__in__${column}`] = values;
      return builder;
    },
    is(column: string, value: unknown) {
      b.filters[`__is__${column}`] = value;
      return builder;
    },
    gt(column: string, value: unknown) {
      b.filters[`__gt__${column}`] = value;
      return builder;
    },
    gte(column: string, value: unknown) {
      b.filters[`__gte__${column}`] = value;
      return builder;
    },
    lt(column: string, value: unknown) {
      b.filters[`__lt__${column}`] = value;
      return builder;
    },
    lte(column: string, value: unknown) {
      b.filters[`__lte__${column}`] = value;
      return builder;
    },
    neq(column: string, value: unknown) {
      b.filters[`__neq__${column}`] = value;
      return builder;
    },
    or(queryString: string) {
      b.orFilter = queryString;
      return builder;
    },
    not(column: string, operator: string, value: unknown) {
      if (operator === "is") {
        b.filters[`__is__${column}`] = value === null ? "not-null" : value;
      } else if (operator === "eq") {
        b.filters[`__neq__${column}`] = value;
      }
      return builder;
    },
    like(column: string, value: unknown) {
      b.filters[`__like__${column}`] = value;
      return builder;
    },
    ilike(column: string, value: unknown) {
      b.filters[`__ilike__${column}`] = value;
      return builder;
    },
  });
}

let storageRpcClient: SupabaseClient | null = null;

function getStorageRpcClient(): SupabaseClient {
  if (typeof window === "undefined") {
    throw new Error("supabase.storage/rpc is only available in the browser");
  }
  if (!storageRpcClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    storageRpcClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return storageRpcClient;
}

const authStub = {
  getSession: () =>
    Promise.resolve({ data: { session: null }, error: null }),
  signOut: () => Promise.resolve({ error: null }),
  refreshSession: () =>
    Promise.resolve({ data: { session: null }, error: null }),
  getUser: () =>
    Promise.resolve({ data: { user: null }, error: null }),
  onAuthStateChange: (_callback: unknown) => ({
    data: { subscription: { unsubscribe: () => {} } },
  }),
};

type SupabaseError = { message: string; status?: number; code?: string } | null;

type QueryResult = { data: any; error: SupabaseError; count?: number | null };

/** Ensures builder chains support `.then().catch()` like native Promises. */
function chainPromise<T extends QueryResult>(
  run: () => Promise<T>,
  fallback: (err: unknown) => T,
): Promise<T> {
  const promise = run()
  if (promise && typeof (promise as Promise<T>).then === "function") {
    return promise.catch((err) => fallback(err))
  }
  return Promise.resolve(fallback(new Error("Query did not return a promise")))
}

function parseMutationResponse(
  data: unknown,
  opts: { single: boolean; maybeSingle: boolean }
): { data: unknown; error: SupabaseError } {
  const rows = Array.isArray(data) ? data : data != null ? [data] : [];
  if (opts.maybeSingle) {
    return { data: rows[0] ?? null, error: null };
  }
  if (opts.single) {
    if (rows.length === 0) {
      return {
        data: null,
        error: { message: "JSON object requested, multiple (or no) rows returned", code: "PGRST116" },
      };
    }
    if (rows.length > 1) {
      return {
        data: null,
        error: { message: "JSON object requested, multiple (or no) rows returned", code: "PGRST116" },
      };
    }
    return { data: rows[0], error: null };
  }
  return { data, error: null };
}

class DeleteBuilder {
  readonly [Symbol.toStringTag] = "Promise";
  filters: Filters = {};
  orFilter?: string;
  declare eq: (column: string, value: unknown) => this;
  declare in: (column: string, values: unknown[]) => this;
  declare is: (column: string, value: unknown) => this;
  declare gt: (column: string, value: unknown) => this;
  declare gte: (column: string, value: unknown) => this;
  declare lt: (column: string, value: unknown) => this;
  declare lte: (column: string, value: unknown) => this;
  declare neq: (column: string, value: unknown) => this;
  declare or: (queryString: string) => this;
  declare not: (column: string, operator: string, value: unknown) => this;
  declare like: (column: string, value: unknown) => this;
  declare ilike: (column: string, value: unknown) => this;

  constructor(private table: string) {
    mixinFilters(this);
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    resolve?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    reject?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return chainPromise(
      () => this._execute(),
      (err) => ({ data: null, error: { message: String(err) } }),
    ).then(resolve, reject)
  }

  catch<TResult = never>(
    reject?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ): Promise<QueryResult | TResult> {
    return chainPromise(
      () => this._execute(),
      (err) => ({ data: null, error: { message: String(err) } }),
    ).catch(reject)
  }

  finally(onFinally?: (() => void) | null): Promise<QueryResult> {
    return chainPromise(
      () => this._execute(),
      (err) => ({ data: null, error: { message: String(err) } }),
    ).finally(onFinally ?? undefined)
  }

  private async _execute(): Promise<QueryResult> {
    const body: Record<string, unknown> = { filters: this.filters };
    if (this.orFilter) body.or = this.orFilter;

    const res = await fetch(resolveApiUrl(`/api/db/${this.table}`), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Delete failed" }));
      return { data: null, error: { message: err.message || "Delete failed", status: res.status } };
    }

    const data = await res.json();
    return { data, error: null };
  }
}

class UpdateBuilder {
  readonly [Symbol.toStringTag] = "Promise";
  filters: Filters = {};
  orFilter?: string;
  declare eq: (column: string, value: unknown) => this;
  declare in: (column: string, values: unknown[]) => this;
  declare is: (column: string, value: unknown) => this;
  declare gt: (column: string, value: unknown) => this;
  declare gte: (column: string, value: unknown) => this;
  declare lt: (column: string, value: unknown) => this;
  declare lte: (column: string, value: unknown) => this;
  declare neq: (column: string, value: unknown) => this;
  declare or: (queryString: string) => this;
  declare not: (column: string, operator: string, value: unknown) => this;
  declare like: (column: string, value: unknown) => this;
  declare ilike: (column: string, value: unknown) => this;
  private selectColumns?: string;
  private _single = false;
  private _maybeSingle = false;

  constructor(
    private table: string,
    private updateData: Record<string, unknown>
  ) {
    mixinFilters(this);
  }

  select(columns = "*") {
    this.selectColumns = columns;
    return this;
  }

  single() {
    this._single = true;
    return this;
  }

  maybeSingle() {
    this._maybeSingle = true;
    return this;
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    resolve?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    reject?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return chainPromise(
      () => this._execute(),
      (err) => ({ data: null, error: { message: String(err) } }),
    ).then(resolve, reject)
  }

  catch<TResult = never>(
    reject?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ): Promise<QueryResult | TResult> {
    return chainPromise(
      () => this._execute(),
      (err) => ({ data: null, error: { message: String(err) } }),
    ).catch(reject)
  }

  finally(onFinally?: (() => void) | null): Promise<QueryResult> {
    return chainPromise(
      () => this._execute(),
      (err) => ({ data: null, error: { message: String(err) } }),
    ).finally(onFinally ?? undefined)
  }

  private async _execute(): Promise<QueryResult> {
    const body: Record<string, unknown> = {
      filters: this.filters,
      data: this.updateData,
    };
    if (this.orFilter) body.or = this.orFilter;
    if (this.selectColumns) body.select = this.selectColumns;

    const res = await fetch(resolveApiUrl(`/api/db/${this.table}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Update failed" }));
      return { data: null, error: { message: err.message || "Update failed", status: res.status } };
    }

    const data = await res.json();
    return parseMutationResponse(data, { single: this._single, maybeSingle: this._maybeSingle });
  }
}

class InsertBuilder {
  readonly [Symbol.toStringTag] = "Promise";
  private selectColumns?: string;
  private _single = false;
  private _maybeSingle = false;

  constructor(
    private table: string,
    private payload: unknown
  ) {}

  select(columns = "*") {
    this.selectColumns = columns;
    return this;
  }

  single() {
    this._single = true;
    return this;
  }

  maybeSingle() {
    this._maybeSingle = true;
    return this;
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    resolve?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    reject?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return chainPromise(
      () => this._execute(),
      (err) => ({ data: null, error: { message: String(err) } }),
    ).then(resolve, reject)
  }

  catch<TResult = never>(
    reject?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ): Promise<QueryResult | TResult> {
    return chainPromise(
      () => this._execute(),
      (err) => ({ data: null, error: { message: String(err) } }),
    ).catch(reject)
  }

  finally(onFinally?: (() => void) | null): Promise<QueryResult> {
    return chainPromise(
      () => this._execute(),
      (err) => ({ data: null, error: { message: String(err) } }),
    ).finally(onFinally ?? undefined)
  }

  private async _execute(): Promise<QueryResult> {
    const body =
      this.payload && typeof this.payload === "object" && !Array.isArray(this.payload)
        ? { ...(this.payload as Record<string, unknown>) }
        : this.payload;

    const res = await fetch(resolveApiUrl(`/api/db/${this.table}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Insert failed" }));
      return { data: null, error: { message: err.message || "Insert failed", status: res.status } };
    }

    const data = await res.json();
    return parseMutationResponse(data, { single: this._single, maybeSingle: this._maybeSingle });
  }
}

function parseGetResponse(
  json: unknown,
  opts: { single: boolean; maybeSingle: boolean; headOnly: boolean; wantsCount: boolean }
): { data: any; error: SupabaseError; count: number | null } {
  if (json !== null && typeof json === "object" && !Array.isArray(json) && "data" in json) {
    const payload = json as { data: unknown; count?: number | null; message?: string };
    const rows = Array.isArray(payload.data)
      ? payload.data
      : payload.data != null
        ? [payload.data]
        : [];
    const count = payload.count ?? (opts.wantsCount ? rows.length : null);

    if (opts.headOnly) {
      return { data: null, error: null, count: count ?? 0 };
    }
    if (opts.maybeSingle) {
      return { data: rows[0] ?? null, error: null, count };
    }
    if (opts.single) {
      if (rows.length === 0) {
        return {
          data: null,
          error: { message: "JSON object requested, multiple (or no) rows returned", code: "PGRST116" },
          count,
        };
      }
      if (rows.length > 1) {
        return {
          data: null,
          error: { message: "JSON object requested, multiple (or no) rows returned", code: "PGRST116" },
          count,
        };
      }
      return { data: rows[0], error: null, count };
    }
    return { data: rows, error: null, count };
  }

  const rows = Array.isArray(json) ? json : json != null ? [json] : [];
  if (opts.headOnly) {
    return { data: null, error: null, count: rows.length };
  }
  if (opts.maybeSingle) {
    return { data: rows[0] ?? null, error: null, count: opts.wantsCount ? rows.length : null };
  }
  if (opts.single) {
    if (rows.length === 0) {
      return {
        data: null,
        error: { message: "JSON object requested, multiple (or no) rows returned", code: "PGRST116" },
        count: opts.wantsCount ? 0 : null,
      };
    }
    if (rows.length > 1) {
      return {
        data: null,
        error: { message: "JSON object requested, multiple (or no) rows returned", code: "PGRST116" },
        count: opts.wantsCount ? rows.length : null,
      };
    }
    return { data: rows[0], error: null, count: opts.wantsCount ? 1 : null };
  }
  return { data: rows, error: null, count: opts.wantsCount ? rows.length : null };
}

class QueryBuilder {
  readonly [Symbol.toStringTag] = "Promise";
  filters: Filters = {};
  orFilter?: string;
  declare eq: (column: string, value: unknown) => this;
  declare in: (column: string, values: unknown[]) => this;
  declare is: (column: string, value: unknown) => this;
  declare gt: (column: string, value: unknown) => this;
  declare gte: (column: string, value: unknown) => this;
  declare lt: (column: string, value: unknown) => this;
  declare lte: (column: string, value: unknown) => this;
  declare neq: (column: string, value: unknown) => this;
  declare or: (queryString: string) => this;
  declare not: (column: string, operator: string, value: unknown) => this;
  declare like: (column: string, value: unknown) => this;
  declare ilike: (column: string, value: unknown) => this;
  private selectColumns = "*";
  private countMode?: "exact" | "planned" | "estimated";
  private limitCount?: number;
  private offsetCount?: number;
  private orders: { column: string; ascending: boolean }[] = [];
  private _single = false;
  private _maybeSingle = false;
  private headOnly = false;

  constructor(private table: string) {
    mixinFilters(this);
  }

  order(column: string, { ascending = true } = {}) {
    this.orders.push({ column, ascending });
    return this;
  }

  range(from: number, to: number) {
    this.offsetCount = from;
    this.limitCount = to - from + 1;
    return this;
  }

  limit(n: number) {
    this.limitCount = n;
    return this;
  }

  select(columns = "*", options?: { count?: "exact" | "planned" | "estimated"; head?: boolean }) {
    this.selectColumns = columns;
    if (options?.count) this.countMode = options.count;
    if (options?.head) this.headOnly = true;
    return this;
  }

  single() {
    this._single = true;
    return this;
  }

  maybeSingle() {
    this._maybeSingle = true;
    return this;
  }

  insert(payload: unknown | unknown[]) {
    return new InsertBuilder(this.table, payload);
  }

  upsert(payload: unknown | unknown[], _options?: Record<string, unknown>) {
    return new InsertBuilder(this.table, payload);
  }

  update(payload: Record<string, unknown>) {
    const builder = new UpdateBuilder(this.table, payload);
    builder.filters = cloneFilters(this.filters);
    builder.orFilter = this.orFilter;
    return builder;
  }

  delete() {
    return new DeleteBuilder(this.table);
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    resolve?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    reject?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return chainPromise(
      () => this._execute(),
      (err) => ({ data: null, error: { message: String(err) }, count: null }),
    ).then(resolve, reject)
  }

  catch<TResult = never>(
    reject?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ): Promise<QueryResult | TResult> {
    return chainPromise(
      () => this._execute(),
      (err) => ({ data: null, error: { message: String(err) }, count: null }),
    ).catch(reject)
  }

  finally(onFinally?: (() => void) | null): Promise<QueryResult> {
    return chainPromise(
      () => this._execute(),
      (err) => ({ data: null, error: { message: String(err) }, count: null }),
    ).finally(onFinally ?? undefined)
  }

  private async _execute(): Promise<QueryResult> {
    const params = new URLSearchParams();

    appendFiltersToParams(params, this.filters, this.orFilter);

    if (this.selectColumns) params.set("_select", this.selectColumns);
    if (this.countMode) params.set("_count", this.countMode);
    if (this.headOnly) params.set("_head", "true");

    if (this.limitCount !== undefined) params.set("_limit", String(this.limitCount));
    if (this.offsetCount !== undefined) params.set("_offset", String(this.offsetCount));

    this.orders.forEach((o, i) => {
      if (i === 0) {
        params.set("_orderBy", o.column);
        params.set("_orderDir", o.ascending ? "asc" : "desc");
      } else {
        params.append("_order", `${o.column}.${o.ascending ? "asc" : "desc"}`);
      }
    });

    const res = await fetch(resolveApiUrl(`/api/db/${this.table}?${params.toString()}`));
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Request failed" }));
      return { data: null, error: { message: err.message || "Request failed", status: res.status }, count: null };
    }

    const json = await res.json();
    return parseGetResponse(json, {
      single: this._single,
      maybeSingle: this._maybeSingle,
      headOnly: this.headOnly,
      wantsCount: !!this.countMode,
    });
  }
}

function createFakeChannel(_name: string) {
  const fake = {
    on(_event: string, _filterOrCallback?: unknown, _callback?: unknown) {
      return fake;
    },
    subscribe(callback?: (status?: string | null) => void) {
      if (callback) callback("SUBSCRIBED");
      return fake;
    },
    unsubscribe() {},
  };
  return fake;
}

export const supabase = {
  from: (table: string) => new QueryBuilder(table),
  channel: (name: string) => createFakeChannel(name),
  removeChannel(_channel: unknown) {},
  auth: authStub,
  get storage() {
    return getStorageRpcClient().storage;
  },
  rpc(fn: string, args?: Record<string, unknown>) {
    return getStorageRpcClient().rpc(fn, args);
  },
};
