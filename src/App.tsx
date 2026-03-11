import { HashRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Suspense, lazy, useCallback } from 'react';
import Home from './pages/Home';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DataProvider } from './contexts/DataContext';
import { SearchBar } from './components/SearchBar';

// Lazy load detail pages for code splitting
const TransformationPage = lazy(() => import('./pages/TransformationPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const About = lazy(() => import('./pages/About'));
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
          <Link to="/" className="logo">
            Echo<span>Drift</span>
          </Link>
          <div className="tagline">
            The Universal Atlas of Phonetic Evolution
          </div>
        </div>
        <SearchBar onResultClick={handleSearchResult} />
        <nav className="flex-row">
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
              element={
                <Suspense fallback={<PageLoader />}>
                  <TransformationPage />
                </Suspense>
              }
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
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
}

// Outer component with DataProvider and Router
function App() {
  return (
    <DataProvider>
      <Router>
        <AppContent />
      </Router>
    </DataProvider>
  );
}

export default App;
