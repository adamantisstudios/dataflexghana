import type { Job } from "@/lib/supabase";

export type FetchJobsOptions = {
  active?: boolean;
  featured?: boolean;
  limit?: number;
};

/** Client-safe: loads jobs from the dedicated /api/jobs route (external DB). */
export async function fetchJobsFromApi(options: FetchJobsOptions = {}): Promise<Job[]> {
  const params = new URLSearchParams();
  if (options.active) params.set("active", "true");
  if (options.featured) params.set("featured", "true");
  if (options.limit != null) params.set("limit", String(options.limit));

  const query = params.toString();
  const url = query ? `/api/jobs?${query}` : "/api/jobs?active=true";
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || `Failed to load jobs (${res.status})`);
  }
  const json = (await res.json()) as { jobs?: Job[] };
  return Array.isArray(json.jobs) ? json.jobs : [];
}

export async function fetchJobByIdFromApi(id: string): Promise<Job | null> {
  const res = await fetch(`/api/jobs/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || "Failed to load job");
  }
  const json = (await res.json()) as { job?: Job };
  return json.job ?? null;
}

export async function fetchJobsStatsFromApi(): Promise<{ total: number; active: number }> {
  const res = await fetch("/api/jobs/stats", { cache: "no-store" });
  if (!res.ok) {
    return { total: 0, active: 0 };
  }
  return res.json();
}
