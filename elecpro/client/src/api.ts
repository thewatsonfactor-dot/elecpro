const BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("elecpro_token");
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

async function handleRes(res: Response) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

// Auth
export async function register(body: Record<string, string>) {
  const res = await fetch(`${BASE}/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await handleRes(res);
  localStorage.setItem("elecpro_token", data.token);
  return data;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${BASE}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  const data = await handleRes(res);
  localStorage.setItem("elecpro_token", data.token);
  return data;
}

export async function getMe() {
  const res = await fetch(`${BASE}/auth/me`, { headers: authHeaders() });
  return handleRes(res);
}

export function logout() {
  localStorage.removeItem("elecpro_token");
}

export function isLoggedIn() {
  return !!getToken();
}

// Analyze (PDF upload)
export async function analyzePlans(files: File[], projectName?: string) {
  const form = new FormData();
  files.forEach((f) => form.append("plans", f));
  if (projectName) form.append("projectName", projectName);
  const token = getToken();
  const res = await fetch(`${BASE}/analyze`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  return handleRes(res);
}

// SAM.gov search
export async function searchSam(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}/sam/search?${qs}`, { headers: authHeaders() });
  return handleRes(res);
}

// Tracked bids
export async function getTrackedBids() {
  const res = await fetch(`${BASE}/bids`, { headers: authHeaders() });
  return handleRes(res);
}

export async function trackBid(bid: Record<string, any>) {
  const res = await fetch(`${BASE}/bids`, { method: "POST", headers: authHeaders(), body: JSON.stringify(bid) });
  return handleRes(res);
}

export async function untrackBid(noticeId: string) {
  const res = await fetch(`${BASE}/bids/${encodeURIComponent(noticeId)}`, { method: "DELETE", headers: authHeaders() });
  return handleRes(res);
}

// Takeoff sessions
export async function getTakeoffSessions() {
  const res = await fetch(`${BASE}/takeoff`, { headers: authHeaders() });
  return handleRes(res);
}

export async function getTakeoffSession(id: string) {
  const res = await fetch(`${BASE}/takeoff/${id}`, { headers: authHeaders() });
  return handleRes(res);
}

export async function updateTakeoffItem(id: string, updates: Record<string, any>) {
  const res = await fetch(`${BASE}/takeoff/items/${id}`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify(updates) });
  return handleRes(res);
}

// Win Intelligence
export async function getIntelSummary(naics: string, state: string) {
  const res = await fetch(`${BASE}/intel/summary?naics=${encodeURIComponent(naics)}&state=${encodeURIComponent(state)}`, { headers: authHeaders() });
  return handleRes(res);
}

export async function getIntelAwards(body: Record<string, any>) {
  const res = await fetch(`${BASE}/intel/awards`, { method: "POST", headers: authHeaders(), body: JSON.stringify(body) });
  return handleRes(res);
}

export async function getIntelTopRecipients(body: Record<string, any>) {
  const res = await fetch(`${BASE}/intel/top-recipients`, { method: "POST", headers: authHeaders(), body: JSON.stringify(body) });
  return handleRes(res);
}

export async function getIntelAgencySpending(body: Record<string, any>) {
  const res = await fetch(`${BASE}/intel/agency-spending`, { method: "POST", headers: authHeaders(), body: JSON.stringify(body) });
  return handleRes(res);
}
