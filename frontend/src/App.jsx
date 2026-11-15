import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Layout        from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import PageLoader    from "./components/PageLoader";
import { IS_DEMO }   from "./lib/contract";

// Route-level code splitting — each page loads only when visited
const LiveFeed       = lazy(() => import("./pages/LiveFeed"));
const WalletExplorer = lazy(() => import("./pages/WalletExplorer"));
const Analytics      = lazy(() => import("./pages/Analytics"));
const NotFound       = lazy(() => import("./pages/NotFound"));

export default function App() {
  return (
    <BrowserRouter>
      <Layout live={!IS_DEMO}>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"          element={<LiveFeed />}       />
              <Route path="/wallet"    element={<WalletExplorer />} />
              <Route path="/analytics" element={<Analytics />}      />
              <Route path="*"          element={<NotFound />}       />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Layout>
    </BrowserRouter>
  );
}
