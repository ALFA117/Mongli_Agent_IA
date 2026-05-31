import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "./components/Layout";
import LiveFeed from "./pages/LiveFeed";
import WalletExplorer from "./pages/WalletExplorer";
import Analytics from "./pages/Analytics";
import { fetchTotalSignals, fetchLatestSignal } from "./lib/contract";

export default function App() {
  const [totalSignals,  setTotalSignals]  = useState(0);
  const [latestSignal,  setLatestSignal]  = useState(null);
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
      <Layout
        agentActive={agentActive}
        totalSignals={totalSignals}
        latestSignal={latestSignal}
      >
        <Routes>
          <Route path="/"        element={<LiveFeed />}       />
          <Route path="/wallet"  element={<WalletExplorer />} />
          <Route path="/analytics" element={<Analytics />}   />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
