import Navbar, { TabBar } from "./Navbar";
import DemoBanner from "./DemoBanner";

export default function Layout({ children, live = false }) {
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 btn-secondary"
      >
        Skip to content
      </a>
      <Navbar live={live} />
      <DemoBanner />
      <main id="main" className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 pt-8 pb-28 md:pb-16">
        {children}
      </main>
      <footer className="border-t border-line hidden md:block">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted">
          <span>Mongli Agent IA · signal intelligence for Mantle</span>
          <span>Built for Hackathon Turing Test 2026</span>
        </div>
      </footer>
      <TabBar />
    </div>
  );
}
