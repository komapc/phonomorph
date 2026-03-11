import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import TransformationPage from './pages/TransformationPage';
import About from './pages/About';
import Sources from './pages/Sources';
import ComparePage from './pages/ComparePage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DataProvider } from './contexts/DataContext';

function App() {
  return (
    <DataProvider>
      <Router>
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
          <nav className="flex-row">
            <Link to="/sources" className="nav-link">Bibliography</Link>
            <Link to="/about" className="nav-link">About the Atlas</Link>
          </nav>
        </header>

        <main>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/transform/:fromId/:toId" element={<TransformationPage />} />
              <Route path="/compare/:shiftA/:shiftB" element={<ComparePage />} />
              <Route path="/about" element={<About />} />
              <Route path="/sources" element={<Sources />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
      </Router>
    </DataProvider>
  );
}

export default App;
