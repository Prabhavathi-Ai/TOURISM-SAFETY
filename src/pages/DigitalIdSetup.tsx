import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Fingerprint, Hash, FileBadge, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/store/app";
import { toast } from "sonner";

export default function DigitalIdSetup() {
  const nav = useNavigate();
  const { profile } = useApp();
  const [stage, setStage] = useState<"idle" | "minting" | "done">("idle");

  const mint = async () => {
    setStage("minting");
    await new Promise((r) => setTimeout(r, 1800));
    setStage("done");
    toast.success("Digital ID anchored on Polygon Mumbai (sim)");
    setTimeout(() => nav("/app"), 900);
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 pb-10 pt-14">
      <div className="text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-hero text-primary-foreground shadow-elevated">
          <Fingerprint className="h-7 w-7" />
        </div>
        <h1 className="mt-5 font-display text-3xl font-extrabold">Create your Digital ID</h1>
        <p className="mt-2 text-sm text-muted-foreground text-balance">
          A tamper-proof, blockchain-anchored credential. Authorities can verify you instantly during emergencies — no plaintext data exposed.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative mt-8 overflow-hidden rounded-3xl bg-gradient-hero p-6 text-primary-foreground shadow-elevated"
      >
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4" /> SafeTrek Tourist ID
          </div>
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">Web3</span>
        </div>
        <div className="mt-6">
          <div className="text-xs uppercase tracking-wider opacity-70">Holder</div>
          <div className="font-display text-xl font-bold">{profile.name}</div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="opacity-70">Nationality</div>
            <div className="font-semibold">{profile.nationality}</div>
          </div>
          <div>
            <div className="opacity-70">Insurance</div>
            <div className="truncate font-semibold">{profile.insurance.split("·")[0]}</div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2 font-mono text-[11px]">
          <Hash className="h-3.5 w-3.5 opacity-70" />
          <span className="truncate">{profile.passportHash}</span>
        </div>
      </motion.div>

      <ul className="mt-6 space-y-2.5 text-sm">
        {[
          "Passport number is hashed — never stored in plaintext.",
          "Insurance & emergency contacts encrypted off-chain (IPFS).",
          "Only a verification proof is anchored on Polygon Mumbai.",
        ].map((t) => (
          <li key={t} className="flex items-start gap-2 text-muted-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-safe" />
            <span>{t}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-8">
        {stage !== "done" ? (
          <Button
            size="lg" disabled={stage === "minting"}
            onClick={mint}
            className="h-14 w-full rounded-2xl bg-gradient-hero text-base font-semibold shadow-elevated"
          >
            {stage === "minting" ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Anchoring on blockchain…</>
            ) : (
              <><FileBadge className="mr-2 h-5 w-5" /> Mint Digital ID</>
            )}
          </Button>
        ) : (
          <div className="rounded-2xl bg-safe-soft p-4 text-safe">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-5 w-5" /> ID anchored successfully
            </div>
            <div className="mt-1 truncate font-mono text-xs opacity-80">{profile.digitalIdHash}</div>
          </div>
        )}
      </div>
    </div>
  );
}
