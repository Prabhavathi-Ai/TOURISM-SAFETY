import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, subDays } from "date-fns";
import { AlertTriangle, ArrowLeft, Clock, MapPin, Radio, ShieldAlert, Siren, TrendingUp, Users, Activity, CheckCircle2 } from "lucide-react";
import { ZONES, INCIDENTS } from "@/data/safety";
import { useApp } from "@/store/app";
import { SafetyMap } from "@/components/map/SafetyMap";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const { reports, sosEvents, resolveSosEvent } = useApp();
  const [filter, setFilter] = useState<"all" | "pending" | "resolved">("all");
  const [, force] = useState(0);

  // Tick to keep "live" relative times fresh
  useEffect(() => {
    const id = window.setInterval(() => force((n) => n + 1), 5000);
    return () => window.clearInterval(id);
  }, []);

  const activeSos = sosEvents.filter((s) => s.status === "active");

  // ----- Charts data
  const incidentsOverTime = useMemo(() => {
    const days = 7;
    const buckets = Array.from({ length: days }).map((_, i) => {
      const d = subDays(new Date(), days - 1 - i);
      const key = format(d, "MMM d");
      // Seed deterministic counts + actual reports today
      const base = (i * 9301 + 49297) % 11;
      const todayCount = i === days - 1 ? reports.filter((r) => r.reportedAt && r.reportedAt > Date.now() - 86_400_000).length : 0;
      return { day: key, incidents: base + todayCount, sos: ((i * 7) % 4) + (i === days - 1 ? activeSos.length : 0) };
    });
    return buckets;
  }, [reports, activeSos.length]);

  const areaRanking = useMemo(() => {
    return ZONES.map((z) => {
      const score = z.type === "danger" ? 70 + Math.round(Math.random() * 25)
                  : z.type === "warn" ? 35 + Math.round(Math.random() * 25)
                  : 8 + Math.round(Math.random() * 15);
      return { area: z.name.replace(" Backstreets", "").replace(" Outskirts", ""), risk: score, tone: z.type };
    }).sort((a, b) => b.risk - a.risk);
  }, []);

  const incidentTypes = useMemo(() => {
    const map: Record<string, number> = {};
    [...INCIDENTS, ...reports].forEach((r) => { map[r.type] = (map[r.type] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [reports]);

  const PIE_COLORS = ["hsl(0 78% 55%)", "hsl(38 95% 52%)", "hsl(280 65% 55%)", "hsl(188 78% 35%)", "hsl(152 65% 40%)"];

  const stats = [
    { label: "Active SOS", value: activeSos.length, icon: Siren, tone: "danger" as const },
    { label: "Open reports", value: reports.length, icon: AlertTriangle, tone: "warn" as const },
    { label: "Tourists tracked", value: 1247, icon: Users, tone: "primary" as const },
    { label: "Resolved today", value: sosEvents.filter((s) => s.status === "resolved").length + 8, icon: CheckCircle2, tone: "safe" as const },
  ];

  const filteredReports = reports;

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-3">
            <Link to="/app" className="grid h-9 w-9 place-items-center rounded-lg ring-1 ring-border hover:bg-muted">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="font-display text-lg font-extrabold leading-none">SafeTrek · Admin</div>
              <div className="mt-1 text-xs text-muted-foreground">Live tourist safety operations dashboard</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-safe-soft px-2.5 py-1 text-xs font-bold text-safe">
              <Radio className="h-3 w-3 animate-live-dot" /> Live · WS connected
            </span>
            <span className="text-xs font-medium text-muted-foreground">{format(new Date(), "PPp")}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-6 px-6 py-6">
        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s, i) => {
            const Icon = s.icon;
            const tones = {
              danger: "bg-danger text-danger-foreground",
              warn: "bg-warn text-warn-foreground",
              safe: "bg-safe text-safe-foreground",
              primary: "bg-gradient-hero text-primary-foreground",
            };
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl bg-card p-4 ring-1 ring-border shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{s.label}</span>
                  <div className={cn("grid h-9 w-9 place-items-center rounded-xl", tones[s.tone])}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                </div>
                <motion.div
                  key={s.value}
                  initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="mt-3 font-display text-3xl font-extrabold tabular-nums"
                >
                  {s.value}
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Map + Live SOS */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 overflow-hidden rounded-2xl bg-card ring-1 ring-border shadow-soft">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h2 className="font-display text-base font-bold">Live operations map</h2>
                <p className="text-xs text-muted-foreground">Heatmap reflects 48h recency</p>
              </div>
              <Badge variant="outline" className="gap-1.5"><Activity className="h-3 w-3" /> {reports.length} markers</Badge>
            </div>
            <div className="h-[480px]">
              <SafetyMap
                zones={ZONES}
                incidents={reports}
                heatmap
                showUser={false}
                interactive
              />
            </div>
          </div>

          <div className="rounded-2xl bg-card ring-1 ring-border shadow-soft">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="font-display text-base font-bold">Active emergencies</h2>
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", activeSos.length ? "bg-danger text-danger-foreground" : "bg-muted text-muted-foreground")}>
                {activeSos.length}
              </span>
            </div>
            <div className="max-h-[480px] overflow-y-auto p-3">
              {activeSos.length === 0 ? (
                <div className="grid place-items-center py-12 text-center">
                  <CheckCircle2 className="h-10 w-10 text-safe" />
                  <p className="mt-2 text-sm font-semibold">No active SOS</p>
                  <p className="text-xs text-muted-foreground">All travelers safe.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {activeSos.map((e) => (
                    <motion.li
                      key={e.id}
                      initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      className="rounded-xl bg-danger-soft p-3 ring-1 ring-[hsl(var(--danger)/0.3)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="grid h-8 w-8 place-items-center rounded-full bg-danger text-danger-foreground animate-sos-pulse">
                            <Siren className="h-4 w-4" />
                          </span>
                          <div>
                            <div className="text-sm font-bold">{e.user}</div>
                            <div className="text-[11px] text-muted-foreground">{relativeTime(e.ts)}</div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => resolveSosEvent(e.id)}>
                          Resolve
                        </Button>
                      </div>
                      <div className="mt-2 flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {e.lat.toFixed(4)}, {e.lng.toFixed(4)}
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="Incidents over time" subtitle="Last 7 days" icon={TrendingUp}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={incidentsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="incidents" stroke="hsl(var(--warn))" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="sos" stroke="hsl(var(--danger))" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Area-wise risk" subtitle="Higher = more risky" icon={ShieldAlert}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={areaRanking} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis type="category" dataKey="area" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={120} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="risk" radius={[0, 6, 6, 0]}>
                  {areaRanking.map((e, i) => (
                    <Cell key={i} fill={e.tone === "danger" ? "hsl(var(--danger))" : e.tone === "warn" ? "hsl(var(--warn))" : "hsl(var(--safe))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Incident types" subtitle="Distribution" icon={Clock}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={incidentTypes} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                  {incidentTypes.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Reports table */}
        <div className="rounded-2xl bg-card ring-1 ring-border shadow-soft">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="font-display text-base font-bold">Incident reports</h2>
              <p className="text-xs text-muted-foreground">Live feed · auto-refreshing</p>
            </div>
            <div className="flex items-center gap-1">
              {(["all", "pending", "resolved"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition-colors",
                    filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-left">Type</th>
                  <th className="px-4 py-2.5 text-left">Description</th>
                  <th className="px-4 py-2.5 text-left">Reporter</th>
                  <th className="px-4 py-2.5 text-left">Location</th>
                  <th className="px-4 py-2.5 text-left">Time</th>
                  <th className="px-4 py-2.5 text-left">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredReports.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3 font-semibold">{r.type}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.description}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.reporter}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.position[0].toFixed(3)}, {r.position[1].toFixed(3)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.timeAgo}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-bold",
                        r.severity === "danger" ? "bg-danger-soft text-danger" : r.severity === "warn" ? "bg-warn-soft text-warn" : "bg-safe-soft text-safe"
                      )}>
                        {r.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function ChartCard({ title, subtitle, icon: Icon, children }: { title: string; subtitle: string; icon: typeof TrendingUp; children: React.ReactNode; }) {
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-bold">{title}</h3>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {children}
    </div>
  );
}

function relativeTime(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}
