import React from "react";
import { Book, Globe, Github, Mail, Info, Terminal } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="mt-24 pt-16 pb-12 border-t border-white/10 bg-[#0a0a0a] text-sm text-gray-400">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 text-center md:text-left">
          <div className="col-span-1 md:col-span-1">
            <div className="text-white font-bold text-lg mb-4 flex items-center justify-center md:justify-start gap-2">
              <Terminal size={20} className="text-blue-400" /> EchoDrift
            </div>
            <p className="text-xs leading-relaxed opacity-70">
              The Universal Atlas of Phonetic Evolution. Documenting systematic sound shifts across human history.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-[10px] opacity-50">Linguistic Suite</h4>
            <ul className="space-y-3">
              <li>
                <a href="https://ido-vortaro.pages.dev" className="hover:text-white transition-colors flex items-center justify-center md:justify-start gap-2">
                  <Book size={14} className="opacity-50" /> Ido-Esperanto Dictionary
                </a>
              </li>
              <li>
                <a href="https://ido-epo-translator.komapc.workers.dev/" className="hover:text-white transition-colors flex items-center justify-center md:justify-start gap-2">
                  <Globe size={14} className="opacity-50" /> Machine Translator
                </a>
              </li>
              <li>
                <a href="https://echodrift.pages.dev" className="text-white font-medium flex items-center justify-center md:justify-start gap-2">
                  <Terminal size={14} className="text-blue-400" /> EchoDrift Atlas
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-[10px] opacity-50">Open Source</h4>
            <ul className="space-y-3">
              <li>
                <a href="https://github.com/komapc/phonomorph" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center justify-center md:justify-start gap-2">
                  <Github size={14} className="opacity-50" /> Atlas Repository
                </a>
              </li>
              <li>
                <a href="https://github.com/apertium" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center justify-center md:justify-start gap-2">
                  <Globe size={14} className="opacity-50" /> Apertium Project
                </a>
              </li>
              <li>
                <a href="https://github.com/komapc" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center justify-center md:justify-start gap-2">
                  <Github size={14} className="opacity-50" /> Developer Profile
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-[10px] opacity-50">Connect</h4>
            <ul className="space-y-3">
              <li>
                <a href="mailto:komapc@gmail.com" className="hover:text-white transition-colors flex items-center justify-center md:justify-start gap-2">
                  <Mail size={14} className="opacity-50" /> komapc@gmail.com
                </a>
              </li>
              <li>
                <div className="flex items-center justify-center md:justify-start gap-2 opacity-70">
                  <Info size={14} /> License: MIT
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] uppercase tracking-widest opacity-40">
          <div>© 2026 EchoDrift / Linguistic Ecosystem</div>
          <div className="flex items-center gap-4">
            <span>Built with React 19</span>
            <span className="bg-white/10 px-2 py-0.5 rounded font-mono">v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;