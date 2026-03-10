import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import TransformationPage from './pages/TransformationPage';
import About from './pages/About';
import Sources from './pages/Sources';

function App() {
  return (
    <Router>
      <div className="dashboard-container">
        <header className="header">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Link to="/" className="logo">
              Phono<span>Morph</span>
            </Link>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              The Universal Atlas of Phonetic Evolution
            </div>
          </div>
          <nav style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/sources" style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '0.95rem', 
              fontWeight: 500,
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--surface-color)'
            }}>Bibliography</Link>
            <Link to="/about" style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '0.95rem', 
              fontWeight: 500,
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--surface-color)'
            }}>About the Atlas</Link>
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/transform/:fromId/:toId" element={<TransformationPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/sources" element={<Sources />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
