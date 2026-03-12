import React from "react";
import { Terminal } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="suite-footer">
      <div className="max-w-5xl mx-auto px-4">
        {/* Brand Presence */}
        <div className="footer-brand">
          <Terminal size={22} /> Echo<span>Drift</span>
        </div>

        <div className="footer-line">
          <span className="opacity-50">Linguistikala Suite:</span>
          <a href="https://ido-vortaro.pages.dev">Vortaro</a> 
          <a href="https://github.com/komapc/vortaro" target="_blank" className="footer-code-link" rel="noopener noreferrer">(kodo)</a>
          
          <span className="footer-sep">·</span>
          <a href="https://ido-epo-translator.komapc.workers.dev/">Tradukilo</a> 
          <a href="https://github.com/komapc/ido-epo-translator" target="_blank" className="footer-code-link" rel="noopener noreferrer">(kodo)</a>
          
          <span className="footer-sep">·</span>
          <a href="https://echodrift.pages.dev" style={{color: "#fff", background: "rgba(255,255,255,0.05)"}}>EchoDrift</a> 
          <a href="https://github.com/komapc/phonomorph" target="_blank" className="footer-code-link" rel="noopener noreferrer">(kodo)</a>
        </div>
        
        <div className="footer-line">
          <span className="opacity-50">Resursi:</span>
          <a href="https://github.com/apertium" target="_blank" rel="noopener noreferrer">Apertium</a>
          <span className="footer-sep">·</span>
          <a href="mailto:komapc@gmail.com">Kontakto</a>
          <span className="footer-sep">·</span>
          <a href="https://github.com/komapc" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>

        <div className="footer-bottom-info">
          <div className="flex justify-center items-center gap-4">
            <span>© 2026 Linguo-Ekosistemo</span>
            <span className="footer-sep">|</span>
            <span className="footer-tag">v1.0.0</span>
            <span className="footer-sep">|</span>
            <span>License: MIT</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;