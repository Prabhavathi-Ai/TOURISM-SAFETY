import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Siren, Phone, X, MapPin, ShieldAlert, Loader2, CheckCircle2, Activity } from "lucide-react";
import { useApp } from "@/store/app";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLivePosition } from "@/hooks/useLiveSafety";

type Stage = "idle" | "countdown" | "sending" | "active";

const COUNTDOWN_FROM = 5;
const TIMELINE = [
  { key: "broadcast", label: "Alert broadcast", at: 0 },
  { key: "contacts", label: "Contacts notified", at: 1500 },
  { key: "auth", label: "Authorities dispatched", at: 3000 },
  { key: "tracking", label: "Live tracking enabled", at: 4500 },
];

export default function SOS() {
  const nav = useNavigate();
  const { profile, sosActive, setSosActive, pushSosEvent, resolveSosEvent } = useApp();
  const pos = useLivePosition(2000);

  const [stage, setStage] = useState<Stage>(sosActive ? "active" : "idle");
  const [countdown, setCountdown] = useState(COUNTDOWN_FROM);
  const [holdProgress, setHoldProgress] = useState(0);
  const [completed, setCompleted] = useState<string[]>(sosActive ? TIMELINE.map((t) => t.key) : []);
  const [pings, setPings] = useState<{ lat: number; lng: number; ts: number }[]>([]);
  const [eventId, setEventId] = useState<string | null>(null);
  const holdTimer = useRef<number | null>(null);
  const countdownTimer = useRef<number | null>(null);

  // Live location pings while active
  useEffect(() => {
    if (stage !== "active") return;
    setPings((p) => [...p, { lat: pos.lat, lng: pos.lng, ts: pos.ts }].slice(-6));
  }, [stage, pos.lat, pos.lng, pos.ts]);

  const startHold = () => {
    if (stage !== "idle") return;
    holdTimer.current = window.setInterval(() => {
      setHoldProgress((p) => {
        if (p >= 100) {
          if (holdTimer.current) window.clearInterval(holdTimer.current);
          beginCountdown();
          return 100;
        }
        return p + 6;
      });
    }, 50);
  };

  const cancelHold = () => {
    if (stage !== "idle") return;
    if (holdTimer.current) window.clearInterval(holdTimer.current);
    setHoldProgress(0);
  };

  const beginCountdown = () => {
    setStage("countdown");
    setCountdown(COUNTDOWN_FROM);
    countdownTimer.current = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (countdownTimer.current) window.clearInterval(countdownTimer.current);
          dispatch();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const cancelCountdown = () => {
    if (countdownTimer.current) window.clearInterval(countdownTimer.current);
    setStage("idle");
    setHoldProgress(0);
    toast("SOS cancelled before sending");
  };

  const dispatch = async () => {
    setStage("sending");
    const id = pushSosEvent({ lat: pos.lat, lng: pos.lng, user: profile.name });
    setEventId(id);
    TIMELINE.forEach((step) => {
      window.setTimeout(() => setCompleted((prev) => Array.from(new Set([...prev, step.key]))), step.at);
    });
    await new Promise((r) => setTimeout(r, TIMELINE[TIMELINE.length - 1].at + 600));
    setSosActive(true);
    setStage("active");
    toast.success("SOS broadcast sent · authorities notified");
  };

  const cancel = () => {
    if (eventId) resolveSosEvent(eventId);
    setSosActive(false);
    setStage("idle");
    setHoldProgress(0);
    setCompleted([]);
    setPings([]);
    setEventId(null);
    toast("SOS cancelled — recipients notified you're safe");
    nav("/app");
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-gradient-to-b from-danger-soft via-background to-background">
      <div className="px-5 pt-14">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-danger">
              <ShieldAlert className="h-3.5 w-3.5" /> Emergency
            </div>
            <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight">
              {stage === "active" ? "Help is on the way" : stage === "countdown" ? "Sending in…" : "Trigger SOS"}
            </h1>
            <p className="mt-1 max-w-[28ch] text-sm text-muted-foreground">
              {stage === "active"
                ? "Stay calm. Your live location is being broadcast."
                : stage === "countdown"
                ? "Tap cancel if this was an accident."
                : "Press and hold the button. A 5-second countdown will start before SOS sends."}
            </p>
          </div>
          <button onClick={() => nav(-1)} className="grid h-10 w-10 place-items-center rounded-full bg-card ring-1 ring-border shadow-soft" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Big SOS button */}
      <div className="my-10 flex justify-center">
        <div className="relative">
          {stage === "idle" && (
            <motion.div
              initial={{ scale: 1, opacity: 0.7 }}
              animate={{ scale: [1, 1.25, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-danger/30"
            />
          )}

          <motion.button
            onPointerDown={startHold}
            onPointerUp={cancelHold}
            onPointerLeave={cancelHold}
            disabled={stage !== "idle"}
            whileTap={{ scale: 0.96 }}
            className="relative grid h-56 w-56 place-items-center rounded-full bg-gradient-sos text-danger-foreground shadow-sos disabled:opacity-95"
          >
            {/* Hold progress arc */}
            {stage === "idle" && holdProgress > 0 && (
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke="white" strokeWidth="4" strokeOpacity="0.25" />
                <circle cx="50" cy="50" r="46" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 46}
                  strokeDashoffset={(2 * Math.PI * 46) * (1 - holdProgress / 100)}
                />
              </svg>
            )}

            <AnimatePresence mode="wait">
              {stage === "countdown" ? (
                <motion.div key="cd" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }} className="text-center">
                  <div className="font-display text-7xl font-extrabold leading-none tabular-nums">{countdown}</div>
                  <div className="mt-2 text-xs uppercase tracking-wider opacity-90">Sending SOS…</div>
                </motion.div>
              ) : stage === "sending" ? (
                <motion.div key="snd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                  <Loader2 className="mx-auto h-14 w-14 animate-spin" />
                  <div className="mt-2 font-display text-xl font-extrabold">Broadcasting…</div>
                </motion.div>
              ) : stage === "active" ? (
                <motion.div key="act" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                  <CheckCircle2 className="mx-auto h-14 w-14" />
                  <div className="mt-2 font-display text-2xl font-extrabold tracking-wide">ACTIVE</div>
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                  <Siren className="mx-auto h-16 w-16" />
                  <div className="mt-2 font-display text-2xl font-extrabold tracking-wide">Hold for SOS</div>
                  <div className="text-xs/none opacity-90">Release to cancel</div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {stage === "countdown" && (
        <div className="mx-5 -mt-4 mb-6">
          <Button onClick={cancelCountdown} size="lg" variant="outline" className="h-12 w-full rounded-2xl border-danger text-danger hover:bg-danger-soft">
            Cancel countdown
          </Button>
        </div>
      )}

      {/* Status & live tracking */}
      {(stage === "sending" || stage === "active") && (
        <div className="mx-5 mb-6 rounded-2xl bg-card p-4 ring-1 ring-border shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Live status</div>
            {stage === "active" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-safe-soft px-2 py-0.5 text-[11px] font-bold text-safe">
                <span className="h-1.5 w-1.5 animate-live-dot rounded-full bg-safe" /> Tracking
              </span>
            )}
          </div>
          <ol className="space-y-2.5">
            {TIMELINE.map((t) => {
              const done = completed.includes(t.key);
              return (
                <li key={t.key} className="flex items-center gap-3">
                  <div className={`grid h-7 w-7 place-items-center rounded-full ${done ? "bg-safe text-safe-foreground" : "bg-muted text-muted-foreground"}`}>
                    {done ? <CheckCircle2 className="h-4 w-4" /> : <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  </div>
                  <div className={`text-sm ${done ? "font-semibold" : "text-muted-foreground"}`}>{t.label}</div>
                </li>
              );
            })}
          </ol>

          {stage === "active" && (
            <div className="mt-4 rounded-xl bg-muted/60 p-3">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Activity className="h-3 w-3" /> Live position pings</span>
                <span className="font-mono text-foreground">{pings.length}</span>
              </div>
              <div className="mt-2 space-y-1 font-mono text-[11px]">
                {pings.slice().reverse().map((p) => (
                  <div key={p.ts} className="flex items-center justify-between text-muted-foreground">
                    <span>{p.lat.toFixed(4)}, {p.lng.toFixed(4)}</span>
                    <span>{new Date(p.ts).toLocaleTimeString()}</span>
                  </div>
                ))}
                {!pings.length && <div className="text-muted-foreground">awaiting…</div>}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mx-5 space-y-3 pb-10">
        <InfoRow icon={MapPin} label="Live location" value={`${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)} · ±${Math.round(pos.accuracy)}m`} />
        <InfoRow icon={ShieldAlert} label="Digital ID shared" value={profile.digitalIdHash} mono />

        <div className="rounded-2xl bg-card p-4 ring-1 ring-border shadow-soft">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Notifying</div>
          <ul className="space-y-2.5">
            {profile.contacts.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.relation} · {c.phone}</div>
                </div>
                <span className={`safety-chip ${stage === "active" ? "bg-safe-soft text-safe" : "bg-muted text-muted-foreground"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${stage === "active" ? "bg-safe" : "bg-muted-foreground"}`} />
                  {stage === "active" ? "Notified" : "Pending"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {stage === "active" ? (
          <div className="grid grid-cols-2 gap-3">
            <Button size="lg" className="h-12 rounded-2xl bg-gradient-hero" onClick={() => toast.success("Calling 112…")}>
              <Phone className="mr-2 h-4 w-4" /> Call 112
            </Button>
            <Button size="lg" variant="outline" className="h-12 rounded-2xl border-danger text-danger hover:bg-danger-soft" onClick={cancel}>
              I'm safe — cancel
            </Button>
          </div>
        ) : stage === "idle" ? (
          <p className="text-center text-xs text-muted-foreground">No internet? SOS will fall back to SMS automatically.</p>
        ) : null}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono }: { icon: typeof MapPin; label: string; value: string; mono?: boolean; }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-card p-4 ring-1 ring-border shadow-soft">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`truncate text-sm font-semibold ${mono ? "font-mono" : ""}`}>{value}</div>
      </div>
    </div>
  );
}
