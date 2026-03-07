const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../public/data');
const INDEX_FILE = path.join(DATA_DIR, 'index.json');

/**
 * Bundles transformation metadata into index.json to avoid thousands of individual fetches.
 * This runs before dev and build.
 */
function rebuild() {
  console.log('--- Rebuilding PhonoMorph Index ---');

  try {
    // 1. Get Symbols from the symbols directory
    const symbolsDir = path.join(DATA_DIR, 'symbols');
    const symbols = fs.readdirSync(symbolsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
      .sort();

    // 2. Get Transformations with Metadata
    const transformationsDir = path.join(DATA_DIR, 'transformations');
    const transFiles = fs.readdirSync(transformationsDir)
      .filter(f => f.endsWith('.json'));

    const transformations = transFiles.map(file => {
      const content = JSON.parse(fs.readFileSync(path.join(transformationsDir, file), 'utf8'));
      return {
        id: file.replace('.json', ''),
        name: (content.phoneticEffects || '').split(',')[0].trim() || 'SHIFT',
        commonality: content.commonality || 1
      };
    }).sort((a, b) => a.id.localeCompare(b.id));

    // 3. Persist Unattested pairs (read from current index)
    let unattested = [];
    if (fs.existsSync(INDEX_FILE)) {
      const currentIndex = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
      unattested = currentIndex.unattested || [];
    }

    const newIndex = {
      symbols,
      transformations,
      unattested
    };

    fs.writeFileSync(INDEX_FILE, JSON.stringify(newIndex, null, 2));
    
    console.log(`✅ Success! Bundled ${symbols.length} symbols and ${transformations.length} transformations.`);
    console.log(`📍 File: ${INDEX_FILE}`);
  } catch (err) {
    console.error('❌ Failed to rebuild index:', err);
    process.exit(1);
  }
}

rebuild();
