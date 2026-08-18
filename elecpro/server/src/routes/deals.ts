import { Router } from "express";
import NodeCache from "node-cache";
import { AuthRequest } from "../middleware/auth";

const router = Router();

// ─── CACHES ───────────────────────────────────────────────────────────────────
// SAM.gov search results — 1h TTL (federal opportunities don't change that fast)
const samCache = new NodeCache({ stdTTL: 3600 });
// USAspending agency-spend signal per (agency, NAICS) — 24h TTL
const spendCache = new NodeCache({ stdTTL: 86400 });

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

export interface DealCategory {
  id: string;
  name: string;
  icon: string;         // Unicode glyph matching sidebar aesthetic
  naics: string[];
  keywords: string[];
}

export const CATEGORIES: DealCategory[] = [
  { id: "electrical",     name: "Electrical Products",      icon: "⚡", naics: ["423610", "335311"],           keywords: ["wire","conduit","breaker","panel","outlet"] },
  { id: "lighting",       name: "Lighting & LED Retrofit",  icon: "◉", naics: ["335110", "423610"],           keywords: ["LED","lighting","fixture","bulb","retrofit"] },
  { id: "safety",         name: "Safety & PPE",             icon: "◈", naics: ["339113", "423450"],           keywords: ["PPE","safety","hard hat","glove","respirator"] },
  { id: "uniforms",       name: "Uniforms & Workwear",      icon: "◊", naics: ["315220","315240","315990","424320"], keywords: ["uniform","scrubs","coverall","workwear"] },
  { id: "janitorial",     name: "Janitorial & Cleaning",    icon: "◌", naics: ["424130", "325611"],           keywords: ["janitorial","cleaning","paper","trash"] },
  { id: "office",         name: "Office Furniture & Supplies", icon: "▣", naics: ["337214", "423210"],        keywords: ["furniture","desk","chair","office supply"] },
  { id: "tools",          name: "Tools & Hardware",         icon: "◢", naics: ["423710", "332722"],           keywords: ["tools","hardware","fastener"] },
  { id: "hvac",           name: "HVAC Filters & Parts",     icon: "◉", naics: ["423730"],                     keywords: ["HVAC","filter","air handler"] },
  { id: "plumbing",       name: "Plumbing Supplies",        icon: "◯", naics: ["423720"],                     keywords: ["plumbing","fixture","valve"] },
  { id: "flooring",       name: "Flooring & Mats",          icon: "▤", naics: ["314110", "423220"],           keywords: ["mat","carpet","flooring","entrance mat"] },
  { id: "signage",        name: "Signage & ADA",            icon: "▥", naics: ["339950"],                     keywords: ["sign","signage","ADA","wayfinding"] },
  { id: "breakroom",      name: "Kitchen & Breakroom",      icon: "◐", naics: ["423440"],                     keywords: ["breakroom","coffee","water cooler"] },
  { id: "medical",        name: "Medical & Lab Supplies",   icon: "◍", naics: ["423450", "423460"],           keywords: ["medical","lab","clinical"] },
  { id: "batteries",      name: "Batteries & Power",        icon: "◓", naics: ["335912"],                     keywords: ["battery","UPS","generator"] },
  { id: "paint",          name: "Paint & Finishes",         icon: "◑", naics: ["424950"],                     keywords: ["paint","stain","sealer"] },
  { id: "groundskeeping", name: "Groundskeeping Products",  icon: "◒", naics: ["423820"],                     keywords: ["mower","landscaping","ice melt"] },
  { id: "it",             name: "IT Accessories",           icon: "▢", naics: ["423430"],                     keywords: ["cable","monitor","keyboard","peripheral"] },
];

// ─── DISTRIBUTOR DATA ─────────────────────────────────────────────────────────
// Starter list — major known wholesale distributors by category.
// Marked as v1; expand over time with user feedback and research.

export interface Distributor {
  name: string;
  url: string;
  notes: string;
}

