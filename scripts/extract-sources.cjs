const fs = require('fs');
const path = require('path');

const TRANS_DIR = path.join(__dirname, '../public/data/transformations');
const OUTPUT_FILE = path.join(__dirname, '../public/data/sources.json');

function extract() {
  console.log('--- Extracting PhonoMorph Sources ---');
  const sources = new Set();
  const files = fs.readdirSync(TRANS_DIR).filter(f => f.endsWith('.json'));

  files.forEach(file => {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(TRANS_DIR, file), 'utf8'));
      if (content.sources && Array.isArray(content.sources)) {
        content.sources.forEach(s => sources.add(s.trim()));
      }
    } catch (e) {
      console.error(`Error reading ${file}:`, e.message);
    }
  });

  const sortedSources = Array.from(sources).sort();
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(sortedSources, null, 2));
  console.log(`✅ Extracted ${sortedSources.length} unique sources to ${OUTPUT_FILE}`);
}

extract();
