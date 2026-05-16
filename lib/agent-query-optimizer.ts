import type { Agent } from "@/lib/supabase";
import { adminCacheManager } from "@/lib/admin-cache-manager";

interface DashboardData {
  agents: Agent[];
  stats: unknown;
  atRisk: unknown[];
}

export async function fetchAllDashboardData(limit = 100, offset = 0): Promise<DashboardData> {
  const cacheKey = `agents:dashboard:${limit}:${offset}`;

  const cached = adminCacheManager.get<DashboardData>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const data = await adminCacheManager.dedupRequest(cacheKey, async () => {
      const res = await fetch(
        `/api/admin/agents/list?limit=${limit}&offset=${offset}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        throw new Error("Failed to fetch agents list");
      }
      return res.json() as Promise<DashboardData>;
    });

    adminCacheManager.set(cacheKey, data, 5 * 60 * 1000);
    return data;
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return {
      agents: [],
      stats: null,
      atRisk: [],
    };
  }
}
