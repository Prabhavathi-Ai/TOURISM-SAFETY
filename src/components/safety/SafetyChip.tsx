import { ZoneType } from "@/data/safety";
import { cn } from "@/lib/utils";

const styles: Record<ZoneType, string> = {
  safe: "bg-safe-soft text-safe ring-1 ring-inset ring-[hsl(var(--safe)/0.25)]",
  warn: "bg-warn-soft text-[hsl(30_60%_25%)] ring-1 ring-inset ring-[hsl(var(--warn)/0.35)]",
  danger: "bg-danger-soft text-danger ring-1 ring-inset ring-[hsl(var(--danger)/0.3)]",
};

const dot: Record<ZoneType, string> = {
  safe: "bg-safe", warn: "bg-warn", danger: "bg-danger",
};

export function SafetyChip({ tone, children }: { tone: ZoneType; children: React.ReactNode }) {
  return (
    <span className={cn("safety-chip", styles[tone])}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dot[tone])} />
      {children}
    </span>
  );
}
