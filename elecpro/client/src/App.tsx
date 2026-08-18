import { useState, useRef, useEffect } from "react";
import * as api from "./api";

// ─── BRAND ────────────────────────────────────────────────────────────────────
const BRAND = {
  name: "ElecPro",
  tagline: "Federal Bidding & Estimating for Electrical Contractors",
  colors: {
    bg: "#0a0e17",
    surface: "#111827",
    surface2: "#1a2235",
    border: "#1f2d45",
    amber: "#f59e0b",
    amberDim: "#d97706",
    blue: "#3b82f6",
    green: "#10b981",
    red: "#ef4444",
    text: "#f1f5f9",
    muted: "#64748b",
    muted2: "#94a3b8",
  },
};
const C = BRAND.colors;

// ─── DEMO DATA (fallback when not logged in) ─────────────────────────────────
const DEMO_BIDS = [
  { noticeId:"2026-001", title:"Electrical Upgrades — Federal Office Building Austin TX", department:"General Services Administration", naicsCode:"238210", responseDeadLine:"2026-03-21", postedDate:"2026-03-01", typeOfSetAside:"SBA", baseType:"Solicitation", placeOfPerformance:{state:{code:"TX"},city:{name:"Austin"}}, description:"Full electrical upgrade including panel replacement, lighting retrofit, and emergency system upgrade for 42,000 SF federal office building.", uiLink:"https://sam.gov" },
  { noticeId:"2026-002", title:"Lighting Retrofit — VA Medical Center San Antonio", department:"Dept of Veterans Affairs", naicsCode:"238210", responseDeadLine:"2026-03-28", postedDate:"2026-03-05", typeOfSetAside:"SDVOSBC", baseType:"Solicitation", placeOfPerformance:{state:{code:"TX"},city:{name:"San Antonio"}}, description:"LED lighting retrofit across 6 buildings. Interior and exterior. Energy Star compliant fixtures required. Phased approach during occupied hours.", uiLink:"https://sam.gov" },
  { noticeId:"2026-003", title:"Emergency Generator Installation — IRS Service Center", department:"Dept of the Treasury", naicsCode:"238210", responseDeadLine:"2026-04-04", postedDate:"2026-03-08", typeOfSetAside:"", baseType:"Presolicitation", placeOfPerformance:{state:{code:"TX"},city:{name:"Austin"}}, description:"Install (3) 500kW natural gas generators with automatic transfer switches. Work includes all associated electrical, concrete pads, and fuel systems.", uiLink:"https://sam.gov" },
  { noticeId:"2026-004", title:"Fire Alarm System Replacement — Federal Courthouse", department:"General Services Administration", naicsCode:"238210", responseDeadLine:"2026-04-11", postedDate:"2026-03-10", typeOfSetAside:"HZC", baseType:"Solicitation", placeOfPerformance:{state:{code:"TX"},city:{name:"Houston"}}, description:"Complete fire alarm system replacement. NICET Level III required. Addressable system, pull stations, strobe/horn combos, and integration with building automation.", uiLink:"https://sam.gov" },
  { noticeId:"2026-005", title:"Electrical Service Entrance Upgrade — USPS Distribution", department:"US Postal Service", naicsCode:"238210", responseDeadLine:"2026-04-18", postedDate:"2026-03-12", typeOfSetAside:"SBA", baseType:"Combined Synopsis/Solicitation", placeOfPerformance:{state:{code:"TX"},city:{name:"Dallas"}}, description:"Upgrade main service entrance from 800A to 2000A. New switchgear, metering, and distribution panels. Utility coordination required.", uiLink:"https://sam.gov" },
];

const DEMO_TAKEOFF = [
  { id:"W001", itemCode:"W001", category:"Wire", description:"#12 AWG THHN, 20A branch circuits", quantity:1240, unit:"LF", confidence:88, tier:"high", status:"pending", userQty:null, notes:"", unitCost:0.42, evidence:{ sourceSheet:"E-2.1 Lighting Plan", scaleBasis:"1/8\"=1'-0\" per title block", pathDescription:"Panel LP-1 circuits → north header → east corridor → fixture group A. 1,124 LF + 10% slack.", assumptions:["10% slack/bend allowance"], flags:[] }},
  { id:"W002", itemCode:"W002", category:"Wire", description:"#10 AWG THHN, 30A to RTU-1", quantity:340, unit:"LF", confidence:82, tier:"high", status:"pending", userQty:null, notes:"", unitCost:0.71, evidence:{ sourceSheet:"E-3.0 Power Plan", scaleBasis:"1/8\"=1'-0\"", pathDescription:"Panel DP-1 → rooftop RTU-1 via mechanical corridor. 309 LF + 10%.", assumptions:["Existing deck sleeve assumed"], flags:[] }},
  { id:"C001", itemCode:"C001", category:"Conduit", description:"3/4\" EMT, branch circuits", quantity:890, unit:"LF", confidence:84, tier:"high", status:"pending", userQty:null, notes:"", unitCost:1.15, evidence:{ sourceSheet:"E-2.1/E-3.0", scaleBasis:"1/8\"=1'-0\"", pathDescription:"All branch runs in finished ceilings per spec 16111.", assumptions:["3/4\" EMT per spec at all branch locations"], flags:[] }},
  { id:"F001", itemCode:"F001", category:"Fixtures", description:"2x4 LED Troffer 40W (Type A)", quantity:34, unit:"EA", confidence:92, tier:"high", status:"pending", userQty:null, notes:"", unitCost:185, evidence:{ sourceSheet:"E-2.1 + Fixture Schedule E-9.0", scaleBasis:"Symbol count + schedule cross-ref", pathDescription:"34 Type A symbols on E-2.1, confirmed by schedule.", assumptions:[], flags:[] }},
  { id:"D001", itemCode:"D001", category:"Devices", description:"20A Duplex Receptacle, spec grade", quantity:47, unit:"EA", confidence:79, tier:"high", status:"pending", userQty:null, notes:"", unitCost:18, evidence:{ sourceSheet:"E-3.0 Power Plan", scaleBasis:"Symbol count", pathDescription:"47 standard duplex receptacle symbols counted.", assumptions:["Spec-grade per spec 16140"], flags:[] }},
  { id:"W003", itemCode:"W003", category:"Wire", description:"#6 AWG THHN, 60A feeder sub-panel", quantity:410, unit:"LF", confidence:61, tier:"review", status:"pending", userQty:null, notes:"", unitCost:1.62, evidence:{ sourceSheet:"E-1.0", scaleBasis:"One-line + estimated route", pathDescription:"MDP to LP-2 route not fully shown. Estimated 372 LF + 10%.", assumptions:["Route estimated — not drawn on plan"], flags:["Route not shown on floor plan","Conduit size not confirmed on one-line"] }},
  { id:"F002", itemCode:"F002", category:"Fixtures", description:"Emergency/Exit combo (Type E)", quantity:9, unit:"EA", confidence:55, tier:"review", status:"pending", userQty:null, notes:"", unitCost:320, evidence:{ sourceSheet:"E-2.1 (partial)", scaleBasis:"Visible symbol count only", pathDescription:"9 exit symbols on E-2.1. Life safety plan not uploaded.", assumptions:["Count from partial plan only"], flags:["Life safety plan E-LS.1 not uploaded","AHJ may require additional egress units"] }},
  { id:"LV001", itemCode:"LV001", category:"Wire", description:"Low voltage control wiring (HVAC)", quantity:0, unit:"LF", confidence:12, tier:"manual", status:"pending", userQty:null, notes:"", unitCost:0, evidence:{ sourceSheet:"NOT SHOWN", scaleBasis:"N/A", pathDescription:"Thermostat/DDC wiring not on electrical plans.", assumptions:[], flags:["Mechanical controls plan required","May be excluded from scope — verify contract"] }},
  { id:"P001", itemCode:"P001", category:"Panels & Gear", description:"200A Main Distribution Panel", quantity:1, unit:"EA", confidence:18, tier:"manual", status:"pending", userQty:null, notes:"", unitCost:0, evidence:{ sourceSheet:"E-9.0 partial", scaleBasis:"Schedule reference only", pathDescription:"MDP on one-line but full schedule not uploaded.", assumptions:[], flags:["Upload complete panel schedule","Get supplier quote — pricing varies significantly"] }},
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function daysUntil(d: string | null | undefined) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 864e5);
}
function fmtDate(d: string | null | undefined) {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function confColor(c: number) {
  return c >= 75 ? C.green : c >= 40 ? C.amber : C.red;
}
function Badge({ text, color, bg }: { text: string; color: string; bg?: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 3, background: bg || color + "18", color, border: `1px solid ${color}28`, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
      {text}
    </span>
  );
}
function ConfBar({ value }: { value: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ flex: 1, height: 3, background: C.border, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: confColor(value), borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 10, color: confColor(value), fontFamily: "monospace", minWidth: 26 }}>{value}%</span>
    </div>
  );
}
function UrgencyBadge({ days }: { days: number | null }) {
  if (days === null) return null;
  if (days < 0) return <Badge text="EXPIRED" color={C.muted} />;
  if (days <= 3) return <Badge text={`${days}d LEFT`} color={C.red} />;
  if (days <= 7) return <Badge text={`${days}d LEFT`} color={C.amber} />;
  if (days <= 14) return <Badge text={`${days}d LEFT`} color={C.blue} />;
  return <Badge text={`${days}d`} color={C.green} />;
}

