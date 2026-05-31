import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import Layout       from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import PageLoader   from "./components/PageLoader";
import { fetchTotalSignals, fetchLatestSignal } from "./lib/contract";

// Route-level code splitting — each page loads only when visited
const LiveFeed       = lazy(() => import("./pages/LiveFeed"));
const WalletExplorer = lazy(() => import("./pages/WalletExplorer"));
const Analytics      = lazy(() => import("./pages/Analytics"));
const NotFound       = lazy(() => import("./pages/NotFound"));

export default function App() {
  const [totalSignals, setTotalSignals] = useState(0);
  const [latestSignal, setLatestSignal] = useState(null);
  const agentActive = !!import.meta.env.VITE_CONTRACT_ADDRESS;

  useEffect(() => {
    async function load() {
      const [total, latest] = await Promise.all([
        fetchTotalSignals().catch(() => 0),
        fetchLatestSignal().catch(() => null),
      ]);
      setTotalSignals(total);
      setLatestSignal(latest);
    }
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Layout agentActive={agentActive} totalSignals={totalSignals} latestSignal={latestSignal}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"          element={<LiveFeed />}       />
              <Route path="/wallet"    element={<WalletExplorer />} />
              <Route path="/analytics" element={<Analytics />}      />
              <Route path="*"          element={<NotFound />}       />
            </Routes>
          </Suspense>
        </Layout>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
