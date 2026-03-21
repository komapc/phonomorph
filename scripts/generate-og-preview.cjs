const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a14"/>
      <stop offset="100%" style="stop-color:#0f0f2a"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#4f46e5"/>
      <stop offset="100%" style="stop-color:#7c3aed"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="softglow">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Subtle grid dots -->
  <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
    <circle cx="20" cy="20" r="1" fill="#4f46e5" opacity="0.15"/>
  </pattern>
  <rect width="1200" height="630" fill="url(#dots)"/>

  <!-- Left accent bar -->
  <rect x="0" y="0" width="6" height="630" fill="url(#accentGrad)"/>

  <!-- Top-right decorative IPA symbols (background) -->
  <text x="820" y="180" font-family="DejaVu Sans" font-size="120" fill="#4f46e5" opacity="0.07" font-weight="bold">[aɪ̯oʊ̯]</text>
  <text x="850" y="310" font-family="DejaVu Sans" font-size="80" fill="#7c3aed" opacity="0.07" font-weight="bold">θ→ð→ʒ</text>
  <text x="870" y="420" font-family="DejaVu Sans" font-size="90" fill="#4f46e5" opacity="0.06" font-weight="bold">[ŋ̊ʔɬ]</text>

  <!-- Mini matrix grid (decorative, top-right corner) -->
  <g transform="translate(900, 60)" opacity="0.25">
    <!-- Grid cells -->
    ${Array.from({length: 5}, (_, row) =>
      Array.from({length: 5}, (_, col) => {
        const filled = Math.random() > 0.25;
        const isAllophone = filled && Math.random() > 0.85;
        const intensity = filled ? (0.3 + Math.random() * 0.5) : 0.05;
        return `<rect x="${col*44}" y="${row*44}" width="40" height="40" rx="4"
          fill="${filled ? '#4f46e5' : '#1e1e3a'}" opacity="${intensity}"
          stroke="#4f46e5" stroke-width="0.5" stroke-opacity="0.3"/>`;
      }).join('')
    ).join('')}
    <!-- Diagonal -->
    <rect x="0" y="0" width="40" height="40" rx="4" fill="#facc15" opacity="0.3"/>
    <rect x="44" y="44" width="40" height="40" rx="4" fill="#facc15" opacity="0.3"/>
    <rect x="88" y="88" width="40" height="40" rx="4" fill="#facc15" opacity="0.3"/>
    <rect x="132" y="132" width="40" height="40" rx="4" fill="#facc15" opacity="0.3"/>
    <rect x="176" y="176" width="40" height="40" rx="4" fill="#facc15" opacity="0.3"/>
  </g>

  <!-- Main content area -->

  <!-- Tag line above title -->
  <text x="80" y="180" font-family="DejaVu Sans" font-size="18" fill="#4f46e5" font-weight="bold" letter-spacing="4">UNIVERSAL ATLAS OF PHONETIC EVOLUTION</text>

  <!-- Main title -->
  <text x="80" y="270" font-family="DejaVu Sans" font-size="96" fill="white" font-weight="bold" filter="url(#softglow)">EchoDrift</text>

  <!-- Accent underline -->
  <rect x="80" y="285" width="480" height="4" rx="2" fill="url(#accentGrad)"/>

  <!-- Description -->
  <text x="80" y="350" font-family="DejaVu Sans" font-size="24" fill="#a0a0c0">An interactive IPA matrix of phonetic shifts, sound drifts,</text>
  <text x="80" y="382" font-family="DejaVu Sans" font-size="24" fill="#a0a0c0">and allophones across 90+ language families.</text>

  <!-- Stats row -->
  <g transform="translate(80, 440)">
    <!-- Stat 1 -->
    <rect width="180" height="70" rx="8" fill="#1a1a2e" stroke="#4f46e5" stroke-width="1" stroke-opacity="0.5"/>
    <text x="90" y="28" font-family="DejaVu Sans" font-size="28" fill="white" font-weight="bold" text-anchor="middle">1600+</text>
    <text x="90" y="52" font-family="DejaVu Sans" font-size="13" fill="#7878a0" text-anchor="middle">Transformations</text>

    <!-- Stat 2 -->
    <rect x="200" width="160" height="70" rx="8" fill="#1a1a2e" stroke="#4f46e5" stroke-width="1" stroke-opacity="0.5"/>
    <text x="280" y="28" font-family="DejaVu Sans" font-size="28" fill="white" font-weight="bold" text-anchor="middle">90+</text>
    <text x="280" y="52" font-family="DejaVu Sans" font-size="13" fill="#7878a0" text-anchor="middle">Language Families</text>

    <!-- Stat 3 -->
    <rect x="380" width="190" height="70" rx="8" fill="#1a1a2e" stroke="#4f46e5" stroke-width="1" stroke-opacity="0.5"/>
    <text x="475" y="28" font-family="DejaVu Sans" font-size="28" fill="white" font-weight="bold" text-anchor="middle">2600+</text>
    <text x="475" y="52" font-family="DejaVu Sans" font-size="13" fill="#7878a0" text-anchor="middle">Language Examples</text>
  </g>

  <!-- Example shifts row -->
  <g transform="translate(80, 536)">
    <text font-family="DejaVu Sans" font-size="15" fill="#4f46e5" font-weight="bold">p→f</text>
    <text x="70" font-family="DejaVu Sans" font-size="15" fill="#555588">·</text>
    <text x="85" font-family="DejaVu Sans" font-size="15" fill="#4f46e5" font-weight="bold">t→θ</text>
    <text x="148" font-family="DejaVu Sans" font-size="15" fill="#555588">·</text>
    <text x="163" font-family="DejaVu Sans" font-size="15" fill="#4f46e5" font-weight="bold">k→x</text>
    <text x="226" font-family="DejaVu Sans" font-size="15" fill="#555588">·</text>
    <text x="241" font-family="DejaVu Sans" font-size="15" fill="#4f46e5" font-weight="bold">a→æ</text>
    <text x="310" font-family="DejaVu Sans" font-size="15" fill="#555588">·</text>
    <text x="325" font-family="DejaVu Sans" font-size="15" fill="#4f46e5" font-weight="bold">u→y</text>
    <text x="390" font-family="DejaVu Sans" font-size="15" fill="#555588">·</text>
    <text x="405" font-family="DejaVu Sans" font-size="15" fill="#4f46e5" font-weight="bold">s→ʃ</text>
    <text x="465" font-family="DejaVu Sans" font-size="15" fill="#555588">·</text>
    <text x="480" font-family="DejaVu Sans" font-size="15" fill="#4f46e5" font-weight="bold">n→ŋ</text>
  </g>

  <!-- URL -->
  <text x="1120" y="600" font-family="DejaVu Sans" font-size="16" fill="#555588" text-anchor="end">echodrift.pages.dev</text>
</svg>`;

const svgPath = path.join(__dirname, '../public/og-preview.svg');
const pngPath = path.join(__dirname, '../public/og-preview.png');

fs.writeFileSync(svgPath, svg);
console.log('SVG written, converting to PNG...');

try {
  execSync(`convert -background none -size 1200x630 "${svgPath}" "${pngPath}"`, { stdio: 'inherit' });
  console.log('PNG created successfully:', pngPath);
  // Clean up SVG
  fs.unlinkSync(svgPath);
} catch (e) {
  console.error('Convert failed:', e.message);
  process.exit(1);
}
