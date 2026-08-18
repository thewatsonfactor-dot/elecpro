import { Router } from "express";
import NodeCache from "node-cache";

const router = Router();
const cache = new NodeCache({ stdTTL: 86400 }); // 24h cache

const USA_BASE = "https://api.usaspending.gov/api/v2";
const TIMEOUT_MS = 20000;

function dateRange(years: number): [string, string] {
  const end = new Date();
  const start = new Date();
  start.setFullYear(start.getFullYear() - years);
  return [start.toISOString().split("T")[0], end.toISOString().split("T")[0]];
}

async function usaPost(path: string, body: unknown): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${USA_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`USAspending ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

function buildFilters(naics: string, state: string, years: number, agencyCode?: string) {
  const [start, end] = dateRange(years);
  const filters: Record<string, unknown> = {
    naics_codes: [naics],
    place_of_performance_locations: [{ country: "USA", state: state.toUpperCase() }],
    time_period: [{ start_date: start, end_date: end }],
    award_type_codes: ["A", "B", "C", "D"],
  };
  if (agencyCode) filters.awarding_agency_codes = [agencyCode];
  return filters;
}

async function fetchAwards(naics: string, state: string, years: number, limit: number, agencyCode?: string) {
  return usaPost("/search/spending_by_award/", {
    filters: buildFilters(naics, state, years, agencyCode),
    fields: [
      "Award ID",
      "Recipient Name",
      "Award Amount",
      "Awarding Agency",
      "Award Description",
      "Period of Performance Start Date",
      "Period of Performance Current End Date",
      "Action Date",
    ],
    page: 1,
    limit,
    sort: "Award Amount",
    order: "desc",
  });
}

// POST /api/intel/awards
router.post("/awards", async (req, res) => {
  const { naics, state, agencyCode, dateRange: dr, limit = 20 } = req.body;
  if (!naics || !state) return res.status(400).json({ error: "naics and state required" });

  const years = dr === "5yr" ? 5 : dr === "3yr" ? 3 : 1;
  const cacheKey = `awards:${naics}:${state}:${years}:${agencyCode || ""}:${limit}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const data = await fetchAwards(naics, state, years, Math.min(Number(limit), 100), agencyCode);
    const result = {
      awards: (data.results || []).map((r: any) => ({
        id: r["Award ID"],
        recipient: r["Recipient Name"],
        amount: r["Award Amount"],
        agency: r["Awarding Agency"],
        description: r["Award Description"],
        startDate: r["Period of Performance Start Date"],
        endDate: r["Period of Performance Current End Date"],
        actionDate: r["Action Date"],
      })),
      total: data.page_metadata?.count,
    };
    cache.set(cacheKey, result);
    res.json(result);
  } catch (e: any) {
    res.status(503).json({ error: "Data temporarily unavailable" });
  }
});

// POST /api/intel/top-recipients
router.post("/top-recipients", async (req, res) => {
  const { naics, state, years = 3 } = req.body;
  if (!naics || !state) return res.status(400).json({ error: "naics and state required" });

  const cacheKey = `top-recipients:${naics}:${state}:${years}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const data = await fetchAwards(naics, state, Number(years), 100);
    const map: Record<string, { total: number; count: number }> = {};
    for (const r of data.results || []) {
      const name = r["Recipient Name"] || "Unknown";
      const amt = r["Award Amount"] || 0;
      if (!map[name]) map[name] = { total: 0, count: 0 };
      map[name].total += amt;
      map[name].count += 1;
    }
    const recipients = Object.entries(map)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10)
      .map(([name, d], i) => ({
        rank: i + 1,
        name,
        total: d.total,
        awards: d.count,
        avgSize: d.count ? Math.round(d.total / d.count) : 0,
        hot: d.count >= 5,
      }));
    cache.set(cacheKey, { recipients });
    res.json({ recipients });
  } catch (e: any) {
    res.status(503).json({ error: "Data temporarily unavailable" });
  }
});

// POST /api/intel/agency-spending
router.post("/agency-spending", async (req, res) => {
  const { naics, state } = req.body;
  if (!naics || !state) return res.status(400).json({ error: "naics and state required" });

  const cacheKey = `agency-spending:${naics}:${state}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const data = await fetchAwards(naics, state, 1, 100);
    const map: Record<string, number> = {};
    for (const r of data.results || []) {
      const agency = r["Awarding Agency"] || "Unknown";
      map[agency] = (map[agency] || 0) + (r["Award Amount"] || 0);
    }
    const agencies = Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, total], i) => ({ rank: i + 1, name, total }));
    cache.set(cacheKey, { agencies });
    res.json({ agencies });
  } catch (e: any) {
    res.status(503).json({ error: "Data temporarily unavailable" });
  }
});

// GET /api/intel/summary?naics=X&state=Y
router.get("/summary", async (req, res) => {
  const { naics, state } = req.query as { naics: string; state: string };
  if (!naics || !state) return res.status(400).json({ error: "naics and state required" });

  const cacheKey = `summary:${naics}:${state}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const data = await fetchAwards(naics, state, 1, 100);
    const awards: any[] = data.results || [];
    const totalDollars = awards.reduce((s, a) => s + (a["Award Amount"] || 0), 0);
    const uniqueRecipients = new Set(awards.map((a) => a["Recipient Name"])).size;
    const avgAwardSize = awards.length ? Math.round(totalDollars / awards.length) : 0;

    const agencyMap: Record<string, number> = {};
    for (const a of awards) {
      const ag = a["Awarding Agency"] || "Unknown";
      agencyMap[ag] = (agencyMap[ag] || 0) + (a["Award Amount"] || 0);
    }
    const topAgencies = Object.entries(agencyMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, total]) => ({ name, total }));

    const summary = {
      totalDollars,
      totalAwards: data.page_metadata?.count || awards.length,
      avgAwardSize,
      uniqueRecipients,
      topAgencies,
    };
    cache.set(cacheKey, summary);
    res.json(summary);
  } catch (e: any) {
    res.status(503).json({ error: "Data temporarily unavailable" });
  }
});

export { router as intelRouter };
