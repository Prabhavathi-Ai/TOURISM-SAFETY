import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className={cn(
        "relative grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-card/50 ring-1 ring-border/60 backdrop-blur transition-colors hover:bg-card",
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === "dark" ? (
          <motion.span key="sun" initial={{ y: 12, opacity: 0, rotate: -45 }} animate={{ y: 0, opacity: 1, rotate: 0 }} exit={{ y: -12, opacity: 0, rotate: 45 }} transition={{ duration: 0.2 }}>
            <Sun className="h-5 w-5 text-warn" />
          </motion.span>
        ) : (
          <motion.span key="moon" initial={{ y: 12, opacity: 0, rotate: -45 }} animate={{ y: 0, opacity: 1, rotate: 0 }} exit={{ y: -12, opacity: 0, rotate: 45 }} transition={{ duration: 0.2 }}>
            <Moon className="h-5 w-5 text-primary" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
