import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Simulated AI incident detection prompt.
 * Pops up an "Are you safe?" dialog after a delay (in real life: triggered by
 * accelerometer spike or scream detection). Auto-escalates to SOS if no response.
 */
export function FallDetectionWatcher() {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(15);
  const triggered = useRef(false);

  // Trigger once, ~12s after first mount, only if not already on SOS screen.
  useEffect(() => {
    if (triggered.current) return;
    const id = window.setTimeout(() => {
      if (window.location.pathname.includes("/sos")) return;
      triggered.current = true;
      setOpen(true);
    }, 12000);
    return () => window.clearTimeout(id);
  }, []);

  // Countdown: auto-trigger SOS when reaches 0
  useEffect(() => {
    if (!open) return;
    if (secondsLeft <= 0) {
      setOpen(false);
      nav("/app/sos");
      return;
    }
    const id = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [open, secondsLeft, nav]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center"
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative w-full max-w-md rounded-t-3xl bg-card p-6 ring-1 ring-border shadow-elevated sm:rounded-3xl"
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-warn text-warn-foreground">
              <Activity className="h-6 w-6" />
            </div>
            <h2 className="mt-4 font-display text-xl font-extrabold">Unusual movement detected</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sudden motion pattern looks like a fall. Are you safe? SOS will be sent automatically in <strong className="text-foreground tabular-nums">{secondsLeft}s</strong>.
            </p>

            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full bg-warn"
                initial={{ width: "100%" }}
                animate={{ width: `${(secondsLeft / 15) * 100}%` }}
                transition={{ duration: 0.4, ease: "linear" }}
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-2xl border-safe text-safe hover:bg-safe-soft"
                onClick={() => setOpen(false)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> I'm safe
              </Button>
              <Button
                size="lg"
                className="h-12 rounded-2xl bg-gradient-sos text-danger-foreground"
                onClick={() => { setOpen(false); nav("/app/sos"); }}
              >
                <AlertTriangle className="mr-2 h-4 w-4" /> Send SOS now
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
