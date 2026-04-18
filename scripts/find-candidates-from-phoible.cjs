const fs = require('fs');
const https = require('https');
const path = require('path');

/**
 * find-candidates-from-phoible.cjs
 *
 * This script downloads the PHOIBLE dataset (CSV) and finds languages
 * that contain a specific pair of IPA symbols in their phoneme inventory.
 * This helps target research for specific missing transformations.
 *
 * Usage: node scripts/find-candidates-from-phoible.cjs ʌ y
 */

const PHOIBLE_URL = "https://raw.githubusercontent.com/phoible/dev/master/data/phoible.csv";
const CACHE_DIR = path.join(__dirname, '../.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'phoible.csv');

async function downloadPhoible() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  if (fs.existsSync(CACHE_FILE)) {
    const data = fs.readFileSync(CACHE_FILE, 'utf8');
    if (data.includes("429: Too Many Requests")) {
      console.log("Found corrupted cache (GitHub 429). Deleting and retrying...");
      fs.unlinkSync(CACHE_FILE);
    } else {
      console.log("Using cached PHOIBLE data...");
      return data;
    }
  }

  console.log("Downloading PHOIBLE data from GitHub (this might take a few seconds)...");
  return new Promise((resolve, reject) => {
    https.get(PHOIBLE_URL, (res) => {
      if (res.statusCode === 429) {
        reject(new Error("GitHub Rate Limited (429). Try again later or download manually to .cache/phoible.csv"));
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download: HTTP ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        fs.writeFileSync(CACHE_FILE, data);
        resolve(data);
      });
    }).on('error', (err) => reject(err));
  });
}

/**
 * A more robust CSV line parser that handles quoted fields
 */
function parseCsvLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur);
  return result;
}

function parseCsv(csv) {
  const lines = csv.split('\n');
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]);
  
  // Find column indices
  const phonemeIdx = headers.indexOf('Phoneme');
  const langNameIdx = headers.indexOf('LanguageName');
  const isoIdx = headers.indexOf('ISO6393');
  const familyIdx = headers.indexOf('Family');
  const invIdIdx = headers.indexOf('InventoryID');

  if (phonemeIdx === -1 || langNameIdx === -1) {
    throw new Error("Invalid PHOIBLE CSV format: Missing required headers");
  }

  const inventories = {};

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const row = parseCsvLine(lines[i]);
    const invId = row[invIdIdx];
    
    if (!inventories[invId]) {
      inventories[invId] = {
        name: row[langNameIdx],
        iso: row[isoIdx],
        family: row[familyIdx],
        phonemes: new Set()
      };
    }
    
    // PHOIBLE sometimes uses specific IPA variants, let's normalize slightly
    const phoneme = row[phonemeIdx].trim();
    inventories[invId].phonemes.add(phoneme);
  }

  return Object.values(inventories);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: npm run find-candidates -- <symbolA> <symbolB>");
    process.exit(1);
  }

  const [symbolA, symbolB] = args;
  try {
    const csv = await downloadPhoible();
    const languages = parseCsv(csv);

    console.log(`Searching for languages with both [${symbolA}] and [${symbolB}]...`);
    
    const matches = languages.filter(lang => 
      lang.phonemes.has(symbolA) && lang.phonemes.has(symbolB)
    );

    if (matches.length === 0) {
      console.log(`No languages found in PHOIBLE with both [${symbolA}] and [${symbolB}].`);
    } else {
      console.log(`\nFound ${matches.length} candidate languages:\n`);
      console.log(`ISO | Language | Family`);
      console.log(`----|----------|-------`);
      matches.slice(0, 50).forEach(m => {
        console.log(`${m.iso.padEnd(3)} | ${m.name.padEnd(20)} | ${m.family}`);
      });
      
      if (matches.length > 50) {
        console.log(`... and ${matches.length - 50} more.`);
      }
      
      console.log(`\nTotal matches: ${matches.length}`);
    }
  } catch (err) {
    console.error("Error:", err.message);
    if (err.message.includes("429")) {
      console.log("\nTIP: You can manually download the PHOIBLE CSV from:");
      console.log(PHOIBLE_URL);
      console.log("And save it as .cache/phoible.csv");
    }
  }
}

main().catch(err => {
  console.error("Critical Error:", err.message);
});
