// Live safety engine: real-time position + advanced AI scoring + smart alerts
import { useEffect, useMemo, useRef, useState } from "react";
import { Incident, INCIDENTS, USER_LOCATION, ZoneType } from "@/data/safety";
import { computeAdvancedScore, AdvancedScore, MovementSample } from "@/data/aiEngine";
import { useApp } from "@/store/app";

export interface LivePosition { lat: number; lng: number; accuracy: number; ts: number }

export type GeoStatus = "pending" | "granted" | "denied" | "unavailable" | "error";

/**
 * useLivePosition: real-time GPS tracking via the browser Geolocation API.
 * - Uses watchPosition() for continuous updates as the user moves.
 * - Exposes a status flag so the UI can show permission / availability errors.
 * - Falls back to a gentle simulated walk ONLY when geolocation is unsupported
 *   or the user has denied access (so demos still work without a real device).
 */
export function useLivePosition(intervalMs = 4000) {
  const [pos, setPos] = useState<LivePosition>({
    lat: USER_LOCATION[0], lng: USER_LOCATION[1], accuracy: 8, ts: Date.now(),
  });
  const [status, setStatus] = useState<GeoStatus>("pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const historyRef = useRef<MovementSample[]>([]);

  useEffect(() => {
    let mounted = true;
    let watchId: number | null = null;
    let simTimer: number | null = null;

    const push = (next: LivePosition) => {
      if (!mounted) return;
      setPos(next);
      const h = historyRef.current;
      h.push({ lat: next.lat, lng: next.lng, ts: next.ts });
      if (h.length > 12) h.shift();
    };

    const startSimulation = () => {
      if (simTimer) return;
      let t = 0;
      simTimer = window.setInterval(() => {
        if (!mounted) return;
        t += 1;
        const lat = USER_LOCATION[0] + Math.sin(t / 6) * 0.0008 + Math.cos(t / 11) * 0.0004;
        const lng = USER_LOCATION[1] + Math.cos(t / 7) * 0.0010 + Math.sin(t / 13) * 0.0005;
        push({ lat, lng, accuracy: 8 + (t % 5), ts: Date.now() });
      }, intervalMs);
    };

    if (!("geolocation" in navigator)) {
      setStatus("unavailable");
      setErrorMessage("Location services are not available on this device.");
      startSimulation();
      return () => { mounted = false; if (simTimer) window.clearInterval(simTimer); };
    }

    try {
      watchId = navigator.geolocation.watchPosition(
        (p) => {
          if (!mounted) return;
          setStatus("granted");
          setErrorMessage(null);
          push({
            lat: p.coords.latitude,
            lng: p.coords.longitude,
            accuracy: p.coords.accuracy,
            ts: Date.now(),
          });
        },
        (err) => {
          if (!mounted) return;
          if (err.code === err.PERMISSION_DENIED) {
            setStatus("denied");
            setErrorMessage("Location access required to track your position. Please allow location access in your browser settings.");
            startSimulation();
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            setStatus("unavailable");
            setErrorMessage("Please enable location services on your device.");
          } else {
            setStatus("error");
            setErrorMessage(err.message || "Unable to retrieve your location.");
          }
        },
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
      );
    } catch {
      setStatus("error");
      setErrorMessage("Unable to start location tracking.");
      startSimulation();
    }

    return () => {
      mounted = false;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (simTimer) window.clearInterval(simTimer);
    };
  }, [intervalMs]);

  return { ...pos, history: historyRef.current, status, errorMessage };
}

/** Advanced score derived from live position. Re-runs every 8s for time/crowd drift. */
export function useLiveScore(pos: { lat: number; lng: number; history?: MovementSample[] }) {
  const profile = useApp((s) => s.profile);
  const reports = useApp((s) => s.reports);
  const incidents = useMemo<Incident[]>(() => reports, [reports]);
  const [tick, setTick] = useState(0);
  const prevScoreRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 8_000);
    return () => window.clearInterval(id);
  }, []);

  return useMemo<AdvancedScore>(() => {
    const result = computeAdvancedScore({
      pos: [pos.lat, pos.lng],
      incidents,
      movement: pos.history ?? [],
      soloMode: profile.soloMode,
      learnedSamples: incidents.length,
      previousScore: prevScoreRef.current,
    });
    prevScoreRef.current = result.score;
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos.lat, pos.lng, tick, incidents.length, profile.soloMode]);
}

/**
 * useSmartAlerts: emits adaptive contextual alerts when score crosses thresholds,
 * with cooldown to prevent spam. Returns the latest emitted alert and a list (capped).
 */
export interface SmartAlert {
  id: string;
  ts: number;
  tone: ZoneType;
  title: string;
  detail: string;
}

const COOLDOWN_MS = 60_000; // 1 minute between alerts
const MAX_ALERTS = 8;

export function useSmartAlerts(score: AdvancedScore): { latest: SmartAlert | null; history: SmartAlert[] } {
  const [history, setHistory] = useState<SmartAlert[]>([]);
  const lastEmitRef = useRef<{ ts: number; tone: ZoneType } | null>(null);

  useEffect(() => {
    const last = lastEmitRef.current;
    const now = Date.now();
    const cooledDown = !last || now - last.ts > COOLDOWN_MS;
    const toneChanged = !last || last.tone !== score.tone;
    const significant = score.tone !== "safe";

    if (significant && cooledDown && toneChanged) {
      const alert: SmartAlert = {
        id: crypto.randomUUID(),
        ts: now,
        tone: score.tone,
        title: score.tone === "danger" ? "High risk detected" : "Caution advised",
        detail: score.message,
      };
      setHistory((h) => [alert, ...h].slice(0, MAX_ALERTS));
      lastEmitRef.current = { ts: now, tone: score.tone };
    }
  }, [score.tone, score.message]);

  return { latest: history[0] ?? null, history };
}

// Re-export INCIDENTS for legacy imports
export { INCIDENTS };
