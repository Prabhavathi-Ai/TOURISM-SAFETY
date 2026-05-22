// AuthProvider — wires Supabase auth + profile fetch into the global zustand store,
// then keeps the profile in sync via realtime updates.
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/store/app";

interface AuthCtx {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({ session: null, user: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { updateProfile, setOnboarded } = useApp();

  // Fetch profile row and merge into the global store.
  // Defined inline so the auth listener stays synchronous (avoids deadlocks).
  const syncProfile = (uid: string, fallbackEmail?: string) => {
    setTimeout(async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("name, email, phone, nationality")
        .eq("id", uid)
        .maybeSingle();

      if (error) {
        console.error("Profile fetch failed", error);
        return;
      }
      if (data) {
        updateProfile({
          name: data.name || fallbackEmail?.split("@")[0] || "Traveler",
          email: data.email,
          phone: data.phone ?? "",
          nationality: data.nationality ?? "",
        });
        setOnboarded(true);
      }
    }, 0);
  };

  useEffect(() => {
    // 1. Subscribe FIRST so we never miss an event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) syncProfile(sess.user.id, sess.user.email ?? undefined);
    });

    // 2. Then check existing session (e.g. page refresh).
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      if (sess?.user) syncProfile(sess.user.id, sess.user.email ?? undefined);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime: when this user's profile row changes (anywhere — another tab, admin, etc.),
  // push the new values into the store so every screen updates without a refresh.
  useEffect(() => {
    if (!session?.user) return;
    const uid = session.user.id;
    const channel = supabase
      .channel(`profile:${uid}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${uid}` },
        (payload) => {
          const next = payload.new as { name: string; email: string; phone: string | null; nationality: string | null };
          updateProfile({
            name: next.name,
            email: next.email,
            phone: next.phone ?? "",
            nationality: next.nationality ?? "",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user, updateProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setOnboarded(false);
  };

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