export const DISTRIBUTORS: Record<string, Distributor[]> = {
  electrical: [
    { name: "Graybar",  url: "https://graybar.com",       notes: "Major electrical distributor; federal reseller program and GSA schedule holder." },
    { name: "Rexel USA", url: "https://rexelusa.com",     notes: "Nationwide electrical supply; offers federal contracting support." },
    { name: "WESCO",    url: "https://wesco.com",         notes: "Industrial and electrical distribution; strong federal presence." },
    { name: "Border States", url: "https://borderstates.com", notes: "Employee-owned electrical distributor with government accounts." },
    { name: "CED (Consolidated Electrical Distributors)", url: "https://cedusa.com", notes: "Independently owned profit-center network; over 700 U.S. locations." },
  ],
  lighting: [
    { name: "Regency Lighting",  url: "https://regencylighting.com", notes: "Commercial lighting retrofit specialist; LED upgrades and rebates." },
    { name: "1000Bulbs.com",     url: "https://1000bulbs.com",       notes: "High-volume bulb and fixture distributor with contract pricing." },
    { name: "Graybar",           url: "https://graybar.com",         notes: "Lighting products are a core category; federal reseller." },
    { name: "Grainger",          url: "https://grainger.com",        notes: "GSA schedule holder; fast drop-ship on LED fixtures and bulbs." },
    { name: "USA LED",           url: "https://usaled.com",          notes: "Specialized LED retrofit distributor." },
  ],
  safety: [
    { name: "Grainger",    url: "https://grainger.com",    notes: "Largest safety and PPE distributor; GSA schedule, federal accounts." },
    { name: "Fastenal",    url: "https://fastenal.com",    notes: "Industrial supply with strong safety/PPE line; FAST Solutions vending." },
    { name: "MSC Industrial", url: "https://mscdirect.com", notes: "Metalworking + safety distributor; GSA contract." },
    { name: "Uline",       url: "https://uline.com",       notes: "Ships from regional warehouses; same/next day on most PPE." },
    { name: "Safety Supply America", url: "https://safetysupplyamerica.com", notes: "Full-line PPE with commercial accounts." },
  ],
  uniforms: [
    { name: "Galls",           url: "https://galls.com",         notes: "Public safety and uniform specialist; government quotes available." },
    { name: "Cintas",          url: "https://cintas.com",        notes: "Uniform rental and direct sales; nationwide service." },
    { name: "Lands' End Business", url: "https://business.landsend.com", notes: "Corporate workwear and uniforms with logo programs." },
    { name: "UniFirst",        url: "https://unifirst.com",      notes: "Uniform rental and facility services." },
    { name: "Aramark",         url: "https://aramark.com",       notes: "Uniform programs for government and healthcare." },
  ],
  janitorial: [
    { name: "Uline",           url: "https://uline.com",         notes: "Janitorial + facility supplies; regional warehouses." },
    { name: "Grainger",        url: "https://grainger.com",      notes: "Full janitorial line; GSA schedule." },
    { name: "Staples Business Advantage", url: "https://staplesadvantage.com", notes: "Janitorial + office combined contracts." },
    { name: "HD Supply Facilities Maintenance", url: "https://hdsupplysolutions.com", notes: "Janitorial and MRO (now part of Home Depot Pro)." },
    { name: "WAXIE / Envoy Solutions", url: "https://waxie.com", notes: "Regional jan-san distributor with government accounts." },
  ],
  office: [
    { name: "Staples Business Advantage", url: "https://staplesadvantage.com", notes: "Office supplies + furniture; federal schedule." },
    { name: "Office Depot BSD",   url: "https://business.officedepot.com", notes: "Office Depot's B2B arm; government programs." },
    { name: "Amazon Business",    url: "https://business.amazon.com", notes: "Government accounts; fast fulfillment." },
    { name: "WB Mason",           url: "https://wbmason.com",       notes: "Regional office products distributor." },
    { name: "National Business Furniture", url: "https://nationalbusinessfurniture.com", notes: "Commercial furniture with quick ship." },
  ],
  tools: [
    { name: "Grainger",       url: "https://grainger.com",   notes: "Industrial supply; GSA schedule, federal accounts." },
    { name: "Fastenal",       url: "https://fastenal.com",   notes: "Tools, hardware, fasteners; government programs." },
    { name: "MSC Industrial", url: "https://mscdirect.com",  notes: "Metalworking and tool specialist; GSA." },
    { name: "McMaster-Carr",  url: "https://mcmaster.com",   notes: "Rapid-ship industrial supply; extensive catalog." },
    { name: "Northern Tool + Equipment", url: "https://northerntool.com", notes: "Power tools and equipment." },
  ],
  hvac: [
    { name: "Johnstone Supply",  url: "https://johnstonesupply.com", notes: "Leading HVACR distributor; nationwide." },
    { name: "Grainger",          url: "https://grainger.com",       notes: "HVAC filters and parts; GSA schedule." },
    { name: "United Refrigeration", url: "https://uri.com",          notes: "HVACR wholesale; regional network." },
    { name: "Global Industrial", url: "https://globalindustrial.com", notes: "HVAC + industrial supply; government accounts." },
    { name: "Ferguson HVAC",     url: "https://ferguson.com",       notes: "HVAC division of Ferguson; full product line." },
  ],
  plumbing: [
    { name: "Ferguson",          url: "https://ferguson.com",       notes: "Largest plumbing distributor in the U.S." },
    { name: "HD Supply",         url: "https://hdsupplysolutions.com", notes: "Plumbing supplies for facilities; government accounts." },
    { name: "Winsupply",         url: "https://winsupplyinc.com",   notes: "Independently-owned plumbing distributor network." },
    { name: "Grainger",          url: "https://grainger.com",       notes: "Plumbing + MRO combined; GSA schedule." },
    { name: "Supply House",      url: "https://supplyhouse.com",    notes: "Online plumbing and HVAC supply." },
  ],
  flooring: [
    { name: "Uline",             url: "https://uline.com",          notes: "Entrance mats and industrial flooring; fast ship." },
    { name: "Grainger",          url: "https://grainger.com",       notes: "Commercial mats and flooring; GSA." },
    { name: "Andersen Company",  url: "https://andersenco.com",     notes: "Commercial entrance mat manufacturer." },
    { name: "Mats Inc.",         url: "https://matsinc.com",        notes: "Commercial flooring and matting." },
    { name: "FloorMat.com",      url: "https://floormat.com",       notes: "Entrance mat specialist with custom options." },
  ],
  signage: [
    { name: "Seton",             url: "https://seton.com",          notes: "Safety and facility signage; ADA compliant products." },
    { name: "Grainger",          url: "https://grainger.com",       notes: "Signage and labels; GSA schedule." },
    { name: "MyParkingSign",     url: "https://myparkingsign.com",  notes: "Parking and ADA signage; custom fast." },
    { name: "Brady Corporation", url: "https://bradyid.com",        notes: "Labels, signs, and facility ID systems." },
    { name: "SmartSign",         url: "https://smartsign.com",      notes: "ADA and facility signage with government accounts." },
  ],
  breakroom: [
    { name: "Staples Business Advantage", url: "https://staplesadvantage.com", notes: "Breakroom supplies as part of office program." },
    { name: "Amazon Business",   url: "https://business.amazon.com", notes: "Breakroom supplies with government accounts." },
    { name: "WB Mason",          url: "https://wbmason.com",        notes: "Regional office/breakroom distributor." },
    { name: "Uline",             url: "https://uline.com",          notes: "Breakroom supplies; rapid regional ship." },
    { name: "Keurig Business",   url: "https://office.keurig.com",  notes: "Coffee programs and equipment for offices." },
  ],
  medical: [
    { name: "McKesson Medical-Surgical", url: "https://mms.mckesson.com", notes: "Largest medical-surgical distributor in U.S." },
    { name: "Henry Schein",      url: "https://henryschein.com",    notes: "Medical, dental, and lab supplies." },
    { name: "Medline Industries", url: "https://medline.com",       notes: "Medical supplies with government/VA programs." },
    { name: "Cardinal Health",   url: "https://cardinalhealth.com", notes: "Major healthcare distributor; federal supply schedule." },
    { name: "Fisher Scientific", url: "https://fishersci.com",      notes: "Lab supplies and equipment; government accounts." },
  ],
  batteries: [
    { name: "Battery Systems",   url: "https://batterysystems.net", notes: "Full-line battery distributor." },
    { name: "Grainger",          url: "https://grainger.com",       notes: "Industrial batteries and UPS; GSA." },
    { name: "Interstate Batteries", url: "https://interstatebatteries.com", notes: "National battery distribution network." },
    { name: "Continental Battery Systems", url: "https://continentalbatterysystems.com", notes: "Battery wholesaler with commercial/government." },
    { name: "Batteries Plus",    url: "https://batteriesplus.com",  notes: "Battery and bulb specialist; commercial accounts." },
  ],
  paint: [
    { name: "Sherwin-Williams",  url: "https://sherwin-williams.com", notes: "Largest paint retailer in the U.S.; government accounts." },
    { name: "PPG Paints",        url: "https://ppgpaints.com",      notes: "Paint and coatings; commercial programs." },
    { name: "Benjamin Moore",    url: "https://benjaminmoore.com",  notes: "Premium paint with dealer network." },
    { name: "Grainger",          url: "https://grainger.com",       notes: "Industrial paints and coatings; GSA schedule." },
    { name: "Home Depot Pro",    url: "https://homedepot.com/b/Pro", notes: "Paint and supplies for commercial accounts." },
  ],
  groundskeeping: [
    { name: "John Deere",        url: "https://deere.com",          notes: "Commercial mowers and landscaping equipment." },
    { name: "Grainger",          url: "https://grainger.com",       notes: "Groundskeeping and landscaping supplies; GSA." },
    { name: "SiteOne Landscape Supply", url: "https://siteone.com", notes: "Largest landscape supply distributor in U.S." },
    { name: "Ewing Irrigation",  url: "https://ewingirrigation.com", notes: "Irrigation and landscape products." },
    { name: "Uline",             url: "https://uline.com",          notes: "Ice melt, grounds supplies; regional ship." },
  ],
  it: [
    { name: "CDW-G",             url: "https://cdwg.com",           notes: "Federal/state/local government IT reseller; GSA schedule." },
    { name: "Insight",           url: "https://insight.com",        notes: "IT solutions provider with strong federal program." },
    { name: "SHI International", url: "https://shi.com",            notes: "Public sector IT specialist." },
    { name: "Connection Public Sector", url: "https://connection.com", notes: "Government IT reseller." },
    { name: "Amazon Business",   url: "https://business.amazon.com", notes: "IT accessories with government accounts." },
  ],
};