// Helper to normalize bid data from API (DB uses camelCase deadline field)
function normalizeBid(b: any) {
  return {
    ...b,
    responseDeadLine: b.responseDeadLine || b.responseDeadline,
    placeOfPerformance: b.placeOfPerformance || { state: { code: b.state || "" }, city: { name: b.city || "" } },
  };
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }: { onAuth: (user: any) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ email: "", password: "", name: "", company: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const data = await api.login(form.email, form.password);
        onAuth(data.user);
      } else {
        const data = await api.register(form);
        onAuth(data.user);
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div style={S.onboardWrap}>
      <div style={S.onboardCard}>
        <div style={S.onboardHeader}>
          <div style={S.logoMark}>⚡</div>
          <h1 style={S.logoText}>{BRAND.name}</h1>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 6px" }}>
          {mode === "login" ? "Sign In" : "Create Account"}
        </h2>
        <p style={{ color: C.muted, fontSize: 14, margin: "0 0 24px" }}>
          {mode === "login" ? "Welcome back." : "Set up your ElecPro account."}
        </p>
        {mode === "register" && (
          <>
            <div style={S.field}><label style={S.label}>YOUR NAME</label><input style={S.input} placeholder="First Last" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div style={S.field}><label style={S.label}>COMPANY NAME</label><input style={S.input} placeholder="e.g. Novara Build Group LLC" value={form.company} onChange={(e) => set("company", e.target.value)} /></div>
          </>
        )}
        <div style={S.field}><label style={S.label}>EMAIL</label><input style={S.input} type="email" placeholder="you@company.com" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
        <div style={S.field}><label style={S.label}>PASSWORD</label><input style={S.input} type="password" placeholder={mode === "register" ? "Min 8 characters" : "Password"} value={form.password} onChange={(e) => set("password", e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} /></div>
        {error && <p style={{ color: C.red, fontSize: 13, margin: "0 0 12px" }}>{error}</p>}
        <button style={{ ...S.primaryBtn, width: "100%", marginBottom: 12 }} onClick={submit} disabled={loading}>
          {loading ? "..." : mode === "login" ? "Sign In" : "Create Account"}
        </button>
        <p style={{ fontSize: 13, color: C.muted, textAlign: "center", margin: 0 }}>
          {mode === "login" ? "No account? " : "Already have an account? "}
          <button style={{ background: "none", border: "none", color: C.amber, cursor: "pointer", fontWeight: 600, fontSize: 13 }} onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ tab, setTab, urgentCount, onLogout }: { tab: string; setTab: (t: string) => void; urgentCount: number; onLogout: () => void }) {
  const nav = [
    { id: "dashboard", icon: "◈", label: "Dashboard" },
    { id: "search", icon: "⊕", label: "Find Contracts" },
    { id: "tracker", icon: "◷", label: "Bid Tracker", badge: urgentCount },
    { id: "takeoff", icon: "⚡", label: "AI Takeoff" },
    { id: "intel", icon: "◎", label: "Win Intel" },
    { id: "profile", icon: "◉", label: "My Profile" },
  ];
  return (
    <div style={S.sidebar}>
      <div style={S.sidebarLogo}>
        <span style={{ fontSize: 22 }}>⚡</span>
        <div>
          <div style={{ fontWeight: 900, fontSize: 16, color: C.amber, letterSpacing: "-0.3px" }}>{BRAND.name}</div>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.04em" }}>ELECTRICAL PLATFORM</div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "8px 12px" }}>
        {nav.map((n) => (
          <button key={n.id} onClick={() => setTab(n.id)} style={{ ...S.navItem, ...(tab === n.id ? S.navItemActive : {}) }}>
            <span style={{ fontSize: 16, opacity: tab === n.id ? 1 : 0.6 }}>{n.icon}</span>
            <span style={{ flex: 1 }}>{n.label}</span>
            {n.badge && n.badge > 0 && <span style={S.navBadge}>{n.badge}</span>}
          </button>
        ))}
      </nav>
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}` }}>
        <button onClick={onLogout} style={{ ...S.ghostBtn, width: "100%", fontSize: 12 }}>Sign Out</button>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>ElecPro Beta v1.0</div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ trackedBids, takeoffItems, profile, setTab }: any) {
  const urgent = trackedBids.filter((b: any) => { const d = daysUntil(b.responseDeadLine); return d !== null && d <= 7; });
  const approved = takeoffItems.filter((i: any) => i.status === "approved" || i.status === "modified");
  const pending = takeoffItems.filter((i: any) => i.status === "pending");
  const totalExt = approved.reduce((s: number, i: any) => {
    const q = i.userQty !== null ? i.userQty : i.quantity;
    return s + q * (i.unitCost || 0);
  }, 0);
  return (
    <div style={S.pageContent}>
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.pageTitle}>Dashboard</h1>
          <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>Good to go, {profile.name || "Estimator"}. Here's what needs attention.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={S.secondaryBtn} onClick={() => setTab("search")}>Find Contracts</button>
          <button style={S.primaryBtn} onClick={() => setTab("takeoff")}>New Takeoff ⚡</button>
        </div>
      </div>
      <div style={S.statsGrid}>
        {[
          { label: "Tracked Bids", value: trackedBids.length, color: C.blue, icon: "◷", action: () => setTab("tracker") },
          { label: "Due This Week", value: urgent.length, color: urgent.length > 0 ? C.red : C.green, icon: "⚑", action: () => setTab("tracker") },
          { label: "Takeoff Items", value: takeoffItems.length, color: C.amber, icon: "⚡", action: () => setTab("takeoff") },
          { label: "Pending Review", value: pending.length, color: pending.length > 0 ? C.amber : C.green, icon: "◉", action: () => setTab("takeoff") },
        ].map((s) => (
          <div key={s.label} onClick={s.action} style={{ ...S.statCard, cursor: "pointer", borderTop: `3px solid ${s.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: s.color, fontFamily: "monospace" }}>{s.value}</div>
              <span style={{ fontSize: 20, color: s.color, opacity: 0.6 }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {totalExt > 0 && (
        <div style={{ ...S.card, borderColor: C.amber + "40", marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, letterSpacing: "0.06em" }}>APPROVED TAKEOFF TOTAL</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.amber, fontFamily: "monospace" }}>${totalExt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Based on {approved.length} approved items with unit costs entered</div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={S.card}>
          <div style={S.cardHeader}>
            <span style={{ color: C.amber, fontWeight: 700, fontSize: 13 }}>Urgent Deadlines</span>
            <button style={S.cardLink} onClick={() => setTab("tracker")}>View All</button>
          </div>
          {urgent.length === 0 ? (
            <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>No urgent deadlines. You're clear.</p>
          ) : urgent.map((b: any) => (
            <div key={b.noticeId} style={S.listRow}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, color: C.text, margin: "0 0 2px", fontWeight: 600 }}>{b.title.slice(0, 50)}{b.title.length > 50 ? "..." : ""}</p>
                <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{b.department}</p>
              </div>
              <UrgencyBadge days={daysUntil(b.responseDeadLine)} />
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={S.cardHeader}>
            <span style={{ color: C.blue, fontWeight: 700, fontSize: 13 }}>Takeoff Status</span>
            <button style={S.cardLink} onClick={() => setTab("takeoff")}>Review</button>
          </div>
          {takeoffItems.length === 0 ? (
            <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>No takeoff loaded. Upload plans to get started.</p>
          ) : (
            [
              { label: "High Confidence", count: takeoffItems.filter((i: any) => i.tier === "high").length, color: C.green },
              { label: "Review Required", count: takeoffItems.filter((i: any) => i.tier === "review").length, color: C.amber },
              { label: "Manual Only", count: takeoffItems.filter((i: any) => i.tier === "manual").length, color: C.red },
            ].map((t) => (
              <div key={t.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 13, color: C.muted2 }}>{t.label}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: t.color, fontFamily: "monospace" }}>{t.count}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CONTRACT SEARCH ──────────────────────────────────────────────────────────
function ContractSearch({ trackedBids, onTrack, useApi }: { trackedBids: any[]; onTrack: (bid: any) => void; useApi: boolean }) {
  const [kw, setKw] = useState("electrical");
  const [state, setState] = useState("TX");
  const [setAside, setSetAside] = useState("");
  const [results, setResults] = useState<any[]>(useApi ? [] : DEMO_BIDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const isTracked = (id: string) => trackedBids.some((b) => b.noticeId === id);

  const doSearch = async (kwOverride?: string) => {
    const keyword = kwOverride ?? kw;
    setLoading(true);
    setError("");
    try {
      if (!useApi) {
        setResults(DEMO_BIDS);
        setLoading(false);
        return;
      }
      const params: Record<string, string> = {};
      if (keyword) params.keyword = keyword;
      if (state) params.state = state;
      if (setAside) params.typeOfSetAside = setAside;
      const data = await api.searchSam(params);
      const opps = (data.opportunitiesData || []).map(normalizeBid);
      setResults(opps);
      if (opps.length === 0) setError("No results. Try broader terms.");
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { if (!useApi) setResults(DEMO_BIDS); }, [useApi]);

  if (selected) {
    const bid = selected;
    const days = daysUntil(bid.responseDeadLine);
    const tracked = isTracked(bid.noticeId);
    return (
      <div style={S.pageContent}>
        <button style={S.backBtn} onClick={() => setSelected(null)}>← Back to Results</button>
        <div style={S.card}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <Badge text={bid.department || "Federal"} color={C.blue} />
            {bid.typeOfSetAside && <Badge text={bid.typeOfSetAside} color={C.green} />}
            <Badge text={bid.baseType || "Solicitation"} color={C.muted} />
            <UrgencyBadge days={days} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: "0 0 20px" }}>{bid.title}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: C.border, borderRadius: 8, overflow: "hidden", marginBottom: 20 }}>
            {[["Notice ID", bid.noticeId], ["NAICS", bid.naicsCode], ["Posted", fmtDate(bid.postedDate)], ["Due", bid.responseDeadLine ? `${fmtDate(bid.responseDeadLine)} (${days}d)` : "-"], ["Agency", bid.department], ["Location", [bid.placeOfPerformance?.city?.name, bid.placeOfPerformance?.state?.code].filter(Boolean).join(", ")]].map(([l, v]) => v ? (
              <div key={l} style={{ background: C.surface2, padding: "10px 14px" }}>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.06em", marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{v}</div>
              </div>
            ) : null)}
          </div>
          {bid.description && <p style={{ fontSize: 14, color: C.muted2, lineHeight: 1.7, marginBottom: 20 }}>{bid.description}</p>}
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ ...S.primaryBtn, flex: 1, ...(tracked ? { background: C.surface2, color: C.green, border: `1px solid ${C.green}40` } : {}) }} onClick={() => onTrack(bid)}>
              {tracked ? "Tracked" : "+ Track This Bid"}
            </button>
            <a href={bid.uiLink || "https://sam.gov"} target="_blank" rel="noreferrer" style={{ ...S.secondaryBtn, textDecoration: "none", display: "flex", alignItems: "center" }}>View on SAM.gov</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.pageContent}>
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.pageTitle}>Find Federal Contracts</h1>
          <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>{!useApi ? "Showing demo data — your server will proxy SAM.gov when configured" : "Searching live SAM.gov data"}</p>
        </div>
      </div>
      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={S.grid3}>
          <div><label style={S.label}>KEYWORD</label><input style={S.input} value={kw} onChange={(e) => setKw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doSearch()} placeholder="electrical, lighting, generator..." /></div>
          <div><label style={S.label}>STATE</label>
            <select style={S.input} value={state} onChange={(e) => setState(e.target.value)}>
              <option value="">Any</option>
              {["TX", "CA", "NY", "FL", "IL", "PA", "OH", "GA", "NC", "MI"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div><label style={S.label}>SET-ASIDE</label>
            <select style={S.input} value={setAside} onChange={(e) => setSetAside(e.target.value)}>
              <option value="">Any</option>
              <option value="SBA">Small Business</option>
              <option value="8A">8(a)</option>
              <option value="SDVOSBC">Service-Disabled Veteran</option>
              <option value="HZC">HUBZone</option>
              <option value="WOSB">Women-Owned</option>
            </select>
          </div>
        </div>
        <button style={{ ...S.primaryBtn, marginTop: 16 }} onClick={doSearch} disabled={loading}>
          {loading ? "Searching..." : "Search Federal Contracts"}
        </button>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.08em", marginBottom: 6 }}>QUICK SEARCH</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["sole source", "qualified", "LED light fixtures", "retrofit", "electrical installation"].map((term) => (
              <button key={term} onClick={() => { setKw(term); doSearch(term); }} style={{ ...S.ghostBtn, fontSize: 11, padding: "4px 10px", ...(kw === term ? { background: C.amber + "18", borderColor: C.amber, color: C.amber } : {}) }}>
                {term}
              </button>
            ))}
          </div>
        </div>
        {error && <p style={{ color: C.red, fontSize: 13, margin: "8px 0 0" }}>{error}</p>}
      </div>
      <p style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>{results.length} opportunities</p>
      {results.map((bid) => {
        const days = daysUntil(bid.responseDeadLine);
        const tracked = isTracked(bid.noticeId);
        return (
          <div key={bid.noticeId} style={{ ...S.card, cursor: "pointer", marginBottom: 10 }} onClick={() => setSelected(bid)}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                  <Badge text={bid.department || "Federal"} color={C.blue} />
                  {bid.typeOfSetAside && <Badge text={bid.typeOfSetAside} color={C.green} />}
                  <UrgencyBadge days={days} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>{bid.title}</h3>
                <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
                  {bid.naicsCode && `NAICS ${bid.naicsCode} · `}
                  {[bid.placeOfPerformance?.city?.name, bid.placeOfPerformance?.state?.code].filter(Boolean).join(", ")}
                  {bid.responseDeadLine && ` · Due ${fmtDate(bid.responseDeadLine)}`}
                </p>
              </div>
              <button style={tracked ? { ...S.ghostBtn, color: C.green, borderColor: C.green + "40" } : S.ghostBtn}
                onClick={(e) => { e.stopPropagation(); onTrack(bid); }}>
                {tracked ? "Tracking" : "+ Track"}
              </button>
            </div>
            {bid.description && <p style={{ fontSize: 12, color: C.muted, margin: "10px 0 0", lineHeight: 1.5 }}>{bid.description.slice(0, 180)}...</p>}
          </div>
        );
      })}
    </div>
  );
}

