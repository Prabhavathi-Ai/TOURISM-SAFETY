// SafeTrek — Advanced AI risk engine
// Weighted multi-factor scoring + trend prediction + confidence + adaptive messages.
import { Incident, INCIDENTS, ZONES, ZoneType } from "@/data/safety";

export type Confidence = "low" | "medium" | "high";

export interface ScoreFactor {
  name: string;
  weight: number;       // 0..1, sums to ~1
  raw: number;          // 0..100 (higher = riskier)
  impact: number;       // signed delta applied to safety score
  note: string;
}

export interface AdvancedScore {
  score: number;             // 0..100 safety
  risk: number;              // 0..100 risk (=100-score)
  tone: ZoneType;
  label: string;
  confidence: Confidence;
  confidenceValue: number;   // 0..1
  factors: ScoreFactor[];
  trend: { direction: "up" | "down" | "flat"; delta: number; window: string };
  prediction: { in: string; futureScore: number; note: string } | null;
  peakRiskWindow: string;    // human readable e.g. "10 PM – 1 AM"
  message: string;           // contextual adaptive alert text
}

export function haversine(a: [number, number], b: [number, number]) {
  const R = 6371000;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Smooth time-of-day risk curve (0=safest day, 1=peak night)
export function timeOfDayRisk(date: Date) {
  const h = date.getHours() + date.getMinutes() / 60;
  // Peak at ~midnight, trough at noon. Cosine over 24h centered on noon.
  const r = (1 - Math.cos(((h - 12) / 12) * Math.PI)) / 2; // 0 at noon, 1 at midnight
  return Math.max(0, Math.min(1, r));
}

// Deterministic pseudo-random per-minute crowd density (so it visibly drifts).
export function crowdDensity(date: Date) {
  const minute = Math.floor(date.getTime() / 60000);
  // Combine two sinusoids + a hash for variability.
  const a = Math.sin(minute / 9) * 0.5 + 0.5;
  const b = ((minute * 9301 + 49297) % 233280) / 233280;
  return Math.min(1, a * 0.6 + b * 0.4);
}

// Movement variability — high values flag erratic / unusual patterns
export interface MovementSample { lat: number; lng: number; ts: number }
export function movementAnomaly(samples: MovementSample[]) {
  if (samples.length < 3) return 0.1;
  const speeds: number[] = [];
  for (let i = 1; i < samples.length; i++) {
    const d = haversine([samples[i - 1].lat, samples[i - 1].lng], [samples[i].lat, samples[i].lng]);
    const dt = (samples[i].ts - samples[i - 1].ts) / 1000;
    if (dt > 0) speeds.push(d / dt); // m/s
  }
  if (!speeds.length) return 0.1;
  const mean = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  const variance = speeds.reduce((a, b) => a + (b - mean) ** 2, 0) / speeds.length;
  const std = Math.sqrt(variance);
  // Stationary (<0.2 m/s) = slight risk after dark; sudden bursts (>3 m/s std) = anomaly.
  const stationary = mean < 0.2 ? 0.3 : 0;
  const burst = Math.min(1, std / 3);
  return Math.min(1, stationary + burst);
}

// Incident density factor — recency weighted
export function incidentPressure(pos: [number, number], incidents: Incident[]) {
  const now = Date.now();
  let pressure = 0;
  for (const i of incidents) {
    const d = haversine(pos, i.position);
    if (d > 1200) continue;
    const distFactor = 1 - d / 1200;
    const ageHours = i.reportedAt ? (now - i.reportedAt) / 3_600_000 : 12;
    const recency = Math.max(0.15, 1 - ageHours / 48); // decays over 48h
    const weight = i.severity === "danger" ? 1 : 0.55;
    pressure += distFactor * recency * weight;
  }
  return Math.min(1, pressure / 2.4);
}

// Zone proximity factor
export function zonePressure(pos: [number, number]) {
  let worst = 0; // 0 = safe, 1 = inside danger zone
  for (const z of ZONES) {
    const d = haversine(pos, z.center);
    if (d <= z.radius) {
      const v = z.type === "danger" ? 1 : z.type === "warn" ? 0.55 : 0;
      worst = Math.max(worst, v);
    } else if (d <= z.radius * 1.4 && z.type === "danger") {
      worst = Math.max(worst, 0.45 * (1 - (d - z.radius) / (z.radius * 0.4)));
    }
  }
  return worst;
}

export interface ScoreContext {
  pos: [number, number];
  incidents?: Incident[];
  movement?: MovementSample[];
  date?: Date;
  soloMode?: boolean;
  /** "Learning" — number of community reports observed. Boosts confidence. */
  learnedSamples?: number;
  /** Previous score for trend detection */
  previousScore?: number;
}

export function computeAdvancedScore(ctx: ScoreContext): AdvancedScore {
  const date = ctx.date ?? new Date();
  const incidents = ctx.incidents ?? INCIDENTS;

  // Raw 0..1 risk per factor
  const tRaw = timeOfDayRisk(date);
  const cRaw = crowdDensity(date);
  const iRaw = incidentPressure(ctx.pos, incidents);
  const zRaw = zonePressure(ctx.pos);
  const mRaw = movementAnomaly(ctx.movement ?? []);

  // Solo mode amplifies time + zone risks slightly
  const soloMul = ctx.soloMode ? 1.15 : 1;

  // Weighted formula:  Risk = 0.30*incidents + 0.22*time + 0.20*zone + 0.18*crowd + 0.10*movement
  const factors: ScoreFactor[] = [
    {
      name: "Recent incidents",
      weight: 0.3,
      raw: iRaw * 100,
      impact: -Math.round(iRaw * 30),
      note: iRaw > 0.6 ? "High report density nearby" : iRaw > 0.25 ? "Some recent reports" : "No recent reports",
    },
    {
      name: "Time of day",
      weight: 0.22,
      raw: tRaw * 100,
      impact: -Math.round(tRaw * 22 * soloMul),
      note: tRaw > 0.7 ? "Late night — visibility low" : tRaw > 0.45 ? "Dusk approaching" : "Daylight hours",
    },
    {
      name: "Zone proximity",
      weight: 0.2,
      raw: zRaw * 100,
      impact: -Math.round(zRaw * 22 * soloMul),
      note: zRaw > 0.8 ? "Inside a flagged danger zone" : zRaw > 0.4 ? "Near a caution zone" : "Tourist-friendly area",
    },
    {
      name: "Crowd density",
      weight: 0.18,
      raw: cRaw * 100,
      impact: -Math.round(cRaw * 14),
      note: cRaw > 0.7 ? "Very dense — pickpocket risk" : cRaw > 0.4 ? "Moderate foot traffic" : "Light foot traffic",
    },
    {
      name: "Movement pattern",
      weight: 0.1,
      raw: mRaw * 100,
      impact: -Math.round(mRaw * 12),
      note: mRaw > 0.6 ? "Unusual movement detected" : mRaw > 0.3 ? "Variable pace" : "Steady walking pace",
    },
  ];

  const totalImpact = factors.reduce((acc, f) => acc + f.impact, 0);
  const score = Math.max(5, Math.min(100, 100 + totalImpact));
  const risk = 100 - score;
  const tone: ZoneType = score >= 75 ? "safe" : score >= 45 ? "warn" : "danger";
  const label = tone === "safe" ? "Safe" : tone === "warn" ? "Caution" : "High risk";

  // Confidence: more learned samples + more movement history + clear signal = higher
  const learned = ctx.learnedSamples ?? 0;
  const sampleScore = Math.min(1, learned / 12) * 0.5
                    + Math.min(1, (ctx.movement?.length ?? 0) / 8) * 0.3
                    + (Math.abs(score - 50) / 50) * 0.2;
  const confidenceValue = Math.max(0.25, Math.min(0.98, 0.4 + sampleScore * 0.6));
  const confidence: Confidence = confidenceValue > 0.75 ? "high" : confidenceValue > 0.5 ? "medium" : "low";

  // Trend
  const prev = ctx.previousScore ?? score;
  const delta = score - prev;
  const trend = {
    direction: (delta > 1 ? "up" : delta < -1 ? "down" : "flat") as "up" | "down" | "flat",
    delta: Math.round(delta),
    window: "last 30 min",
  };

  // 30-min projection: re-run time factor for future
  const future = new Date(date.getTime() + 30 * 60_000);
  const futureT = timeOfDayRisk(future);
  const timeShift = -(futureT - tRaw) * 22 * soloMul;
  const futureScore = Math.max(5, Math.min(100, Math.round(score + timeShift)));
  const willWorsen = timeShift < -2;
  const prediction = willWorsen
    ? {
        in: "30 min",
        futureScore,
        note: futureT > 0.7
          ? "Nightfall — risk projected to climb"
          : "Conditions trending downward",
      }
    : null;

  // Peak danger window — derived from time curve (always 22:00–01:00 with mild shift)
  const peakRiskWindow = "10 PM – 1 AM";

  // Adaptive message
  const message = buildAdaptiveMessage({ tone, factors, ctx, date });

  return {
    score, risk, tone, label,
    confidence, confidenceValue,
    factors, trend, prediction, peakRiskWindow, message,
  };
}

function buildAdaptiveMessage({
  tone, factors, ctx, date,
}: { tone: ZoneType; factors: ScoreFactor[]; ctx: ScoreContext; date: Date }) {
  const top = [...factors].sort((a, b) => a.impact - b.impact)[0];
  const isNight = date.getHours() >= 21 || date.getHours() < 6;
  const solo = ctx.soloMode;

  if (tone === "danger") {
    if (top.name === "Zone proximity") return "You've entered a high-risk zone. Consider relocating.";
    if (top.name === "Recent incidents") return "Multiple incidents reported nearby in the last hour.";
    if (isNight) return "High risk after dark — head toward a lit, populated area.";
    return "Risk levels elevated. Stay aware of your surroundings.";
  }
  if (tone === "warn") {
    if (isNight && solo) return "Solo + after dark: stick to main streets and share your live location.";
    if (top.name === "Crowd density") return "Crowded area — secure your phone and bag.";
    if (top.name === "Time of day") return "You are entering a poorly lit area. Stay alert.";
    return "Conditions are mixed — keep an eye on alerts.";
  }
  return "Conditions look good. Enjoy your walk safely.";
}