// ─── SAM.gov HELPERS ──────────────────────────────────────────────────────────
const SAM_BASE = "https://api.sam.gov/opportunities/v2/search";
const USA_BASE = "https://api.usaspending.gov/api/v2";

function samDate(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
}

// Installation/labor keywords we strip from results (keeps it drop-ship focused)
const EXCLUDE_PATTERNS = [
  /\binstall\w*/i,
  /\blabor\b/i,
  /\bservice contract\b/i,
  /\bconstruction\b/i,
  /\brepair services?\b/i,
  /\bmaintenance services?\b/i,
];

function isProductOnly(title: string): boolean {
  if (!title) return true;
  return !EXCLUDE_PATTERNS.some((rx) => rx.test(title));
}

async function samSearchByNaics(naics: string, state?: string): Promise<any[]> {
  const samKey = process.env.SAM_GOV_API_KEY;
  if (!samKey) throw new Error("SAM.gov API key not configured");

  const cacheKey = `sam:${naics}:${state || ""}`;
  const cached = samCache.get<any[]>(cacheKey);
  if (cached) return cached;

  // SAM.gov requires postedFrom/postedTo in MM/DD/YYYY — pull last 60 days
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 60);

  const params = new URLSearchParams({
    api_key: samKey,
    limit: "100",
    offset: "0",
    ncode: naics,
    postedFrom: samDate(from),
    postedTo: samDate(to),
  });
  if (state) params.set("state", state);

  const resp = await fetch(`${SAM_BASE}?${params}`);
  if (!resp.ok) {
    // Don't poison the cache on error — just return empty so other categories still work
    return [];
  }
  const data: any = await resp.json();
  const results = data.opportunitiesData || [];
  samCache.set(cacheKey, results);
  return results;
}

