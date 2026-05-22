import { useEffect, useState } from "react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { useApp } from "@/store/app";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight, Plus, Trash2, ShieldCheck, MapPin, Globe, LogOut, UserRound, Lock, Moon, EyeOff, Timer, BarChart3, Pencil, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme/ThemeProvider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export default function Settings() {
  const nav = useNavigate();
  const { profile, updateProfile, addContact, removeContact } = useApp();
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("Friend");
  const [now, setNow] = useState(Date.now());

  // Auto-revoke temp share after expiry
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    if (profile.tempShareUntil && profile.tempShareUntil <= now) {
      updateProfile({ tempShareUntil: null });
      toast("Temporary location sharing ended");
    }
  }, [now, profile.tempShareUntil, updateProfile]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    addContact({ id: crypto.randomUUID(), name: name.trim(), phone: phone.trim(), relation: relation.trim() || "Contact" });
    setName(""); setPhone(""); setRelation("Friend"); setAdding(false);
    toast.success("Emergency contact added");
  };

  const tempActive = profile.tempShareUntil && profile.tempShareUntil > now;
  const remainingMin = tempActive ? Math.ceil((profile.tempShareUntil! - now) / 60_000) : 0;

  return (
    <div>
      <ScreenHeader
        title="Settings"
        subtitle="Profile, contacts & privacy"
        right={
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => nav("/admin")}>
            <BarChart3 className="mr-1.5 h-4 w-4" /> Admin
          </Button>
        }
      />

      {/* Profile card */}
      <section className="mx-5">
        <button onClick={() => nav("/digital-id")} className="flex w-full items-center gap-4 rounded-2xl bg-gradient-hero p-4 text-left text-primary-foreground shadow-elevated">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 text-2xl font-bold">
            {profile.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1">
            <div className="font-display text-lg font-extrabold leading-tight">{profile.name}</div>
            <div className="text-xs text-primary-foreground/80">{profile.email}</div>
            <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              <ShieldCheck className="h-3 w-3" /> Digital ID verified
            </div>
          </div>
          <ChevronRight className="h-5 w-5 opacity-80" />
        </button>
      </section>

      {/* Transparency banner */}
      <section className="mx-5 mt-4 flex items-start gap-3 rounded-2xl bg-accent/50 p-4 ring-1 ring-accent">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-card text-primary">
          <Lock className="h-4.5 w-4.5" />
        </div>
        <p className="text-xs leading-relaxed text-foreground">
          <strong>Your privacy is protected.</strong> Location is shared only during emergencies or in high-risk zones, per your settings below. Sensitive data (passport, contacts) is end-to-end encrypted.
        </p>
      </section>

      {/* Editable name — writes to public.profiles; realtime sync updates the store everywhere */}
      <EditableName />

      {/* Emergency contacts */}
      <section className="mt-6 px-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-base font-bold">Emergency contacts</h3>
          <Button size="sm" variant="ghost" className="text-primary" onClick={() => setAdding((v) => !v)}>
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </div>

        {adding && (
          <form onSubmit={submit} className="mb-3 space-y-2 rounded-2xl bg-card p-3 ring-1 ring-border shadow-soft">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="cname" className="text-xs">Name</Label>
                <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="crel" className="text-xs">Relation</Label>
                <Input id="crel" value={relation} onChange={(e) => setRelation(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="cphone" className="text-xs">Phone</Label>
              <Input id="cphone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <Button type="submit" size="sm" className="w-full">Add contact</Button>
          </form>
        )}

        <ul className="space-y-2">
          {profile.contacts.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border shadow-soft">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                <UserRound className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.relation} · {c.phone}</div>
              </div>
              <button
                onClick={() => { removeContact(c.id); toast("Contact removed"); }}
                className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-danger-soft hover:text-danger"
                aria-label={`Remove ${c.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Privacy */}
      <section className="mt-6 px-5">
        <h3 className="mb-3 font-display text-base font-bold">Privacy & safety</h3>
        <div className="divide-y divide-border rounded-2xl bg-card ring-1 ring-border shadow-soft">
          <ToggleRow
            icon={UserRound} title="Solo traveler mode"
            desc="Stricter alerts and lower thresholds for risky zones."
            value={profile.soloMode}
            onChange={(v) => updateProfile({ soloMode: v })}
          />
          <ToggleRow
            icon={EyeOff} title="Anonymous reporting by default"
            desc="Hide your name on incident reports you submit."
            value={profile.anonymousReporting}
            onChange={(v) => updateProfile({ anonymousReporting: v })}
          />
          <RadioRow
            icon={MapPin} title="Share live location"
            value={profile.shareLocation}
            onChange={(v) => updateProfile({ shareLocation: v })}
          />
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Timer className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">Temporary location sharing</div>
                <div className="text-xs text-muted-foreground">
                  {tempActive ? `Active · auto-disables in ${remainingMin} min` : "Share for a limited window with contacts."}
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {[15, 60, 240].map((mins) => (
                <button
                  key={mins}
                  onClick={() => {
                    updateProfile({ tempShareUntil: Date.now() + mins * 60_000 });
                    toast.success(`Sharing for ${mins} min`);
                  }}
                  className="rounded-xl border border-border bg-card px-2 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                </button>
              ))}
            </div>
            {tempActive && (
              <Button size="sm" variant="outline" className="mt-2 w-full text-danger" onClick={() => updateProfile({ tempShareUntil: null })}>
                Stop sharing now
              </Button>
            )}
          </div>
          <ToggleRow
            icon={Lock} title="Encrypt sensitive data" desc="End-to-end encryption for ID & contacts." value disabled
          />
          <ToggleRow
            icon={Moon} title="Dark mode" desc="Easier on the eyes at night."
            value={theme === "dark"} onChange={toggle}
          />
          <button onClick={() => toast("Language picker coming soon")} className="flex w-full items-center gap-3 p-4 text-left">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Globe className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">Language</div>
              <div className="text-xs text-muted-foreground">English (US)</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </section>

      <section className="mt-6 px-5">
        <Button
          variant="outline"
          className="h-12 w-full rounded-2xl"
          onClick={async () => {
            await signOut();
            nav("/");
            toast("Signed out");
          }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
        <p className="mt-4 text-center text-xs text-muted-foreground">SafeTrek · v0.2 · demo build</p>
      </section>
    </div>
  );
}

/**
 * Inline editor for the user's name. Persists to public.profiles via the
 * authenticated client; the AuthProvider's realtime subscription will sync
 * the new value back into the global store, so every screen updates instantly
 * without a refresh or re-login.
 */
function EditableName() {
  const { profile, updateProfile } = useApp();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(profile.name);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) setValue(profile.name);
  }, [profile.name, editing]);

  if (!user) return null;

  const save = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      toast.error("Name can't be empty");
      return;
    }
    setSaving(true);
    // Optimistic — the realtime listener will reconcile if anything differs.
    updateProfile({ name: trimmed });
    const { error } = await supabase
      .from("profiles")
      .update({ name: trimmed })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Couldn't save name");
      return;
    }
    setEditing(false);
    toast.success("Name updated");
  };

  return (
    <section className="mx-5 mt-4">
      <div className="rounded-2xl bg-card p-4 ring-1 ring-border shadow-soft">
        <div className="mb-2 flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Display name</Label>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button onClick={() => { setEditing(false); setValue(profile.name); }} className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
              <button onClick={save} disabled={saving} className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50">
                <Check className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        {editing ? (
          <Input value={value} onChange={(e) => setValue(e.target.value)} autoFocus className="h-11" />
        ) : (
          <div className="text-base font-semibold">{profile.name || "—"}</div>
        )}
        <div className="mt-1 text-xs text-muted-foreground">{profile.email}</div>
      </div>
    </section>
  );
}

function ToggleRow({
  icon: Icon, title, desc, value, onChange, disabled,
}: { icon: typeof UserRound; title: string; desc: string; value: boolean; onChange?: (v: boolean) => void; disabled?: boolean; }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={value} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

function RadioRow({
  icon: Icon, title, value, onChange,
}: { icon: typeof MapPin; title: string; value: "always" | "emergency" | "never"; onChange: (v: "always" | "emergency" | "never") => void; }) {
  const opts: { v: typeof value; label: string }[] = [
    { v: "always", label: "Always" },
    { v: "emergency", label: "Emergency only" },
    { v: "never", label: "Never" },
  ];
  return (
    <div className="p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">Choose when SafeTrek can share your live location.</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {opts.map((o) => (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            className={cn(
              "rounded-xl border px-2 py-2 text-xs font-semibold transition-colors",
              value === o.v ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