// ─── BID TRACKER ──────────────────────────────────────────────────────────────
function BidTracker({ trackedBids, onRemove }: { trackedBids: any[]; onRemove: (id: string) => void }) {
  const sorted = [...trackedBids].sort((a, b) => (daysUntil(a.responseDeadLine) ?? 9999) - (daysUntil(b.responseDeadLine) ?? 9999));
  const urgent = sorted.filter((b) => { const d = daysUntil(b.responseDeadLine); return d !== null && d <= 7; });
  const upcoming = sorted.filter((b) => { const d = daysUntil(b.responseDeadLine); return d !== null && d > 7; });
  return (
    <div style={S.pageContent}>
      <div style={S.pageHeader}>
        <div><h1 style={S.pageTitle}>Bid Tracker</h1><p style={{ color: C.muted, fontSize: 14, margin: 0 }}>All tracked opportunities with countdown timers</p></div>
      </div>
      <div style={{ ...S.statsGrid, gridTemplateColumns: "repeat(3, 1fr)" }}>
        {[
          { label: "Total Tracked", value: trackedBids.length, color: C.blue },
          { label: "Due This Week", value: urgent.length, color: urgent.length > 0 ? C.red : C.green },
          { label: "Upcoming", value: upcoming.length, color: C.amber },
        ].map((s) => (
          <div key={s.label} style={{ ...S.statCard, borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color, fontFamily: "monospace" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{s.label}</div>
          </div>
        ))}
      </div>
      {trackedBids.length === 0 ? (
        <div style={S.empty}><div style={{ fontSize: 40, marginBottom: 12 }}>◷</div><h3 style={{ color: C.text }}>No Tracked Bids</h3><p style={{ color: C.muted }}>Search for contracts and click "+ Track" to add them here.</p></div>
      ) : (
        <>
          {urgent.length > 0 && <div style={{ marginBottom: 24 }}><h3 style={S.sectionTitle}>Due Within 7 Days</h3>{urgent.map((b) => <TrackerRow key={b.noticeId} bid={b} onRemove={onRemove} />)}</div>}
          {upcoming.length > 0 && <div><h3 style={S.sectionTitle}>Upcoming Deadlines</h3>{upcoming.map((b) => <TrackerRow key={b.noticeId} bid={b} onRemove={onRemove} />)}</div>}
        </>
      )}
    </div>
  );
}

function TrackerRow({ bid, onRemove }: { bid: any; onRemove: (id: string) => void }) {
  const days = daysUntil(bid.responseDeadLine);
  return (
    <div style={{ ...S.card, marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
          <Badge text={bid.department || "Federal"} color={C.blue} />
          <UrgencyBadge days={days} />
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: "0 0 2px" }}>{bid.title}</p>
        <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Due: {fmtDate(bid.responseDeadLine)}{bid.naicsCode && ` · NAICS ${bid.naicsCode}`}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
        {bid.uiLink && <a href={bid.uiLink} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: C.amber, textDecoration: "none", fontWeight: 600 }}>SAM.gov</a>}
        <button onClick={() => onRemove(bid.noticeId)} style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 5, padding: "3px 10px", fontSize: 11, cursor: "pointer" }}>Remove</button>
      </div>
    </div>
  );
}

