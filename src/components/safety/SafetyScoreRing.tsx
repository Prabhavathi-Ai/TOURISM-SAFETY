import { motion } from "framer-motion";
import { ZoneType } from "@/data/safety";
import { cn } from "@/lib/utils";

interface Props {
  score: number;
  label: string;
  tone: ZoneType;
  size?: number;
  confidence?: "low" | "medium" | "high";
}

const toneStroke: Record<ZoneType, string> = {
  safe: "hsl(var(--safe))",
  warn: "hsl(var(--warn))",
  danger: "hsl(var(--danger))",
};
const toneText: Record<ZoneType, string> = {
  safe: "text-safe",
  warn: "text-warn",
  danger: "text-danger",
};
const toneSoft: Record<ZoneType, string> = {
  safe: "bg-safe/20 text-safe",
  warn: "bg-warn/20 text-warn",
  danger: "bg-danger/20 text-danger",
};

export function SafetyScoreRing({ score, label, tone, size = 180, confidence }: Props) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const gradId = `ring-grad-${tone}`;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={toneStroke[tone]} stopOpacity="0.6" />
            <stop offset="100%" stopColor={toneStroke[tone]} stopOpacity="1" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} className="stroke-white/20" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={`url(#${gradId})`}
          strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 8px ${toneStroke[tone]})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] font-medium uppercase tracking-wider text-white/70">Safety</span>
        <motion.span
          key={score}
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: "backOut" }}
          className="font-display text-5xl font-extrabold tabular-nums leading-none"
        >
          {score}
        </motion.span>
        <span className={cn("mt-1 text-sm font-semibold", toneText[tone])}>{label}</span>
        {confidence && (
          <span className={cn("mt-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider", toneSoft[tone])}>
            {confidence} conf.
          </span>
        )}
      </div>
    </div>
  );
}
