import React from "react";
import { Terminal, Globe, Shield } from "lucide-react";
import { GithubIcon } from "./GithubIcon";

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
              <a href="https://lipu.dev/"><Globe size={14} /> lipu.dev</a>
              <span className="footer-sep">·</span>
              <a href="https://github.com/komapc/phonomorph" target="_blank" rel="noopener noreferrer"><GithubIcon size={14} /> kodo</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom-info">
          <span className="footer-tag">v1.0.0</span>
          <span className="footer-sep">·</span>
          <span className="flex items-center gap-1"><Shield size={12} /> Code: MIT · Data: <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a></span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;