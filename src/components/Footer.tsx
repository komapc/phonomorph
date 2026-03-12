import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="mt-16 pt-8 pb-12 border-t border-white/5 text-center text-sm text-gray-400">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 mb-3">
          <span className="opacity-60">My projects:</span>
          <a href="https://ido-vortaro.pages.dev" className="text-gray-300 font-semibold hover:text-white transition-colors">Vortaro</a> 
          <span className="text-xs opacity-40 -ml-2">(<a href="https://github.com/komapc/vortaro" target="_blank" rel="noopener noreferrer" className="hover:underline">code</a>)</span>
          
          <span className="opacity-20">·</span>
          <a href="https://ido-epo-translator.komapc.workers.dev/" className="text-gray-300 font-semibold hover:text-white transition-colors">Translator</a> 
          <span className="text-xs opacity-40 -ml-2">(<a href="https://github.com/komapc/ido-epo-translator" target="_blank" rel="noopener noreferrer" className="hover:underline">code</a>)</span>
          
          <span className="opacity-20">·</span>
          <a href="https://echodrift.pages.dev" className="text-white font-semibold hover:text-white transition-colors underline decoration-white/20 underline-offset-4">EchoDrift</a> 
          <span className="text-xs opacity-40 -ml-2">(<a href="https://github.com/komapc/a2a" target="_blank" rel="noopener noreferrer" className="hover:underline">code</a>)</span>
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 opacity-80">
          <span>Resources: <a href="https://github.com/komapc/a2a" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white hover:underline transition-colors">Source Code</a></span>
          <span className="opacity-20">·</span>
          <span>Contact: <a href="mailto:komapc@gmail.com" className="text-gray-300 hover:text-white font-semibold transition-colors">komapc@gmail.com</a></span>
          <span className="opacity-20">·</span>
          <span>License: MIT</span>
          <span className="ml-4 font-mono opacity-40 text-[10px]">v1.0.0</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;