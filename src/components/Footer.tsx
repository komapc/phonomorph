import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="suite-footer">
      <div className="max-w-4xl mx-auto px-4">
        <div className="footer-line">
          <span>Mea projekti:</span>
          <a href="https://ido-vortaro.pages.dev">Vortaro</a> 
          <span className="footer-sep">(<a href="https://github.com/komapc/vortaro" target="_blank" rel="noopener noreferrer">kodo</a>)</span>
          
          <span className="footer-sep">·</span>
          <a href="https://ido-epo-translator.komapc.workers.dev/">Tradukilo</a> 
          <span className="footer-sep">(<a href="https://github.com/komapc/ido-epo-translator" target="_blank" rel="noopener noreferrer">kodo</a>)</span>
          
          <span className="footer-sep">·</span>
          <a href="https://echodrift.pages.dev" style={{color: "#fff", borderBottom: "1px solid #4f46e5"}}>EchoDrift</a> 
          <span className="footer-sep">(<a href="https://github.com/komapc/phonomorph" target="_blank" rel="noopener noreferrer">kodo</a>)</span>
        </div>
        
        <div className="footer-line" style={{opacity: 0.8}}>
          <span>Rersursi: <a href="https://github.com/apertium" target="_blank" rel="noopener noreferrer">Apertium</a> (Apertium-based)</span>
          <span className="footer-sep">·</span>
          <span>Kontakto: <a href="mailto:komapc@gmail.com">komapc@gmail.com</a></span>
          <span className="footer-sep">·</span>
          <span>© 2026 Linguo-Ekosistemo</span>
          <span className="footer-tag">v1.0.0</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;