// ─── AI TAKEOFF ───────────────────────────────────────────────────────────────
function AITakeoff({ items, setItems }: { items: any[]; setItems: React.Dispatch<React.SetStateAction<any[]>> }) {
  const [screen, setScreen] = useState(items.length > 0 ? "review" : "upload");
  const [files, setFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [summary, setSummary] = useState("");
  const [flags, setFlags] = useState<string[]>([]);
  const [filter, setFilter] = useState("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const addFiles = (f: FileList) => {
    const pdfs = Array.from(f).filter((x) => x.type === "application/pdf");
    setFiles((p) => { const n = new Set(p.map((x) => x.name)); return [...p, ...pdfs.filter((x) => !n.has(x.name))]; });
  };

  const analyze = async () => {
    if (files.length === 0) { setError("Upload at least one PDF."); return; }
    setAnalyzing(true); setProgress(0); setError("");
    timerRef.current = setInterval(() => setProgress((p) => Math.min(p + 8, 90)), 600);

    try {
      const data = await api.analyzePlans(files);
      clearInterval(timerRef.current);
      setProgress(100);
      setItems(data.items);
      setSummary(data.projectSummary || "");
      setFlags(data.generalFlags || []);
      setTimeout(() => { setScreen("review"); setAnalyzing(false); }, 400);
    } catch (e: any) {
      clearInterval(timerRef.current);
      setError(e.message);
      setAnalyzing(false);
      setProgress(0);
    }
  };

  const loadDemo = () => {
    setItems(DEMO_TAKEOFF);
    setSummary("Demo: Office TI takeoff loaded.");
    setFlags(["Life safety plan not uploaded"]);
    setScreen("review");
  };

  const updateItem = async (id: string, updates: any) => {
    setItems((prev: any[]) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
    try { await api.updateTakeoffItem(id, updates); } catch { /* local state already updated */ }
    setSelected(null);
  };

  const quick = (id: string, status: string) => {
    setItems((prev: any[]) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    api.updateTakeoffItem(id, { status }).catch(() => {});
  };

  const filtered = filter === "all" ? items : items.filter((i: any) => filter === "pending" ? i.status === "pending" : filter === "flagged" ? (i.evidence?.flags?.length || 0) > 0 : i.tier === filter || i.status === filter);
  const tierMeta: Record<string, { color: string; label: string }> = { high: { color: C.green, label: "High Confidence" }, review: { color: C.amber, label: "Review Required" }, manual: { color: C.red, label: "Manual Only" } };

  if (screen === "upload" || items.length === 0) {
    return (
      <div style={S.pageContent}>
        <div style={S.pageHeader}><h1 style={S.pageTitle}>AI Takeoff</h1><p style={{ color: C.muted, fontSize: 14, margin: 0 }}>Upload electrical plan PDFs — AI reads, measures, and organizes quantities in seconds</p></div>
        <div style={S.card}>
          <div style={{ border: `2px dashed ${C.border}`, borderRadius: 10, padding: "40px 24px", textAlign: "center", cursor: "pointer", background: C.surface2 }} onClick={() => inputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }} onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }} onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === "application/pdf"); if (droppedFiles.length > 0) { const dt = new DataTransfer(); droppedFiles.forEach(f => dt.items.add(f)); addFiles(dt.files); } }}>
            <input ref={inputRef} type="file" accept="application/pdf" multiple style={{ display: "none" }} onChange={(e) => e.target.files && addFiles(e.target.files)} />
            <div style={{ fontSize: 40, marginBottom: 8 }}>📄</div>
            <p style={{ color: C.text, fontWeight: 600, margin: 0 }}>Drag & drop or click to upload electrical PDFs</p>
            <p style={{ color: C.muted, fontSize: 13, margin: "4px 0 0" }}>Lighting plans, power plans, panel schedules, fixture schedules, specs</p>
          </div>
          {files.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {files.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: C.surface2, borderRadius: 6, marginBottom: 6 }}>
                  <span>📄</span><span style={{ flex: 1, fontSize: 13, color: C.text }}>{f.name}</span>
                  <span style={{ fontSize: 11, color: C.muted }}>{(f.size / 1024).toFixed(0)}KB</span>
                  <button onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }}>✕</button>
                </div>
              ))}
            </div>
          )}
          {error && <p style={{ color: C.red, fontSize: 13, margin: "8px 0 0" }}>{error}</p>}
          {analyzing ? (
            <div style={{ marginTop: 16 }}>
              <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${progress}%`, height: "100%", background: C.amber, transition: "width 0.4s" }} />
              </div>
              <p style={{ fontSize: 13, color: C.muted, margin: "8px 0 0", textAlign: "center" }}>AI analyzing plans... {progress}%</p>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button style={{ ...S.primaryBtn, flex: 1 }} onClick={analyze}>Run AI Takeoff {files.length > 0 ? `(${files.length} files)` : ""}</button>
              <button style={{ ...S.ghostBtn, flex: 1 }} onClick={loadDemo}>Load Demo</button>
            </div>
          )}
          <div style={{ marginTop: 16, padding: 14, background: C.surface2, borderRadius: 8, border: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.7 }}>
              <strong style={{ color: C.amber }}>Best results:</strong> Include lighting plan, power plan, panel schedule, fixture schedule, and spec section 16xxx. The more context, the higher the confidence scores.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.pageContent}>
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.pageTitle}>AI Takeoff Review</h1>
          {summary && <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>{summary}</p>}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {[{ l: "Approved", v: items.filter((i: any) => i.status === "approved" || i.status === "modified").length, c: C.green }, { l: "Pending", v: items.filter((i: any) => i.status === "pending").length, c: C.amber }, { l: "Rejected", v: items.filter((i: any) => i.status === "rejected").length, c: C.red }].map((s) => (
            <div key={s.l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: s.c, fontFamily: "monospace" }}>{s.v}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{s.l}</div>
            </div>
          ))}
          <button style={S.ghostBtn} onClick={() => { setItems([]); setFiles([]); setScreen("upload"); }}>New Takeoff</button>
        </div>
      </div>
      {flags.length > 0 && (
        <div style={{ ...S.card, borderColor: C.amber + "40", marginBottom: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ color: C.amber, fontSize: 16 }}>⚑</span>
          <div>{flags.map((f, i) => <div key={i} style={{ fontSize: 12, color: C.amber, padding: "1px 0" }}>{f}</div>)}</div>
        </div>
      )}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[["all", `All (${items.length})`], ["pending", `Pending (${items.filter((i: any) => i.status === "pending").length})`], ["high", "High Conf"], ["review", "Review"], ["manual", "Manual"], ["approved", "Approved"], ["flagged", "Flagged"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ ...S.ghostBtn, fontSize: 12, padding: "5px 12px", ...(filter === v ? { background: C.amber + "18", borderColor: C.amber, color: C.amber } : {}) }}>
            {l}
          </button>
        ))}
      </div>
      {["high", "review", "manual"].map((tier) => {
        const tierItems = filtered.filter((i: any) => i.tier === tier);
        if (tierItems.length === 0) return null;
        const m = tierMeta[tier];
        return (
          <div key={tier} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${m.color}30` }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: m.color, letterSpacing: "0.04em" }}>{m.label.toUpperCase()}</h3>
              <span style={{ fontSize: 12, color: C.muted }}>{tierItems.length} items</span>
              {tier !== "manual" && <button style={{ marginLeft: "auto", fontSize: 11, background: C.surface2, border: `1px solid ${C.border}`, color: C.green, borderRadius: 5, padding: "3px 10px", cursor: "pointer" }} onClick={() => tierItems.filter((i: any) => i.status === "pending").forEach((i: any) => quick(i.id, "approved"))}>Approve All Pending</button>}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["Description", "Qty", "Unit", "Confidence", "Source", "Status", ""].map((h) => <th key={h} style={{ textAlign: "left", padding: "6px 10px", fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.06em", borderBottom: `1px solid ${C.border}`, background: C.surface, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {tierItems.map((item: any) => {
                    const dq = item.userQty !== null ? item.userQty : item.quantity;
                    const modified = item.userQty !== null && item.userQty !== item.quantity;
                    return (
                      <tr key={item.id} style={{ opacity: item.status === "rejected" ? 0.35 : 1, background: item.status === "approved" || item.status === "modified" ? "#05180a" : item.status === "rejected" ? "#180505" : "transparent" }}>
                        <td style={{ padding: "10px", borderBottom: `1px solid ${C.border}`, maxWidth: 280 }}>
                          <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{item.description}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>{item.category}</div>
                          {item.notes && <div style={{ fontSize: 11, color: C.blue, marginTop: 2 }}>{item.notes.slice(0, 40)}{item.notes.length > 40 ? "..." : ""}</div>}
                          {(item.evidence?.flags?.length || 0) > 0 && <div style={{ fontSize: 10, color: C.amber, marginTop: 2 }}>{item.evidence.flags.length} flag{item.evidence.flags.length > 1 ? "s" : ""}</div>}
                        </td>
                        <td style={{ padding: "10px", borderBottom: `1px solid ${C.border}`, fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: modified ? C.blue : item.quantity === 0 ? C.muted : C.text, whiteSpace: "nowrap" }}>
                          {item.quantity === 0 && item.tier === "manual" ? "TBD" : dq.toLocaleString()}{modified && <span style={{ fontSize: 10, color: C.blue }}> ✎</span>}
                        </td>
                        <td style={{ padding: "10px", borderBottom: `1px solid ${C.border}`, fontSize: 12, color: C.muted }}>{item.unit}</td>
                        <td style={{ padding: "10px", borderBottom: `1px solid ${C.border}`, minWidth: 100 }}><ConfBar value={item.confidence} /></td>
                        <td style={{ padding: "10px", borderBottom: `1px solid ${C.border}`, fontSize: 11, color: C.muted, maxWidth: 160 }}>{item.evidence?.sourceSheet || "—"}</td>
                        <td style={{ padding: "10px", borderBottom: `1px solid ${C.border}` }}>
                          <Badge text={item.status.toUpperCase()} color={item.status === "approved" || item.status === "modified" ? C.green : item.status === "rejected" ? C.red : C.muted} />
                        </td>
                        <td style={{ padding: "10px", borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>
                          {item.status === "pending" && tier !== "manual" && <>
                            <button onClick={() => quick(item.id, "approved")} style={{ background: "#052e16", border: "none", color: C.green, borderRadius: 4, padding: "4px 8px", fontSize: 12, cursor: "pointer", marginRight: 4 }}>✓</button>
                            <button onClick={() => quick(item.id, "rejected")} style={{ background: "#180505", border: "none", color: C.red, borderRadius: 4, padding: "4px 8px", fontSize: 12, cursor: "pointer", marginRight: 4 }}>✕</button>
                          </>}
                          <button onClick={() => setSelected(item)} style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 4, padding: "4px 8px", fontSize: 12, cursor: "pointer" }}>Edit</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "#00000080", zIndex: 200, display: "flex", justifyContent: "flex-end" }} onClick={() => setSelected(null)}>
          <div style={{ background: C.surface, borderLeft: `1px solid ${C.border}`, width: "100%", maxWidth: 460, padding: 24, overflowY: "auto", height: "100vh", boxSizing: "border-box" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>{selected.description}</h3>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: C.muted, fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            <ConfBar value={selected.confidence} />
            {[["SOURCE SHEET", selected.evidence?.sourceSheet], ["SCALE BASIS", selected.evidence?.scaleBasis], ["PATH / MEASUREMENT", selected.evidence?.pathDescription]].map(([l, v]) => v ? (
              <div key={l} style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.08em", marginBottom: 4 }}>{l}</div>
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{v}</div>
              </div>
            ) : null)}
            {selected.evidence?.assumptions?.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.08em", marginBottom: 4 }}>ASSUMPTIONS</div>
                {selected.evidence.assumptions.map((a: string, i: number) => <div key={i} style={{ fontSize: 12, color: C.amber, padding: "2px 0" }}>{a}</div>)}
              </div>
            )}
            {selected.evidence?.flags?.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.08em", marginBottom: 4 }}>FLAGS</div>
                {selected.evidence.flags.map((f: string, i: number) => <div key={i} style={{ fontSize: 12, color: C.red, padding: "2px 0" }}>{f}</div>)}
              </div>
            )}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              <EditDrawer item={selected} onSave={(status, qty, notes, cost) => { updateItem(selected.id, { status, userQty: qty !== selected.quantity ? qty : null, notes, unitCost: cost }); }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditDrawer({ item, onSave }: { item: any; onSave: (status: string, qty: number, notes: string, cost: number) => void }) {
  const [qty, setQty] = useState(item.userQty ?? item.quantity);
  const [notes, setNotes] = useState(item.notes);
  const [cost, setCost] = useState(item.unitCost);
  return (
    <>
      <div style={S.field}><label style={S.label}>QUANTITY</label>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="number" style={{ ...S.input, fontFamily: "monospace", fontSize: 18, fontWeight: 700 }} value={qty} onChange={(e) => setQty(parseFloat(e.target.value) || 0)} />
          <span style={{ color: C.muted }}>{item.unit}</span>
        </div>
      </div>
      <div style={S.field}><label style={S.label}>UNIT COST ($)</label><input type="number" style={{ ...S.input, fontFamily: "monospace" }} value={cost} onChange={(e) => setCost(parseFloat(e.target.value) || 0)} /></div>
      {cost > 0 && qty > 0 && <div style={{ fontSize: 13, color: C.amber, fontFamily: "monospace", margin: "4px 0 8px" }}>Extended: ${(qty * cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>}
      <div style={S.field}><label style={S.label}>NOTES</label><textarea style={{ ...S.input, minHeight: 60, resize: "vertical" } as any} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Field notes, measurements, vendor quotes..." /></div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button style={{ ...S.primaryBtn, flex: 1, padding: 10 }} onClick={() => onSave("approved", qty, notes, cost)}>Approve</button>
        <button style={{ ...S.ghostBtn, flex: 1, padding: 10, color: C.blue, borderColor: C.blue + "40" }} onClick={() => onSave("modified", qty, notes, cost)}>Save Edit</button>
        <button style={{ ...S.ghostBtn, flex: 1, padding: 10, color: C.red, borderColor: C.red + "40" }} onClick={() => onSave("rejected", qty, notes, cost)}>Reject</button>
      </div>
    </>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
function Profile({ profile, setProfile }: { profile: any; setProfile: (p: any) => void }) {
  const [form, setForm] = useState({ ...profile });
  const [saved, setSaved] = useState(false);
  const set = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));
  const save = () => { setProfile(form); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const fields: [string, string][] = [["name", "Your Name"], ["company", "Company Name"], ["uei", "UEI Number"], ["cage", "CAGE Code"], ["naics", "Primary NAICS"], ["phone", "Phone"], ["email", "Email"], ["address", "Business Address"]];
  return (
    <div style={S.pageContent}>
      <div style={S.pageHeader}><h1 style={S.pageTitle}>My Profile</h1><p style={{ color: C.muted, fontSize: 14, margin: 0 }}>Your info is used to auto-fill federal bid forms</p></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        <div>
          <div style={S.card}>
            <h3 style={S.cardTitle}>Company Information</h3>
            <div style={S.grid2}>
              {fields.slice(0, 6).map(([k, l]) => <div key={k} style={S.field}><label style={S.label}>{l.toUpperCase()}</label><input style={S.input} value={form[k] || ""} onChange={(e) => set(k, e.target.value)} placeholder={l} /></div>)}
            </div>
            {fields.slice(6).map(([k, l]) => <div key={k} style={S.field}><label style={S.label}>{l.toUpperCase()}</label><input style={S.input} value={form[k] || ""} onChange={(e) => set(k, e.target.value)} placeholder={l} /></div>)}
          </div>
          <button style={{ ...S.primaryBtn, marginTop: 12, ...(saved ? { background: C.green } : {}) }} onClick={save}>{saved ? "Saved!" : "Save Profile"}</button>
        </div>
        <div style={S.card}>
          <h3 style={S.cardTitle}>Auto-Fill Reference</h3>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>One-click copy for SAM.gov bid forms</p>
          {[["Company", form.company], ["UEI", form.uei], ["CAGE", form.cage], ["NAICS", form.naics], ["Contact", form.name], ["Phone", form.phone], ["Email", form.email], ["Address", form.address]].filter(([, v]) => v).map(([l, v]) => (
            <CopyRow key={l} label={l} value={v} />
          ))}
          {!form.uei && <p style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>Fill in your profile to see auto-fill fields here.</p>}
        </div>
      </div>
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.surface2, borderRadius: 7, padding: "9px 12px", marginBottom: 6 }}>
      <span style={{ fontSize: 11, color: C.muted, width: 70, flexShrink: 0 }}>{label}</span>
      <span style={{ flex: 1, fontSize: 13, color: C.text }}>{value}</span>
      <button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        style={{ background: "none", border: `1px solid ${copied ? C.green : C.border}`, color: copied ? C.green : C.muted, borderRadius: 5, padding: "3px 10px", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" }}>
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

// ─── WIN INTELLIGENCE ────────────────────────────────────────────────────────
function fmt$(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function WinIntel({ profile }: { profile: any }) {
  const [naics, setNaics] = useState(profile?.naics || "238210");
  const [state, setState] = useState("TX");
  const [dateRange, setDateRange] = useState("1yr");
  const [summary, setSummary] = useState<any>(null);
  const [awards, setAwards] = useState<any[]>([]);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loadingSum, setLoadingSum] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!naics || !state) return;
    setError("");
    setLoadingSum(true);
    setLoadingAll(true);
    setSearched(true);

    const years = dateRange === "5yr" ? 5 : dateRange === "3yr" ? 3 : 1;

    api.getIntelSummary(naics, state)
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoadingSum(false));

    Promise.all([
      api.getIntelAwards({ naics, state, dateRange, limit: 20 }),
      api.getIntelTopRecipients({ naics, state, years }),
      api.getIntelAgencySpending({ naics, state }),
    ])
      .then(([aw, rec, ag]) => {
        setAwards(aw.awards || []);
        setRecipients(rec.recipients || []);
        setAgencies(ag.agencies || []);
      })
      .catch(() => setError("Data temporarily unavailable — USAspending may be slow. Try again."))
      .finally(() => setLoadingAll(false));
  };

  const maxAgencyTotal = agencies.reduce((m, a) => Math.max(m, a.total), 1);

  return (
    <div style={S.pageContent}>
      {/* Header */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.pageTitle}>Win Intelligence</h1>
          <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>
            Real federal award data — see what wins before you bid
          </p>
        </div>
      </div>

      {/* Callout */}
      <div style={{ background: C.amber + "14", border: `1px solid ${C.amber}40`, borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
        <div style={{ fontWeight: 700, color: C.amber, fontSize: 14, marginBottom: 4 }}>
          Know what actually wins before you bid.
        </div>
        <div style={{ fontSize: 13, color: C.muted2, lineHeight: 1.5 }}>
          See real award data for electrical work in your area — historical averages, top competitors, and agency spending patterns. Sourced from USAspending.gov (federal contracts database).
        </div>
      </div>

      {/* Filters */}
      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: "0.06em", marginBottom: 14 }}>SEARCH FILTERS</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, alignItems: "flex-end" }}>
          <div>
            <label style={S.label}>NAICS CODE</label>
            <input style={S.input} value={naics} onChange={(e) => setNaics(e.target.value)} placeholder="e.g. 238210" />
          </div>
          <div>
            <label style={S.label}>STATE</label>
            <input style={S.input} value={state} onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))} placeholder="e.g. TX" maxLength={2} />
          </div>
          <div>
            <label style={S.label}>DATE RANGE</label>
            <select style={{ ...S.input, cursor: "pointer" }} value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="1yr">Last 1 Year</option>
              <option value="3yr">Last 3 Years</option>
              <option value="5yr">Last 5 Years</option>
            </select>
          </div>
          <button style={S.primaryBtn} onClick={search} disabled={loadingAll || loadingSum}>
            {loadingAll ? "Loading…" : "Search"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: C.red + "18", border: `1px solid ${C.red}40`, borderRadius: 10, padding: "12px 16px", marginBottom: 20, color: C.red, fontSize: 13 }}>
          {error}
        </div>
      )}

      {!searched && (
        <div style={S.empty}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>◎</div>
          <div style={{ color: C.muted, fontSize: 15 }}>Enter your NAICS code and state, then click Search.</div>
        </div>
      )}

      {searched && (
        <>
          {/* Stats Cards */}
          <div style={S.statsGrid}>
            {[
              { label: "TOTAL $ AWARDED (LAST 12MO)", value: loadingSum ? "…" : summary ? fmt$(summary.totalDollars) : "—", color: C.amber },
              { label: "NUMBER OF AWARDS", value: loadingSum ? "…" : summary ? summary.totalAwards?.toLocaleString() ?? "—" : "—", color: C.blue },
              { label: "AVG AWARD SIZE", value: loadingSum ? "…" : summary ? fmt$(summary.avgAwardSize) : "—", color: C.green },
              { label: "UNIQUE CONTRACTORS", value: loadingSum ? "…" : summary ? summary.uniqueRecipients : "—", color: C.muted2 },
            ].map((s) => (
              <div key={s.label} style={{ ...S.statCard, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.07em", marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Top Recipients + Agency Spending */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16, marginBottom: 16 }}>
            {/* Top Recipients */}
            <div style={S.card}>
              <div style={S.cardTitle}>TOP RECIPIENTS</div>
              {loadingAll ? (
                <div style={{ color: C.muted, fontSize: 13, padding: "16px 0" }}>Loading…</div>
              ) : recipients.length === 0 ? (
                <div style={{ color: C.muted, fontSize: 13 }}>No data found.</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ color: C.muted, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em" }}>
                      {["#", "CONTRACTOR", "TOTAL WON", "AWARDS", "AVG SIZE"].map((h) => (
                        <th key={h} style={{ textAlign: h === "#" ? "center" : "left", paddingBottom: 8, fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recipients.map((r) => (
                      <tr key={r.rank} style={{ borderTop: `1px solid ${C.border}` }}>
                        <td style={{ padding: "8px 4px", textAlign: "center", color: C.muted, fontWeight: 700 }}>{r.rank}</td>
                        <td style={{ padding: "8px 4px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ color: C.text }}>{r.name}</span>
                            {r.hot && <Badge text="HOT" color={C.red} />}
                          </div>
                        </td>
                        <td style={{ padding: "8px 4px", color: C.amber, fontWeight: 700 }}>{fmt$(r.total)}</td>
                        <td style={{ padding: "8px 4px", color: C.muted2 }}>{r.awards}</td>
                        <td style={{ padding: "8px 4px", color: C.muted2 }}>{fmt$(r.avgSize)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Agency Spending Chart */}
            <div style={S.card}>
              <div style={S.cardTitle}>TOP AGENCIES BY SPEND</div>
              {loadingAll ? (
                <div style={{ color: C.muted, fontSize: 13, padding: "16px 0" }}>Loading…</div>
              ) : agencies.length === 0 ? (
                <div style={{ color: C.muted, fontSize: 13 }}>No data found.</div>
              ) : (
                <div>
                  {agencies.map((a, i) => (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 13, color: C.text, flex: 1, paddingRight: 8 }}>{a.name}</span>
                        <span style={{ fontSize: 13, color: C.amber, fontWeight: 700, whiteSpace: "nowrap" }}>{fmt$(a.total)}</span>
                      </div>
                      <div style={{ height: 8, background: C.border, borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${(a.total / maxAgencyTotal) * 100}%`, height: "100%", background: i === 0 ? C.amber : C.blue, borderRadius: 4, transition: "width 0.4s ease" }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>Last 12 months · NAICS {naics} · {state}</div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Awards */}
          <div style={S.card}>
            <div style={S.cardTitle}>RECENT AWARDS</div>
            {loadingAll ? (
              <div style={{ color: C.muted, fontSize: 13, padding: "16px 0" }}>Loading…</div>
            ) : awards.length === 0 ? (
              <div style={{ color: C.muted, fontSize: 13 }}>No awards found for this NAICS + state combination.</div>
            ) : (
              awards.map((a) => (
                <div key={a.id} style={{ borderTop: `1px solid ${C.border}`, padding: "12px 0" }}>
                  <div
                    style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", cursor: "pointer", gap: 12 }}
                    onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 3 }}>{a.recipient || "—"}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>
                        {a.agency || "—"} · {a.actionDate ? new Date(a.actionDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Date N/A"}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: C.amber }}>{fmt$(a.amount || 0)}</span>
                      <span style={{ color: C.muted, fontSize: 12 }}>{expandedId === a.id ? "▲" : "▼"}</span>
                    </div>
                  </div>
                  {expandedId === a.id && (
                    <div style={{ marginTop: 12, padding: "12px 14px", background: C.surface2, borderRadius: 8 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: a.description ? 12 : 0 }}>
                        <div>
                          <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 3 }}>AWARD ID</div>
                          <div style={{ fontSize: 12, color: C.text, fontFamily: "monospace" }}>{a.id || "—"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 3 }}>PERF START</div>
                          <div style={{ fontSize: 12, color: C.text }}>{a.startDate || "—"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 3 }}>PERF END</div>
                          <div style={{ fontSize: 12, color: C.text }}>{a.endDate || "—"}</div>
                        </div>
                      </div>
                      {a.description && (
                        <div>
                          <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 3 }}>DESCRIPTION</div>
                          <div style={{ fontSize: 12, color: C.muted2, lineHeight: 1.5 }}>{a.description}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [trackedBids, setTrackedBids] = useState<any[]>([]);
  const [takeoffItems, setTakeoffItems] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>({});

  // Check for existing session on mount
  useEffect(() => {
    if (api.isLoggedIn()) {
      api.getMe().then((u) => {
        setUser(u);
        setProfile(u);
        return api.getTrackedBids();
      }).then((bids) => {
        setTrackedBids(bids.map(normalizeBid));
      }).catch(() => {
        api.logout();
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const onAuth = (u: any) => {
    setUser(u);
    setProfile(u);
    api.getTrackedBids().then((bids) => setTrackedBids(bids.map(normalizeBid))).catch(() => {});
  };

  const onTrack = async (bid: any) => {
    const exists = trackedBids.some((b) => b.noticeId === bid.noticeId);
    if (exists) {
      setTrackedBids((p) => p.filter((b) => b.noticeId !== bid.noticeId));
      api.untrackBid(bid.noticeId).catch(() => {});
    } else {
      const normalized = normalizeBid(bid);
      setTrackedBids((p) => [...p, normalized]);
      api.trackBid({
        noticeId: bid.noticeId,
        title: bid.title,
        department: bid.department,
        naicsCode: bid.naicsCode,
        responseDeadline: bid.responseDeadLine || bid.responseDeadline,
        postedDate: bid.postedDate,
        typeOfSetAside: bid.typeOfSetAside,
        baseType: bid.baseType,
        state: bid.placeOfPerformance?.state?.code,
        city: bid.placeOfPerformance?.city?.name,
        description: bid.description,
        uiLink: bid.uiLink,
      }).catch(() => {});
    }
  };

  const onRemove = (noticeId: string) => {
    setTrackedBids((p) => p.filter((b) => b.noticeId !== noticeId));
    api.untrackBid(noticeId).catch(() => {});
  };

  const onLogout = () => {
    api.logout();
    setUser(null);
    setTrackedBids([]);
    setTakeoffItems([]);
    setProfile({});
  };

  const urgentCount = trackedBids.filter((b) => { const d = daysUntil(b.responseDeadLine); return d !== null && d <= 7; }).length;

  if (loading) {
    return <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: C.amber, fontSize: 24 }}>⚡</div></div>;
  }

  if (!user) {
    return <AuthScreen onAuth={onAuth} />;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <Sidebar tab={tab} setTab={setTab} urgentCount={urgentCount} onLogout={onLogout} />
      <div style={{ flex: 1, overflow: "auto" }}>
        {tab === "dashboard" && <Dashboard trackedBids={trackedBids} takeoffItems={takeoffItems} profile={profile} setTab={setTab} />}
        {tab === "search" && <ContractSearch trackedBids={trackedBids} onTrack={onTrack} useApi={!!user} />}
        {tab === "tracker" && <BidTracker trackedBids={trackedBids} onRemove={onRemove} />}
        {tab === "takeoff" && <AITakeoff items={takeoffItems} setItems={setTakeoffItems} />}
        {tab === "intel" && <WinIntel profile={profile} />}
        {tab === "profile" && <Profile profile={profile} setProfile={setProfile} />}
      </div>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  onboardWrap: { minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans','Segoe UI',sans-serif" },
  onboardCard: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 40, maxWidth: 520, width: "100%" },
  onboardHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 28 },
  logoMark: { fontSize: 28, background: C.amber, borderRadius: 10, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" },
  logoText: { fontWeight: 900, fontSize: 20, color: C.amber },
  sidebar: { width: 220, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", minHeight: "100vh", flexShrink: 0 },
  sidebarLogo: { display: "flex", alignItems: "center", gap: 10, padding: "18px 16px", borderBottom: `1px solid ${C.border}` },
  navItem: { display: "flex", alignItems: "center", gap: 10, width: "100%", background: "none", border: "none", color: C.muted, padding: "10px 12px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500, textAlign: "left" as const, margin: "2px 0" },
  navItemActive: { background: C.amber + "18", color: C.amber, fontWeight: 700 },
  navBadge: { background: C.red, color: "#fff", borderRadius: 10, fontSize: 10, padding: "1px 5px", fontWeight: 700 },
  pageContent: { padding: "28px 32px", maxWidth: 1100, margin: "0 auto" },
  pageHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap" as const, gap: 12 },
  pageTitle: { fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 4px", letterSpacing: "-0.3px" },
  card: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 16 },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  cardTitle: { fontSize: 13, fontWeight: 700, color: C.muted2, letterSpacing: "0.04em", margin: "0 0 16px" },
  cardLink: { background: "none", border: "none", color: C.amber, fontSize: 12, cursor: "pointer", fontWeight: 600 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 },
  statCard: { background: C.surface, borderRadius: 10, padding: "16px 18px" },
  listRow: { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` },
  sectionTitle: { fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: "0.06em", margin: "0 0 10px" },
  empty: { textAlign: "center" as const, padding: "60px 24px" },
  field: { marginBottom: 12 },
  label: { display: "block", fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.08em", marginBottom: 4 },
  input: { width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, padding: "10px 12px", color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 },
  primaryBtn: { background: C.amber, color: "#000", border: "none", borderRadius: 8, padding: "11px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" },
  secondaryBtn: { background: C.surface2, color: C.muted2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" },
  ghostBtn: { background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 7, padding: "8px 14px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" },
  backBtn: { background: "none", border: "none", color: C.amber, fontSize: 13, cursor: "pointer", fontWeight: 600, marginBottom: 16, padding: 0 },
};
