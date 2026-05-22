import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, MapPin, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";

const slides = [
  { icon: ShieldCheck, title: "Travel with confidence", text: "AI scores your safety in real time using time, location and incident data." },
  { icon: MapPin,      title: "Smart geo-fencing",     text: "Get instant alerts when you approach risky zones — context-aware to solo travelers." },
  { icon: Siren,       title: "One-tap SOS",           text: "Share your location and digital ID with emergency contacts and authorities instantly." },
];

export default function Onboarding() {
  const nav = useNavigate();
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-gradient-hero text-primary-foreground">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-10 h-80 w-80 rounded-full bg-primary-glow/30 blur-3xl" />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 pb-10 pt-14">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold">SafeTrek</span>
        </div>

        <div className="mt-10">
          <h1 className="font-display text-4xl font-extrabold leading-tight text-balance">
            Your AI travel companion for safer journeys.
          </h1>
          <p className="mt-3 text-base text-primary-foreground/80">
            Predictive risk scoring · Blockchain Digital ID · Offline SOS.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {slides.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-start gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-md ring-1 ring-white/15"
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/20">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold">{s.title}</div>
                  <p className="text-sm text-primary-foreground/80">{s.text}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-auto pt-8">
          <Button
            size="lg"
            className="h-14 w-full rounded-2xl bg-white text-primary hover:bg-white/90 text-base font-semibold shadow-elevated"
            onClick={() => nav("/auth")}
          >
            Get started
          </Button>
          <button
            className="mt-3 w-full text-center text-sm text-primary-foreground/80 hover:text-primary-foreground"
            onClick={() => nav("/auth")}
          >
            I already have an account
          </button>
        </div>
      </div>
    </div>
  );
}
