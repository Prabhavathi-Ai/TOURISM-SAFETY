// Tiny shared store (no backend yet). Replace with Lovable Cloud later.
import { create } from "zustand";
import { Incident, INCIDENTS } from "@/data/safety";

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  nationality: string;
  passportHash: string;
  insurance: string;
  digitalIdHash: string;
  contacts: EmergencyContact[];
  soloMode: boolean;
  shareLocation: "always" | "emergency" | "never";
  anonymousReporting: boolean;
  /** When set, location is shared until this timestamp (ms). After that, auto-revoke. */
  tempShareUntil: number | null;
}

interface AppState {
  onboarded: boolean;
  setOnboarded: (v: boolean) => void;
  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;
  addContact: (c: EmergencyContact) => void;
  removeContact: (id: string) => void;
  sosActive: boolean;
  setSosActive: (v: boolean) => void;
  /** Crowd-sourced reports (live, in-memory). Admin dashboard subscribes. */
  reports: Incident[];
  addReport: (r: Incident) => void;
  /** SOS event log for admin dashboard */
  sosEvents: { id: string; ts: number; lat: number; lng: number; user: string; status: "active" | "resolved" }[];
  pushSosEvent: (e: { lat: number; lng: number; user: string }) => string;
  resolveSosEvent: (id: string) => void;
}

const defaultProfile: UserProfile = {
  name: "Maya Rodriguez",
  email: "maya@example.com",
  phone: "+1 415 555 0192",
  nationality: "United States",
  passportHash: "0x" + "a93f".padEnd(40, "c"),
  insurance: "WorldNomads · Policy #WN-8821-EX",
  digitalIdHash: "0x7c2f…b41e (Polygon Mumbai · sim)",
  contacts: [
    { id: "c1", name: "Elena Rodriguez", phone: "+1 415 555 0144", relation: "Mother" },
    { id: "c2", name: "James K.", phone: "+1 628 555 0177", relation: "Friend" },
  ],
  soloMode: true,
  shareLocation: "emergency",
  anonymousReporting: true,
  tempShareUntil: null,
};

// Seed reports with timestamps so heatmap recency works
const now = Date.now();
const seedReports: Incident[] = INCIDENTS.map((i, idx) => ({
  ...i,
  reportedAt: now - (idx + 1) * 45 * 60_000,
}));

export const useApp = create<AppState>((set) => ({
  onboarded: false,
  setOnboarded: (v) => set({ onboarded: v }),
  profile: defaultProfile,
  updateProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
  addContact: (c) => set((s) => ({ profile: { ...s.profile, contacts: [...s.profile.contacts, c] } })),
  removeContact: (id) =>
    set((s) => ({ profile: { ...s.profile, contacts: s.profile.contacts.filter((x) => x.id !== id) } })),
  sosActive: false,
  setSosActive: (v) => set({ sosActive: v }),
  reports: seedReports,
  addReport: (r) => set((s) => ({ reports: [r, ...s.reports] })),
  sosEvents: [],
  pushSosEvent: (e) => {
    const id = crypto.randomUUID();
    set((s) => ({
      sosEvents: [{ id, ts: Date.now(), lat: e.lat, lng: e.lng, user: e.user, status: "active" }, ...s.sosEvents],
    }));
    return id;
  },
  resolveSosEvent: (id) =>
    set((s) => ({
      sosEvents: s.sosEvents.map((x) => (x.id === id ? { ...x, status: "resolved" } : x)),
    })),
}));
