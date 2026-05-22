// Mock data + helpers for the SafeTrek demo. Centralized so screens stay clean.
import { AlertTriangle, ShieldCheck, Hospital, Building2, Camera, Users } from "lucide-react";

export type ZoneType = "safe" | "warn" | "danger";

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  center: [number, number]; // [lat, lng]
  radius: number; // meters
  reason: string;
}

export interface POI {
  id: string;
  name: string;
  kind: "police" | "hospital" | "embassy";
  position: [number, number];
}

export interface Incident {
  id: string;
  type: "Theft" | "Harassment" | "Unsafe Area" | "Scam" | "Medical";
  description: string;
  position: [number, number];
  timeAgo: string;
  reporter: string;
  severity: ZoneType;
  /** unix ms — when the report was filed (for recency-weighted heatmap) */
  reportedAt?: number;
}

export interface SafetyAlert {
  id: string;
  title: string;
  detail: string;
  severity: ZoneType;
  time: string;
  icon: typeof AlertTriangle;
}

// Centered around Connaught Place, New Delhi (works as a believable demo location)
export const USER_LOCATION: [number, number] = [28.6315, 77.2167];

export const ZONES: Zone[] = [
  { id: "z1", name: "Connaught Place", type: "safe", center: [28.6315, 77.2167], radius: 600, reason: "Tourist hub, high police presence" },
  { id: "z2", name: "Janpath Market", type: "safe", center: [28.6256, 77.2192], radius: 350, reason: "Well-lit, crowded shopping area" },
  { id: "z3", name: "Paharganj Backstreets", type: "warn", center: [28.6450, 77.2125], radius: 500, reason: "Reports of scams targeting tourists" },
  { id: "z4", name: "Old Delhi Lanes", type: "warn", center: [28.6562, 77.2410], radius: 700, reason: "Crowded, pickpocket alerts after dusk" },
  { id: "z5", name: "Industrial Outskirts", type: "danger", center: [28.6180, 77.2480], radius: 600, reason: "Low lighting, recent theft incidents" },
  { id: "z6", name: "Construction Zone", type: "danger", center: [28.6380, 77.1980], radius: 400, reason: "Restricted area, avoid after 8 PM" },
];

export const POIS: POI[] = [
  { id: "p1", name: "Parliament St. Police Stn.", kind: "police", position: [28.6275, 77.2138] },
  { id: "p2", name: "Connaught Place Police", kind: "police", position: [28.6330, 77.2200] },
  { id: "p3", name: "Ram Manohar Lohia Hospital", kind: "hospital", position: [28.6260, 77.2050] },
  { id: "p4", name: "Lady Hardinge Med. College", kind: "hospital", position: [28.6440, 77.2090] },
  { id: "p5", name: "US Embassy", kind: "embassy", position: [28.5985, 77.1860] },
];

export const INCIDENTS: Incident[] = [
  { id: "i1", type: "Theft", description: "Phone snatched near metro exit", position: [28.6340, 77.2185], timeAgo: "2h ago", reporter: "Anonymous", severity: "danger" },
  { id: "i2", type: "Scam", description: "Fake tour guide asking for upfront cash", position: [28.6290, 77.2210], timeAgo: "4h ago", reporter: "Maya R.", severity: "warn" },
  { id: "i3", type: "Harassment", description: "Group of men following solo female tourist", position: [28.6450, 77.2130], timeAgo: "Yesterday", reporter: "Anonymous", severity: "danger" },
  { id: "i4", type: "Unsafe Area", description: "Poor street lighting, broken pavements", position: [28.6195, 77.2470], timeAgo: "2d ago", reporter: "Carlos M.", severity: "warn" },
];

export const ALERTS: SafetyAlert[] = [
  { id: "a1", title: "High risk after 9 PM", detail: "Your area drops to a Caution score after dark — stick to lit streets.", severity: "warn", time: "Now", icon: AlertTriangle },
  { id: "a2", title: "Avoid Industrial Outskirts", detail: "3 theft reports in the last 48h within 1 km.", severity: "danger", time: "12 min ago", icon: AlertTriangle },
  { id: "a3", title: "You entered a safe zone", detail: "Connaught Place is rated 87/100 — enjoy your visit!", severity: "safe", time: "1h ago", icon: ShieldCheck },
  { id: "a4", title: "Crowd density rising", detail: "Janpath Market is unusually busy — watch for pickpockets.", severity: "warn", time: "2h ago", icon: Users },
];

// ---------- Safety score logic (mock AI) ----------
export interface ScoreBreakdown {
  score: number;
  label: string;
  tone: ZoneType;
  factors: { name: string; impact: number; note: string }[];
}

export function computeSafetyScore(date = new Date()): ScoreBreakdown {
  const hour = date.getHours();
  const isNight = hour >= 21 || hour < 6;
  const isEvening = hour >= 18 && hour < 21;

  let score = 92;
  const factors: ScoreBreakdown["factors"] = [];

  if (isNight) {
    score -= 28;
    factors.push({ name: "Time of day", impact: -28, note: "Late night — visibility low" });
  } else if (isEvening) {
    score -= 12;
    factors.push({ name: "Time of day", impact: -12, note: "Evening hours" });
  } else {
    factors.push({ name: "Time of day", impact: 0, note: "Daytime — optimal" });
  }

  // Crowd density (mocked)
  score -= 6;
  factors.push({ name: "Crowd density", impact: -6, note: "Moderate foot traffic nearby" });

  // Recent incidents
  score -= 8;
  factors.push({ name: "Nearby incidents", impact: -8, note: "1 report within 500m (24h)" });

  // Area baseline
  score += 4;
  factors.push({ name: "Area reputation", impact: +4, note: "Tourist-friendly district" });

  score = Math.max(5, Math.min(100, score));

  const tone: ZoneType = score >= 75 ? "safe" : score >= 45 ? "warn" : "danger";
  const label = tone === "safe" ? "Safe" : tone === "warn" ? "Caution" : "High risk";

  return { score, label, tone, factors };
}

export const POI_META: Record<POI["kind"], { label: string; icon: typeof Building2; color: string }> = {
  police: { label: "Police", icon: Building2, color: "hsl(var(--primary))" },
  hospital: { label: "Hospital", icon: Hospital, color: "hsl(var(--danger))" },
  embassy: { label: "Embassy", icon: ShieldCheck, color: "hsl(var(--safe))" },
};

export const INCIDENT_ICON = Camera;

// ---------- Zone color helpers ----------
export const ZONE_COLOR: Record<ZoneType, { fill: string; stroke: string; label: string }> = {
  safe: { fill: "hsl(152 65% 40% / 0.18)", stroke: "hsl(152 65% 35%)", label: "Safe" },
  warn: { fill: "hsl(38 95% 52% / 0.22)", stroke: "hsl(38 95% 45%)", label: "Caution" },
  danger: { fill: "hsl(0 78% 55% / 0.22)", stroke: "hsl(0 78% 48%)", label: "Danger" },
};
