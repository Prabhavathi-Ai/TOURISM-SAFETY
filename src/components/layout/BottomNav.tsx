import { NavLink, useLocation } from "react-router-dom";
import { Home, Map as MapIcon, Bell, Settings, Siren } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const items = [
  { to: "/app", label: "Home", icon: Home, end: true },
  { to: "/app/map", label: "Map", icon: MapIcon },
  { to: "/app/sos", label: "SOS", icon: Siren, primary: true },
  { to: "/app/alerts", label: "Alerts", icon: Bell },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-border bg-card/90 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5 px-2 pt-2">
        {items.map((it) => {
          const Icon = it.icon;
          const active = it.end ? pathname === it.to : pathname.startsWith(it.to);
          if (it.primary) {
            return (
              <li key={it.to} className="relative -mt-7 flex justify-center">
                <NavLink to={it.to} aria-label="SOS">
                  <motion.div
                    whileTap={{ scale: 0.92 }}
                    className={cn(
                      "flex h-16 w-16 items-center justify-center rounded-full bg-gradient-sos text-danger-foreground shadow-sos animate-sos-pulse"
                    )}
                  >
                    <Icon className="h-7 w-7" strokeWidth={2.5} />
                  </motion.div>
                </NavLink>
              </li>
            );
          }
          return (
            <li key={it.to}>
              <NavLink
                to={it.to}
                end={it.end}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.4]")} />
                <span>{it.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
