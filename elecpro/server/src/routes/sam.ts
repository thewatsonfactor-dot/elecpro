import { Router } from "express";

const router = Router();

const SAM_BASE = "https://api.sam.gov/opportunities/v2/search";

// GET /api/sam/search — proxy SAM.gov API (keeps API key server-side)
router.get("/search", async (req, res) => {
  const samKey = process.env.SAM_GOV_API_KEY;
  if (!samKey) {
    return res.status(500).json({ error: "SAM.gov API key not configured on server" });
  }

  const { keyword, state, naics, typeOfSetAside, limit, offset } = req.query;
  const params = new URLSearchParams({
    api_key: samKey,
    limit: (limit as string) || "20",
    offset: (offset as string) || "0",
  });

  if (keyword) params.set("keyword", keyword as string);
  if (state) params.set("state", state as string);
  if (naics) params.set("naics", naics as string);
  if (typeOfSetAside) params.set("typeOfSetAside", typeOfSetAside as string);

  try {
    const resp = await fetch(`${SAM_BASE}?${params}`);
    const data: any = await resp.json();
    if (!resp.ok) {
      return res.status(resp.status).json({ error: data.error?.message || `SAM.gov API error ${resp.status}` });
    }
    res.json(data);
  } catch (err: any) {
    console.error("SAM.gov proxy error:", err);
    res.status(500).json({ error: "Failed to reach SAM.gov" });
  }
});

export { router as samRouter };