// USAspending — agency's total spend in a NAICS last fiscal year
async function agencySpendInNaics(agency: string, naics: string): Promise<number> {
  if (!agency || !naics) return 0;
  const cacheKey = `spend:${agency}:${naics}`;
  const cached = spendCache.get<number>(cacheKey);
  if (cached !== undefined) return cached;

  const end = new Date();
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const resp = await fetch(`${USA_BASE}/search/spending_by_award/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filters: {
          naics_codes: [naics],
          agencies: [{ type: "awarding", tier: "toptier", name: agency }],
          time_period: [{ start_date: start.toISOString().split("T")[0], end_date: end.toISOString().split("T")[0] }],
          award_type_codes: ["A", "B", "C", "D"],
        },
        fields: ["Award Amount"],
        page: 1,
        limit: 100,
        sort: "Award Amount",
        order: "desc",
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) {
      spendCache.set(cacheKey, 0);
      return 0;
    }
    const data: any = await resp.json();
    const total = (data.results || []).reduce((s: number, r: any) => s + (r["Award Amount"] || 0), 0);
    spendCache.set(cacheKey, total);
    return total;
  } catch {
    spendCache.set(cacheKey, 0);
    return 0;
  }
}

// ─── FIT SCORE ────────────────────────────────────────────────────────────────
export interface FitScoreInput {
  setAside?: string;
  value?: number;
  responseDeadline?: string | null;
  agency?: string;
  naics?: string;
  state?: string;
  userState?: string;
  agencySpend?: number; // pre-fetched agency spend in this NAICS
}

export function computeFitScore(x: FitScoreInput): {
  score: number;
  breakdown: Array<{ signal: string; points: number; note: string }>;
} {
  const breakdown: Array<{ signal: string; points: number; note: string }> = [];
  let score = 0;

  // Small business set-aside: +30
  if (x.setAside && x.setAside.trim().length > 0) {
    breakdown.push({ signal: "set-aside", points: 30, note: `Reserved for small business (${x.setAside})` });
    score += 30;
  }

  // Value tiers: +25 micro-purchase, +15 simplified acquisition
  if (typeof x.value === "number" && x.value > 0) {
    if (x.value <= 25000) {
      breakdown.push({ signal: "micro-purchase", points: 25, note: "Under $25K — micro-purchase threshold, easier to win" });
      score += 25;
    } else if (x.value <= 150000) {
      breakdown.push({ signal: "simplified-acquisition", points: 15, note: "$25K–$150K — simplified acquisition, streamlined process" });
      score += 15;
    }
  }

  // Response deadline > 7 days: +10
  if (x.responseDeadline) {
    const daysLeft = Math.ceil((new Date(x.responseDeadline).getTime() - Date.now()) / 864e5);
    if (daysLeft > 7) {
      breakdown.push({ signal: "deadline-room", points: 10, note: `${daysLeft} days to respond — comfortable timeline` });
      score += 10;
    } else if (daysLeft >= 0) {
      breakdown.push({ signal: "deadline-tight", points: 0, note: `${daysLeft} days left — tight` });
    }
  }

  // Agency spent >$1M in this NAICS last year: +20
  if ((x.agencySpend ?? 0) > 1_000_000) {
    breakdown.push({ signal: "agency-regular", points: 20, note: `${x.agency} spent $${(x.agencySpend! / 1e6).toFixed(1)}M in this NAICS last year — regular buyer` });
    score += 20;
  }

  // Location matches user state: +10
  if (x.state && x.userState && x.state.toUpperCase() === x.userState.toUpperCase()) {
    breakdown.push({ signal: "home-state", points: 10, note: `Place of performance: ${x.state} (your state)` });
    score += 10;
  }

  return { score: Math.min(100, score), breakdown };
}

// ─── ENDPOINTS ────────────────────────────────────────────────────────────────

// GET /api/deals/categories — list all categories
router.get("/categories", (_req, res) => {
  res.json({ categories: CATEGORIES });
});

// GET /api/deals/distributors/:categoryId
router.get("/distributors/:categoryId", (req, res) => {
  const cat = CATEGORIES.find((c) => c.id === req.params.categoryId);
  if (!cat) return res.status(404).json({ error: "Unknown category" });
  const list = DISTRIBUTORS[cat.id] || [];
  res.json({ category: cat, distributors: list });
});

// POST /api/deals/search — search SAM.gov by category NAICS, filter, score
router.post("/search", async (req: AuthRequest, res) => {
  try {
    const { categoryIds, state, maxValue, setAside, userState } = req.body as {
      categoryIds?: string[];
      state?: string;
      maxValue?: number;
      setAside?: string;
      userState?: string;
    };

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({ error: "categoryIds required (non-empty array)" });
    }

    const selected = CATEGORIES.filter((c) => categoryIds.includes(c.id));
    if (selected.length === 0) return res.json({ results: [] });

    // Fan out SAM.gov queries per NAICS (and optional state), in parallel
    const naicsToCategory = new Map<string, DealCategory>();
    for (const cat of selected) {
      for (const naics of cat.naics) {
        // If multiple categories share a NAICS, keep first match for badge color
        if (!naicsToCategory.has(naics)) naicsToCategory.set(naics, cat);
      }
    }

    const allHits = await Promise.all(
      [...naicsToCategory.keys()].map((naics) => samSearchByNaics(naics, state))
    );

    // Flatten, dedupe by noticeId, attach category
    const merged = new Map<string, any>();
    allHits.forEach((hits, idx) => {
      const naics = [...naicsToCategory.keys()][idx];
      const cat = naicsToCategory.get(naics)!;
      for (const op of hits) {
        const id = op.noticeId;
        if (!id || merged.has(id)) continue;
        merged.set(id, { op, cat, naics });
      }
    });

    // Filter out non-product (install, labor, etc.) and apply user filters
    const filtered: any[] = [];
    for (const entry of merged.values()) {
      const { op, cat, naics } = entry;
      if (!isProductOnly(op.title || "")) continue;
      if (setAside && op.typeOfSetAside !== setAside) continue;
      // Best-effort value extraction — SAM often doesn't post a value; keep opportunities with unknown value
      const valueStr = op.awardValue || op.baseAndAllOptionsValue || op.baseAndExercisedOptionsValue;
      const value = typeof valueStr === "string" ? parseFloat(valueStr) : (typeof valueStr === "number" ? valueStr : undefined);
      if (typeof maxValue === "number" && maxValue > 0 && value && value > maxValue) continue;

      filtered.push({ op, cat, naics, value });
    }

    // Fetch agency-spend signal in parallel (one lookup per agency+naics pair — cached 24h)
    const pairs = new Map<string, Promise<number>>();
    for (const f of filtered) {
      const agency = f.op.fullParentPathName || f.op.department || f.op.agency || "";
      const key = `${agency}::${f.naics}`;
      if (!pairs.has(key)) pairs.set(key, agencySpendInNaics(agency, f.naics));
    }
    const pairResults = new Map<string, number>();
    await Promise.all(
      [...pairs.entries()].map(async ([k, p]) => {
        pairResults.set(k, await p);
      })
    );

    // Score each
    const scored = filtered.map((f) => {
      const agency = f.op.fullParentPathName || f.op.department || f.op.agency || "";
      const popState = f.op.placeOfPerformance?.state?.code || f.op.placeOfPerformance?.state?.name;
      const { score, breakdown } = computeFitScore({
        setAside: f.op.typeOfSetAside,
        value: f.value,
        responseDeadline: f.op.responseDeadLine || f.op.responseDeadline,
        agency,
        naics: f.naics,
        state: popState,
        userState,
        agencySpend: pairResults.get(`${agency}::${f.naics}`) ?? 0,
      });

      return {
        noticeId: f.op.noticeId,
        title: f.op.title,
        department: agency,
        naicsCode: f.naics,
        responseDeadLine: f.op.responseDeadLine || f.op.responseDeadline,
        postedDate: f.op.postedDate,
        typeOfSetAside: f.op.typeOfSetAside,
        baseType: f.op.baseType,
        placeOfPerformance: f.op.placeOfPerformance,
        description: f.op.description,
        uiLink: f.op.uiLink,
        value: f.value,
        category: { id: f.cat.id, name: f.cat.name, icon: f.cat.icon },
        fitScore: score,
        fitBreakdown: breakdown,
      };
    });

    // Default sort: fit desc, then deadline asc
    scored.sort((a, b) => {
      if (b.fitScore !== a.fitScore) return b.fitScore - a.fitScore;
      const ad = a.responseDeadLine ? new Date(a.responseDeadLine).getTime() : Infinity;
      const bd = b.responseDeadLine ? new Date(b.responseDeadLine).getTime() : Infinity;
      return ad - bd;
    });

    res.json({ results: scored, count: scored.length });
  } catch (e: any) {
    console.error("Deal Finder search error:", e);
    res.status(500).json({ error: e.message || "Search failed" });
  }
});

// POST /api/deals/score — score a single opportunity (used client-side too if needed)
router.post("/score", (req: AuthRequest, res) => {
  const out = computeFitScore(req.body || {});
  res.json(out);
});

export { router as dealsRouter };
