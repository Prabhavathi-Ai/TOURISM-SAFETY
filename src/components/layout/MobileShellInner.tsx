import { BottomNav } from "./BottomNav";
import { PageTransitions } from "./PageTransitions";
import { FallDetectionWatcher } from "@/components/safety/FallDetectionWatcher";

/**
 * Mobile-first shell. Caps width at ~max-w-md so the demo feels like a native app
 * even on desktop. Hosts page transitions + the AI fall-detection prompt.
 */
export function MobileShell() {
  return (
    <div className="min-h-screen w-full bg-muted/40">
      <div className="relative mx-auto min-h-screen w-full max-w-md bg-background shadow-2xl">
        <main className="pb-28">
          <PageTransitions />
        </main>
        <BottomNav />
        <FallDetectionWatcher />
      </div>
    </div>
  );
}
