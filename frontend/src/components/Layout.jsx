import Navbar from "./Navbar";
import DemoBanner from "./DemoBanner";

export default function Layout({ children, agentActive = false, totalSignals = 0, latestSignal = null }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar agentActive={agentActive} totalSignals={totalSignals} latestSignal={latestSignal} />
      <DemoBanner />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 border-t border-white/[0.03] flex items-center justify-between">
        <span className="text-xs font-mono text-slate-800">Mongli Agent IA · Mantle Network</span>
        <span className="text-xs font-mono text-slate-800">Hackathon Turing Test 2026</span>
      </footer>
    </div>
  );
}
