import { useState, useRef } from "react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { SafetyMap } from "@/components/map/SafetyMap";
import { SafetyChip } from "@/components/safety/SafetyChip";
import { ZONES, POIS, INCIDENTS, ZoneType } from "@/data/safety";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Layers, Route, Locate, Radio, AlertTriangle, Search, Loader2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLivePosition } from "@/hooks/useLiveSafety";
import { toast } from "sonner";

const FILTERS: { key: "all" | ZoneType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "safe", label: "Safe" },
  { key: "warn", label: "Caution" },
  { key: "danger", label: "Danger" },
];

interface SearchHit {
  position: [number, number];
  label: string;
}

export default function MapView() {
  const nav = useNavigate();
  const [filter, setFilter] = useState<"all" | ZoneType>("all");
  const [follow, setFollow] = useState(true);
  const pos = useLivePosition(3000);
  const zones = filter === "all" ? ZONES : ZONES.filter((z) => z.type === filter);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchHit | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const q = query.trim();
    if (!q || searching) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setSearching(true);
    try {
      // India-first search: bias to IN, fall back to global if nothing matches
      const inUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=in&addressdetails=1&q=${encodeURIComponent(q)}`;
      const res = await fetch(inUrl, {
        signal: ctrl.signal,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Search failed");
      let data: Array<{ lat: string; lon: string; display_name: string; importance?: number }> = await res.json();
      if (!data.length) {
        // Global fallback so users can still find international places if they ask
        const globalUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
        const gRes = await fetch(globalUrl, { signal: ctrl.signal, headers: { Accept: "application/json" } });
        data = gRes.ok ? await gRes.json() : [];
      }
      if (!data.length) {
        toast.error("Location not available");
        return;
      }
      // Pick the most "important" match (Nominatim ranks by importance)
      const hit = [...data].sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0))[0];
      const result: SearchHit = {
        position: [parseFloat(hit.lat), parseFloat(hit.lon)],
        label: hit.display_name,
      };
      setSearchResult(result);
      setFollow(false);
      toast.success(hit.display_name.split(",")[0]);
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        toast.error("Location not available");
      }
    } finally {
      setSearching(false);
    }
  }

  function clearSearch() {
    setQuery("");
    setSearchResult(null);
  }

  return (
    <div className="flex h-[100dvh] flex-col">
      <ScreenHeader
        title="Live safety map"
        subtitle="Real-time zones, incidents & nearby help"
        right={
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => nav("/app/route")}>
            <Route className="mr-1.5 h-4 w-4" /> Route
          </Button>
        }
      />

      <form onSubmit={handleSearch} className="px-5 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city, place or address…"
            className="h-11 rounded-full border-border bg-card pl-10 pr-24 text-sm shadow-soft"
            inputMode="search"
            enterKeyHint="search"
          />
          <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {(query || searchResult) && !searching && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <Button
              type="submit"
              size="sm"
              className="h-8 rounded-full px-3 text-xs"
              disabled={searching || !query.trim()}
            >
              {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Go"}
            </Button>
          </div>
        </div>
      </form>

      <div className="flex items-center gap-2 overflow-x-auto px-5 pb-3 no-scrollbar">
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          );
        })}
        <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-safe-soft px-2.5 py-1 text-[11px] font-bold text-safe">
          <Radio className="h-3 w-3 animate-live-dot" /> Live
        </span>
      </div>

      <div className="relative mx-5 mb-4 flex-1 overflow-hidden rounded-3xl ring-1 ring-border shadow-soft">
        <SafetyMap
          zones={zones} pois={POIS} incidents={INCIDENTS}
          liveUser={[pos.lat, pos.lng]}
          follow={follow}
          heatmap
          searchResult={searchResult}
        />

        {/* Follow toggle */}
        <button
          onClick={() => setFollow((v) => !v)}
          className={cn(
            "absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full backdrop-blur transition-colors shadow-elevated",
            follow ? "bg-primary text-primary-foreground" : "bg-card/90 text-foreground ring-1 ring-border"
          )}
          aria-label="Toggle follow user"
        >
          <Locate className="h-5 w-5" />
        </button>

        {/* Legend */}
        <div className="pointer-events-auto absolute bottom-3 left-3 rounded-2xl bg-card/95 p-3 shadow-elevated backdrop-blur-md ring-1 ring-border">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <Layers className="h-3 w-3" /> Legend
          </div>
          <div className="flex flex-col gap-1.5">
            <SafetyChip tone="safe">Safe zone</SafetyChip>
            <SafetyChip tone="warn">Caution zone</SafetyChip>
            <SafetyChip tone="danger">Danger / incident</SafetyChip>
          </div>
        </div>

        {/* Position pill */}
        <div className="absolute bottom-3 right-3 rounded-full bg-card/95 px-3 py-1.5 text-[11px] font-mono shadow-elevated ring-1 ring-border">
          {pos.status === "granted" ? (
            <>{pos.lat.toFixed(4)}, {pos.lng.toFixed(4)} · ±{Math.round(pos.accuracy)}m</>
          ) : pos.status === "pending" ? (
            <>Locating you…</>
          ) : (
            <>{pos.lat.toFixed(4)}, {pos.lng.toFixed(4)} · sim</>
          )}
        </div>

        {/* Permission / availability error banner */}
        {pos.errorMessage && pos.status !== "granted" && pos.status !== "pending" && (
          <div className="absolute left-3 right-3 top-3 flex items-start gap-2 rounded-2xl bg-warn-soft px-3 py-2 text-[12px] font-medium text-warn shadow-elevated ring-1 ring-warn/30 backdrop-blur-md">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{pos.errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
