import { useMemo } from "react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { ALERTS } from "@/data/safety";
import { SafetyChip } from "@/components/safety/SafetyChip";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Brain, Clock } from "lucide-react";
import { useLivePosition, useLiveScore, useSmartAlerts } from "@/hooks/useLiveSafety";
import { cn } from "@/lib/utils";

export default function Alerts() {
  const pos = useLivePosition(5000);
  const live = useLiveScore(pos);
  const { history } = useSmartAlerts(live);

  const merged = useMemo(() => {
    return [
      ...history.map((h) => ({
        id: h.id,
        title: h.title,
        detail: h.detail,
        severity: h.tone,
        time: relativeTime(h.ts),
        icon: Sparkles,
      })),
      ...ALERTS,
    ];
  }, [history]);

  return (
    <div>
      <ScreenHeader title="AI Alerts" subtitle="Personalized safety insights" />

      {/* AI explanation card */}
      <section className="mx-5 mt-1 rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-elevated">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider">
            <Brain className="h-3.5 w-3.5" /> AI explanation
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            {live.confidence} confidence · {Math.round(live.confidenceValue * 100)}%
          </div>
        </div>
        <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight">
          Score {live.score}/100 · {live.label}
        </h2>
        <p className="mt-1 text-sm text-primary-foreground/85">{live.message}</p>

        <ul className="mt-4 space-y-2 text-sm">
          {live.factors.map((f) => (
            <li key={f.name} className="rounded-xl bg-white/10 p-3">
              <div className="flex items-center justify-between gap-2">
                <strong className="font-semibold">{f.name}</strong>
                <span className={cn(
                  "shrink-0 rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums",
                  f.impact > 0 ? "bg-safe/30" : f.impact === 0 ? "bg-white/20" : "bg-danger/30"
                )}>
                  {f.impact > 0 ? "+" : ""}{f.impact}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-primary-foreground/80">{f.note}</div>
              {/* Weighted bar */}
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${f.raw}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full",
                    f.raw > 60 ? "bg-danger" : f.raw > 30 ? "bg-warn" : "bg-safe"
                  )}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-primary-foreground/70">
                <span>weight {Math.round(f.weight * 100)}%</span>
                <span>raw risk {Math.round(f.raw)}</span>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white/10 p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground/80">
              <TrendingUp className="h-3 w-3" /> Trend
            </div>
            <div className="mt-1 text-sm font-bold">
              {live.trend.direction === "up" ? "Improving" : live.trend.direction === "down" ? "Worsening" : "Stable"} ({live.trend.delta > 0 ? "+" : ""}{live.trend.delta})
            </div>
            <div className="text-[11px] text-primary-foreground/70">{live.trend.window}</div>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground/80">
              <Clock className="h-3 w-3" /> Peak danger
            </div>
            <div className="mt-1 text-sm font-bold">{live.peakRiskWindow}</div>
            <div className="text-[11px] text-primary-foreground/70">historical pattern</div>
          </div>
        </div>
      </section>

      <section className="mt-6 px-5">
        <h3 className="mb-3 font-display text-lg font-bold">Recent alerts</h3>
        <ul className="space-y-3">
          {merged.map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.li
                key={a.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 rounded-2xl bg-card p-4 ring-1 ring-border shadow-soft"
              >
                <div className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                  a.severity === "danger" ? "bg-danger text-danger-foreground"
                  : a.severity === "warn" ? "bg-warn text-warn-foreground"
                  : "bg-safe text-safe-foreground"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold">{a.title}</h4>
                    <span className="text-[11px] text-muted-foreground">{a.time}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{a.detail}</p>
                  <div className="mt-2"><SafetyChip tone={a.severity}>{a.severity === "safe" ? "Info" : a.severity === "warn" ? "Caution" : "Critical"}</SafetyChip></div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function relativeTime(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}
