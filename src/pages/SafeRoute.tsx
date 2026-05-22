import { useState } from "react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Route, ArrowRight, Clock, ShieldCheck, MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { SafetyChip } from "@/components/safety/SafetyChip";
import { SafetyMap, RouteSegment } from "@/components/map/SafetyMap";
import { POIS } from "@/data/safety";
import { useLivePosition } from "@/hooks/useLiveSafety";
import { toast } from "sonner";

interface RouteOption {
  id: string;
  label: string;
  duration: string;
  distance: string;
  safety: number;
  tone: "safe" | "warn" | "danger";
  notes: string[];
  segments: RouteSegment[];
}

// Hand-tuned polylines around Connaught Place → India Gate area for the demo.
const ROUTES: RouteOption[] = [
  {
    id: "r1", label: "Safest", duration: "23 min", distance: "1.9 km",
    safety: 92, tone: "safe",
    notes: ["Well-lit avenues", "Passes 2 police stations", "+4 min vs shortest"],
    segments: [
      { tone: "safe", positions: [[28.6315, 77.2167], [28.6298, 77.2200], [28.6262, 77.2234], [28.6225, 77.2280], [28.6189, 77.2310]] },
    ],
  },
  {
    id: "r2", label: "Balanced", duration: "19 min", distance: "1.6 km",
    safety: 71, tone: "warn",
    notes: ["1 caution zone", "Moderate foot traffic"],
    segments: [
      { tone: "safe", positions: [[28.6315, 77.2167], [28.6296, 77.2185], [28.6270, 77.2210]] },
      { tone: "warn", positions: [[28.6270, 77.2210], [28.6235, 77.2245], [28.6200, 77.2278]] },
      { tone: "safe", positions: [[28.6200, 77.2278], [28.6189, 77.2310]] },
    ],
  },
  {
    id: "r3", label: "Shortest", duration: "16 min", distance: "1.3 km",
    safety: 42, tone: "danger",
    notes: ["Crosses Industrial Outskirts", "Poor lighting after dusk"],
    segments: [
      { tone: "warn", positions: [[28.6315, 77.2167], [28.6280, 77.2200]] },
      { tone: "danger", positions: [[28.6280, 77.2200], [28.6230, 77.2280], [28.6195, 77.2470]] },
      { tone: "warn", positions: [[28.6195, 77.2470], [28.6189, 77.2310]] },
    ],
  },
];

export default function SafeRoute() {
  const [from, setFrom] = useState("Connaught Place");
  const [to, setTo] = useState("India Gate");
  const [picked, setPicked] = useState("r1");
  const pos = useLivePosition(4000);

  const route = ROUTES.find((r) => r.id === picked)!;

  return (
    <div>
      <ScreenHeader title="Safe route" subtitle="Compare safest vs shortest" back />

      <section className="mx-5 mb-5 space-y-3 rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-elevated">
        <div>
          <Label className="text-xs uppercase tracking-wider opacity-80">From</Label>
          <div className="mt-1 flex items-center gap-2 rounded-xl bg-white/15 px-3">
            <MapPin className="h-4 w-4 opacity-80" />
            <Input value={from} onChange={(e) => setFrom(e.target.value)} className="border-0 bg-transparent text-primary-foreground placeholder:text-primary-foreground/60 focus-visible:ring-0" />
          </div>
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider opacity-80">To</Label>
          <div className="mt-1 flex items-center gap-2 rounded-xl bg-white/15 px-3">
            <MapPin className="h-4 w-4 opacity-80" />
            <Input value={to} onChange={(e) => setTo(e.target.value)} className="border-0 bg-transparent text-primary-foreground placeholder:text-primary-foreground/60 focus-visible:ring-0" />
          </div>
        </div>
        <Button size="lg" className="h-12 w-full rounded-xl bg-white text-primary hover:bg-white/90">
          <Route className="mr-2 h-4 w-4" /> Find safe routes
        </Button>
      </section>

      {/* Live route preview on map */}
      <section className="mx-5 mb-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-base font-bold">Route preview</h3>
          <SafetyChip tone={route.tone}>{route.safety}/100</SafetyChip>
        </div>
        <div className="h-56 overflow-hidden rounded-3xl ring-1 ring-border shadow-soft">
          <SafetyMap
            zones={[]}
            pois={POIS.slice(0, 2)}
            incidents={[]}
            interactive={false}
            liveUser={[pos.lat, pos.lng]}
            routes={route.segments}
          />
        </div>
      </section>

      <section className="px-5">
        <h3 className="mb-3 font-display text-lg font-bold">3 routes found</h3>
        <ul className="space-y-3">
          {ROUTES.map((r) => {
            const active = picked === r.id;
            return (
              <li key={r.id}>
                <button
                  onClick={() => setPicked(r.id)}
                  className={cn(
                    "w-full rounded-2xl bg-card p-4 text-left ring-1 shadow-soft transition-all",
                    active ? "ring-2 ring-primary shadow-elevated" : "ring-border"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold">{r.label}</h4>
                        <SafetyChip tone={r.tone}>{r.safety}/100</SafetyChip>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {r.duration}</span>
                        <span>·</span>
                        <span>{r.distance}</span>
                      </div>
                    </div>
                    <div className={cn(
                      "grid h-10 w-10 place-items-center rounded-xl",
                      r.tone === "safe" ? "bg-gradient-safe text-safe-foreground"
                      : r.tone === "warn" ? "bg-gradient-warn text-warn-foreground"
                      : "bg-gradient-danger text-danger-foreground"
                    )}>
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {r.notes.map((n) => (
                      <li key={n} className="flex items-center gap-1.5">
                        <ArrowRight className="h-3 w-3 text-primary" /> {n}
                      </li>
                    ))}
                  </ul>
                </button>
              </li>
            );
          })}
        </ul>

        <Button onClick={() => toast.success(`Navigating via ${route.label} route`)} size="lg" className="mt-5 h-12 w-full rounded-2xl bg-gradient-hero text-base font-semibold shadow-elevated">
          <Navigation className="mr-2 h-4 w-4" /> Start navigation
        </Button>
      </section>
    </div>
  );
}
