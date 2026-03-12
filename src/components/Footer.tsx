import React from "react";
import { Terminal, Book, Globe, Github, Mail, Shield } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="suite-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <Terminal size={24} className="text-indigo-500" /> 
          Echo<span>Drift</span>
        </div>

        <div className="footer-nav">
          <div className="footer-group">
            <span className="footer-label">Mea projekti</span>
            <div className="footer-links">
              <a href="https://ido-vortaro.pages.dev"><Book size={14} /> Vortaro</a>
              <a href="https://github.com/komapc/vortaro" target="_blank" className="footer-code-link" rel="noopener noreferrer">(kodo)</a>
              
              <span className="footer-sep">·</span>
              <a href="https://ido-tradukilo.pages.dev/"><Globe size={14} /> Tradukilo</a>
              <a href="https://github.com/komapc/ido-epo-translator" target="_blank" className="footer-code-link" rel="noopener noreferrer">(kodo)</a>
              
              <span className="footer-sep">·</span>
              <a href="https://echodrift.pages.dev" style={{color: "#fff"}}><Terminal size={14} /> EchoDrift</a>
              <a href="https://github.com/komapc/phonomorph" target="_blank" className="footer-code-link" rel="noopener noreferrer">(kodo)</a>
            </div>
          </div>

          <div className="footer-group">
            <span className="footer-label">Rersursi e Kontakto</span>
            <div className="footer-links">
              
              <a href="mailto:komapc@gmail.com"><Mail size={14} /> komapc@gmail.com</a>
              <span className="footer-sep">·</span>
              <a href="https://github.com/komapc" target="_blank" rel="noopener noreferrer"><Github size={14} /> GitHub</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom-info">
          <span>© 2026 Linguo-Ekosistemo</span>
          <span className="footer-sep">·</span>
          <span className="footer-tag">v1.0.0</span>
          <span className="footer-sep">·</span>
          <span className="flex items-center gap-1"><Shield size={12} /> License: MIT</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;