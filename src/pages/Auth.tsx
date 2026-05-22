import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Mail, Lock, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Mode = "signin" | "signup";

export default function Auth() {
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Required so Supabase redirects back to the app after email confirmation
            emailRedirectTo: `${window.location.origin}/digital-id`,
            // Stored in raw_user_meta_data — handle_new_user() trigger reads it into profiles.name
            data: { name: name.trim() || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Account created — welcome to SafeTrek");
        nav("/digital-id");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
        nav("/app");
      }
    } catch (err: any) {
      const msg = err?.message ?? "Something went wrong";
      // Friendly mapping of common Supabase errors
      if (/already registered/i.test(msg)) toast.error("That email already has an account — sign in instead.");
      else if (/invalid login/i.test(msg)) toast.error("Wrong email or password.");
      else toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/app` },
    });
    if (error) {
      toast.error(error.message);
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 pb-10 pt-14">
      <div className="flex items-center gap-2 text-primary">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-hero text-primary-foreground shadow-elevated">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <span className="font-display text-lg font-bold text-foreground">SafeTrek</span>
      </div>

      <div className="mt-10">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1.5 text-muted-foreground">
          {mode === "signin" ? "Sign in to continue your safe journey." : "We'll personalize the app with your name."}
        </p>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-4">
        {mode === "signup" && (
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Maya Rodriguez" className="h-12 pl-10" required />
            </div>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-12 pl-10" required />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="h-12 pl-10" minLength={6} required />
          </div>
        </div>
        <Button type="submit" size="lg" disabled={busy} className="h-12 w-full rounded-xl bg-gradient-hero text-base font-semibold shadow-elevated">
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        or
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button variant="outline" size="lg" disabled={busy} className="h-12 w-full rounded-xl text-base font-semibold" onClick={google}>
        <svg className="mr-2 h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.4 1 7.4 2.8l5.7-5.7C33.7 6.5 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.6 19 13 24 13c2.8 0 5.4 1 7.4 2.8l5.7-5.7C33.7 6.5 29.1 4.5 24 4.5 16.4 4.5 9.9 8.7 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 43.5c5 0 9.5-1.9 12.9-5l-6-4.9C29.1 35.3 26.7 36.5 24 36.5c-5.2 0-9.6-3.3-11.2-8l-6.6 5.1C9.6 39.3 16.2 43.5 24 43.5z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6 4.9C40.9 35.4 43.5 30.1 43.5 24c0-1.2-.1-2.4-.4-3.5z"/>
        </svg>
        Continue with Google
      </Button>

      <p className="mt-auto pt-8 text-center text-sm text-muted-foreground">
        {mode === "signin" ? "New here? " : "Already have an account? "}
        <button
          type="button"
          className="font-semibold text-primary"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "Create account" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
