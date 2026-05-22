import { useState } from "react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, MapPin, ShieldAlert, Send } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useApp } from "@/store/app";
import { useLivePosition } from "@/hooks/useLiveSafety";

const TYPES = ["Theft", "Harassment", "Unsafe Area", "Scam", "Medical"] as const;

export default function ReportIncident() {
  const nav = useNavigate();
  const { profile, addReport } = useApp();
  const pos = useLivePosition(5000);
  const [type, setType] = useState<(typeof TYPES)[number]>("Theft");
  const [desc, setDesc] = useState("");
  const [anon, setAnon] = useState(profile.anonymousReporting);
  const [imageName, setImageName] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (desc.trim().length < 10) {
      toast.error("Please add a few more details (min 10 characters).");
      return;
    }
    addReport({
      id: crypto.randomUUID(),
      type,
      description: desc.trim(),
      position: [pos.lat, pos.lng],
      timeAgo: "just now",
      reporter: anon ? "Anonymous" : profile.name,
      severity: type === "Theft" || type === "Harassment" ? "danger" : "warn",
      reportedAt: Date.now(),
    });
    toast.success("Report submitted — AI is updating risk zones.", {
      description: anon ? "Submitted anonymously." : `Reported as ${profile.name}.`,
    });
    nav("/app/map");
  };

  return (
    <div>
      <ScreenHeader title="Report an incident" subtitle="Help others stay safe" back />

      <form onSubmit={submit} className="space-y-5 px-5">
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Type</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                type="button" key={t} onClick={() => setType(t)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-95",
                  type === t ? "border-primary bg-primary text-primary-foreground shadow-soft" : "border-border bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="desc">Description</Label>
          <Textarea
            id="desc" rows={5} value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder="What happened? Where? Approximate time?"
            className="mt-1.5 resize-none"
            maxLength={500}
          />
          <div className="mt-1 text-right text-[11px] text-muted-foreground">{desc.length}/500</div>
        </div>

        <div className="rounded-2xl border-2 border-dashed border-border bg-card p-4 text-center">
          <label className="flex cursor-pointer flex-col items-center gap-2">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Camera className="h-5 w-5" />
            </div>
            <div className="text-sm font-semibold">{imageName ?? "Add a photo (optional)"}</div>
            <div className="text-xs text-muted-foreground">JPEG/PNG up to 8MB</div>
            <Input type="file" accept="image/*" className="hidden" onChange={(e) => setImageName(e.target.files?.[0]?.name ?? null)} />
          </label>
        </div>

        <div className="flex items-start gap-3 rounded-2xl bg-accent/40 p-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-card text-primary">
            <MapPin className="h-4.5 w-4.5" />
          </div>
          <div className="flex-1 text-sm">
            <div className="font-semibold">Connaught Place, New Delhi</div>
            <div className="text-xs text-muted-foreground">Auto-detected · {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)}</div>
          </div>
        </div>

        <label className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-border shadow-soft">
          <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} className="h-4 w-4 accent-primary" />
          <div className="flex-1 text-sm">
            <div className="font-semibold">Submit anonymously</div>
            <div className="text-xs text-muted-foreground">Your identity won't be visible to other travelers.</div>
          </div>
          <ShieldAlert className="h-4 w-4 text-muted-foreground" />
        </label>

        <Button type="submit" size="lg" className="h-12 w-full rounded-2xl bg-gradient-hero text-base font-semibold shadow-elevated">
          <Send className="mr-2 h-4 w-4" /> Submit report
        </Button>
      </form>
    </div>
  );
}
