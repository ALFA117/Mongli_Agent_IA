import Navbar from "./Navbar";

export default function Layout({ children, agentActive = false, totalSignals = 0 }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar agentActive={agentActive} totalSignals={totalSignals} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-slate-800/60 px-6 py-4 text-center">
        <span className="text-xs font-mono text-slate-700">
          Mongli Agent IA · Mantle Network · Turing Test 2026
        </span>
      </footer>
    </div>
  );
}
