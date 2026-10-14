import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import type { PagePayload } from './data/transformPayload';
import { PagePayloadProvider } from './contexts/PagePayloadContext';
import { Suspense, lazy, useCallback } from 'react';
import { About, Glossary, Directory, Families } from './pages/prerenderedPages';
import Home from './pages/Home';
// Eager: transform pages are the main landing route; a lazy chunk adds a
// serial round trip (bundle -> chunk -> data) to LCP.
import TransformationPage from './pages/TransformationPage';
// Eager for the same reason: prerendered hub pages hydrate without waiting for a chunk.
import HubPage from './pages/HubPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DataProvider } from './contexts/DataContext';
import { SearchBar } from './components/SearchBar';
import Footer from './components/Footer';
import './footer.css';

const ComparePage = lazy(() => import('./pages/ComparePage'));
const Sources = lazy(() => import('./pages/Sources'));

// Simple loading fallback component
const PageLoader = () => (
  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
    Loading...
  </div>
);

// Inner component that uses useNavigate from Router context
function AppContent() {
  const navigate = useNavigate();

  const handleSearchResult = useCallback((fromId: string, toId: string) => {
    navigate(`/transform/${fromId}/${toId}`);
  }, [navigate]);

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="flex-col">
          <Link to="/" className="logo" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <img src="/favicon.svg" alt="EchoDrift Logo" style={{ width: "32px", height: "32px", borderRadius: "6px" }} />
            <div>Echo<span>Drift</span></div>
          </Link>
          <div className="tagline">
            The Universal Atlas of Phonetic Evolution
          </div>
        </div>
        <SearchBar onResultClick={handleSearchResult} />
        <nav className="flex-row">
          <Link to="/directory" className="nav-link">Directory</Link>
          <Link to="/families" className="nav-link">Families</Link>
          <Link to="/glossary" className="nav-link">Glossary</Link>
          <Link to="/sources" className="nav-link">Bibliography</Link>
          <Link to="/about" className="nav-link">About the Atlas</Link>
        </nav>
      </header>

      <main>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/transform/:fromId/:toId"
              element={<TransformationPage />}
            />
            <Route
              path="/compare/:shiftA/:shiftB"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ComparePage />
                </Suspense>
              }
            />
            <Route
              path="/about"
              element={
                <Suspense fallback={<PageLoader />}>
                  <About />
                </Suspense>
              }
            />
            <Route
              path="/sources"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Sources />
                </Suspense>
              }
            />
            <Route
              path="/glossary"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Glossary />
                </Suspense>
              }
            />
            <Route
              path="/directory"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Directory />
                </Suspense>
              }
            />
            <Route
              path="/families"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Families />
                </Suspense>
              }
            />
            <Route
              path="/language/:slug"
              element={<HubPage mode="language" />}
            />
            <Route
              path="/family/:slug"
              element={<HubPage mode="family" />}
            />
            <Route
              path="/process/:slug"
              element={<HubPage mode="process" />}
            />
          </Routes>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}

/**
 * The whole app below the router. Exported separately so the build-time
 * prerenderer (scripts/prerender.ts) can render it inside a StaticRouter.
 * `payload` is the data of a prerendered page, if any.
 */
export function AppShell({ payload = null }: { payload?: PagePayload | null }) {
  return (
    <PagePayloadProvider value={payload}>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </PagePayloadProvider>
  );
}

function App({ payload = null }: { payload?: PagePayload | null }) {
  return (
    <Router>
      <AppShell payload={payload} />
    </Router>
  );
}

export default App;
