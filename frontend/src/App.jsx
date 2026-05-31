import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "./components/Layout";
import LiveFeed from "./pages/LiveFeed";
import WalletExplorer from "./pages/WalletExplorer";
import Analytics from "./pages/Analytics";
import { fetchTotalSignals } from "./lib/contract";

export default function App() {
  const [totalSignals, setTotalSignals] = useState(0);
  const agentActive = !!import.meta.env.VITE_CONTRACT_ADDRESS;

  useEffect(() => {
    const load = () => fetchTotalSignals().then(setTotalSignals).catch(() => {});
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <BrowserRouter>
      <Layout agentActive={agentActive} totalSignals={totalSignals}>
        <Routes>
          <Route path="/" element={<LiveFeed />} />
          <Route path="/wallet" element={<WalletExplorer />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
