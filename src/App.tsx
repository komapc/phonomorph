import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import TransformationPage from './pages/TransformationPage';

function App() {
  return (
    <Router>
      <div className="dashboard-container">
        <header className="header">
          <Link to="/" className="logo">
            Phono<span>Morph</span>
          </Link>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            The Universal Atlas of Phonetic Evolution
          </div>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/transform/:fromId/:toId" element={<TransformationPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
