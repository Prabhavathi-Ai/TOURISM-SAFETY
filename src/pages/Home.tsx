import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, MapPin, Sparkles, Route, AlertTriangle, ChevronRight, Wifi, ShieldCheck, Activity, Radio, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ZONES, POIS } from "@/data/safety";
import { useApp } from "@/store/app";
import { SafetyScoreRing } from "@/components/safety/SafetyScoreRing";
import { SafetyChip } from "@/components/safety/SafetyChip";
import { SafetyMap } from "@/components/map/SafetyMap";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useLivePosition, useLiveScore, useSmartAlerts } from "@/hooks/useLiveSafety";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Home() {
  const nav = useNavigate();
  const { profile, reports } = useApp();
  const pos = useLivePosition(4000);
  const live = useLiveScore(pos);
  const { latest } = useSmartAlerts(live);

  // Surface a toast when a new smart alert arrives.
  const lastAlertId = useRef<string | null>(null);
  useEffect(() => {
    if (latest && latest.id !== lastAlertId.current) {
      lastAlertId.current = latest.id;
      const fn = latest.tone === "danger" ? toast.error : toast.warning;
      fn(latest.title, { description: latest.detail });
    }
  }, [latest]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const TrendIcon = live.trend.direction === "up" ? TrendingUp : live.trend.direction === "down" ? TrendingDown : Minus;
  const trendColor = live.trend.direction === "up" ? "text-safe" : live.trend.direction === "down" ? "text-danger" : "text-muted-foreground";

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-b-[2.5rem] bg-gradient-hero px-5 pb-8 pt-12 text-primary-foreground shadow-elevated">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-primary-glow/40 blur-3xl" />

        <div className="relative flex items-start justify-between gap-2">
          <div>
            <p className="text-sm/none text-primary-foreground/80">{greeting},</p>
            <h1 className="mt-1 font-display text-2xl font-extrabold leading-tight">{profile.name.split(" ")[0]} 👋</h1>
            <div className="mt-2 inline-flex items-center gap-1.5 text-sm/none text-primary-foreground/85">
              <MapPin className="h-3.5 w-3.5" /> Connaught Place · ±{Math.round(pos.accuracy)}m
              <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                <span className="h-1.5 w-1.5 animate-live-dot rounded-full bg-safe" /> Live
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="bg-white/15 ring-white/20 hover:bg-white/25" />
            <button
              onClick={() => nav("/app/alerts")}
              className="relative grid h-10 w-10 place-items-center rounded-full bg-white/15 backdrop-blur transition-colors hover:bg-white/25"
              aria-label="Alerts"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-warn ring-2 ring-primary" />
            </button>
          </div>
        </div>

        <div className="relative mt-6 flex items-center gap-5">
          <SafetyScoreRing score={live.score} label={live.label} tone={live.tone} size={150} confidence={live.confidence} />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 backdrop-blur">
              <TrendIcon className={cn("h-4 w-4", trendColor)} />
              <div className="flex-1">
                <div className="text-xs font-semibold">Trend · {live.trend.window}</div>
                <div className="text-[11px] text-primary-foreground/80">
                  {live.trend.direction === "flat" ? "Stable" : `${live.trend.delta > 0 ? "+" : ""}${live.trend.delta} pts`}
                </div>
              </div>
            </div>
            {live.factors.slice(0, 2).map((f) => (
              <div key={f.name} className="flex items-start justify-between gap-2 rounded-xl bg-white/10 px-3 py-2 backdrop-blur">
                <div>
                  <div className="text-xs font-semibold">{f.name}</div>
                  <div className="text-[11px] text-primary-foreground/80">{f.note}</div>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums",
                    f.impact > 0 ? "bg-safe/30" : f.impact === 0 ? "bg-white/20" : "bg-danger/30"
                  )}
                >
                  {f.impact > 0 ? "+" : ""}{f.impact}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Adaptive contextual message */}
        <motion.div
          key={live.message}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="relative mt-4 flex items-center gap-2 rounded-2xl bg-white/15 px-3 py-2.5 backdrop-blur"
        >
          <Sparkles className="h-4 w-4 shrink-0" />
          <p className="text-xs font-medium leading-snug">{live.message}</p>
        </motion.div>
      </div>

      {/* Predictive warning */}
      <AnimatePresence>
        {live.prediction && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="mx-5 flex items-center gap-3 rounded-2xl bg-warn-soft p-4 ring-1 ring-[hsl(var(--warn)/0.35)]"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warn text-warn-foreground">
              <Activity className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-foreground">Predicted in {live.prediction.in}</div>
              <div className="text-xs text-muted-foreground">{live.prediction.note} · projected score {live.prediction.futureScore}/100</div>
            </div>
            <SafetyChip tone="warn">AI</SafetyChip>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live mini map */}
      <section className="px-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Around you</h2>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Radio className="h-3.5 w-3.5" /> Live
          </div>
        </div>
        <button
          onClick={() => nav("/app/map")}
          className="group block w-full overflow-hidden rounded-2xl ring-1 ring-border shadow-soft transition-all hover:shadow-elevated"
        >
          <div className="h-48">
            <SafetyMap
              zones={ZONES}
              pois={POIS.slice(0, 2)}
              incidents={reports}
              interactive={false}
              liveUser={[pos.lat, pos.lng]}
              heatmap
            />
          </div>
          <div className="flex items-center justify-between gap-2 bg-card px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <SafetyChip tone="safe">Safe zones</SafetyChip>
              <SafetyChip tone="warn">Caution</SafetyChip>
              <SafetyChip tone="danger">{reports.filter((i) => i.severity === "danger").length} danger</SafetyChip>
            </div>
            <span className="text-xs font-semibold text-primary group-hover:underline">Open map</span>
          </div>
        </button>
      </section>

      {/* Quick actions */}
      <section className="px-5">
        <h2 className="mb-2 font-display text-lg font-bold">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickCard icon={Route} title="Safe Route" subtitle="Plan a low-risk path" onClick={() => nav("/app/route")} tone="primary" />
          <QuickCard icon={Sparkles} title="AI Insights" subtitle="Why your score?" onClick={() => nav("/app/alerts")} tone="accent" />
          <QuickCard icon={AlertTriangle} title="Report" subtitle="Flag an incident" onClick={() => nav("/app/report")} tone="warn" />
          <QuickCard icon={ShieldCheck} title="Digital ID" subtitle="Show & share" onClick={() => nav("/digital-id")} tone="safe" />
        </div>
      </section>

      <section className="mx-5 mb-2 flex items-center justify-between rounded-2xl border border-dashed border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-foreground">
            <Wifi className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-bold">Offline mode ready</div>
            <div className="text-xs text-muted-foreground">SOS works via SMS · {profile.contacts.length} contacts cached</div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => nav("/app/settings")} className="text-primary">Manage</Button>
      </section>
    </div>
  );
}

function QuickCard({
  icon: Icon, title, subtitle, onClick, tone,
}: { icon: typeof Route; title: string; subtitle: string; onClick: () => void; tone: "primary" | "warn" | "safe" | "accent"; }) {
  const iconBg = {
    primary: "bg-gradient-hero text-primary-foreground",
    warn: "bg-gradient-warn text-warn-foreground",
    safe: "bg-gradient-safe text-safe-foreground",
    accent: "bg-accent text-accent-foreground",
  } as const;
  return (
    <motion.button
      whileTap={{ scale: 0.97 }} whileHover={{ y: -2 }}
      onClick={onClick}
      className="flex flex-col items-start gap-3 rounded-2xl bg-card p-4 text-left ring-1 ring-border shadow-soft transition-shadow hover:shadow-elevated"
    >
      <div className={cn("grid h-10 w-10 place-items-center rounded-xl", iconBg[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-sm font-bold">{title}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </motion.button>
  );
}
