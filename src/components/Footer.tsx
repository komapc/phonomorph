import React from "react";
import { Terminal, Book, Globe, Github, Shield } from "lucide-react";

// Sibling projects shown in the footer. To add/remove a link edit only this list.
const PROJECTS = [
  { name: "Vortaro", url: "https://vortaro.lipu.dev", code: "https://github.com/komapc/vortaro", Icon: Book },
  { name: "Tradukilo", url: "https://tradukilo.lipu.dev/", code: "https://github.com/komapc/ido-epo-translator", Icon: Globe },
  { name: "EchoDrift", url: "https://echodrift.lipu.dev", code: "https://github.com/komapc/phonomorph", Icon: Terminal },
  { name: "Hanzi-burst", url: "https://hanzi.lipu.dev/", code: "https://github.com/komapc/hanzi-burst", Icon: Globe },
  { name: "Ideonology", url: "https://ideon.lipu.dev/en/", code: "https://github.com/komapc/ideon", Icon: Book },
  { name: "min-co", url: "https://minco.lipu.dev/", code: "https://github.com/komapc/contlang", Icon: Terminal },
];

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
              {PROJECTS.map((p, i) => (
                <React.Fragment key={p.url}>
                  {i > 0 && <span className="footer-sep">·</span>}
                  <a href={p.url}><p.Icon size={14} /> {p.name}</a>
                  <a href={p.code} target="_blank" className="footer-code-link" rel="noopener noreferrer">(kodo)</a>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="footer-group">
            <span className="footer-label">Rersursi e Kontakto</span>
            <div className="footer-links">
              
              <a href="https://github.com/komapc" target="_blank" rel="noopener noreferrer"><Github size={14} /> GitHub</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom-info">
          <span className="footer-tag">v1.0.0</span>
          <span className="footer-sep">·</span>
          <span className="flex items-center gap-1"><Shield size={12} /> License: MIT</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;