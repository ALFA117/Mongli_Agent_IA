import { MotionConfig } from "motion/react";
import Navbar from "./Navbar";
import DemoBanner from "./DemoBanner";
import AmbientBackground from "./AmbientBackground";

export default function Layout({ children, agentActive = false, totalSignals = 0, latestSignal = null }) {
  return (
    <MotionConfig reducedMotion="user">
      <AmbientBackground />
      <a href="#main" className="skip-link">Skip to content</a>
      <div className="min-h-dvh flex flex-col">
        <Navbar agentActive={agentActive} totalSignals={totalSignals} latestSignal={latestSignal} />
        <DemoBanner />
        <main id="main" tabIndex={-1} className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 outline-none">
          {children}
        </main>
        <footer className="border-t border-line/[0.06]" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-muted">Mongli Agent IA · Mantle Network</span>
            <span className="font-mono text-xs text-muted">Hackathon Turing Test 2026 · MIT</span>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
