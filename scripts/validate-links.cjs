const fs = require('fs');
const path = require('path');
const https = require('https');

const MAPPED_SOURCES = path.join(__dirname, '../public/data/sources_mapped.json');

async function checkUrl(url) {
  return new Promise((resolve) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PhonoMorphBot/1.0)'
      }
    };
    https.get(url, options, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    }).on('error', () => {
      resolve(false);
    });
  });
}

async function validate() {
  console.log('--- Validating Source URLs ---');
  const sources = JSON.parse(fs.readFileSync(MAPPED_SOURCES, 'utf8'));
  const entries = Object.entries(sources).filter(([_, meta]) => meta.url);

  for (const [key, meta] of entries) {
    process.stdout.write(`Checking: ${meta.title}... `);
    const ok = await checkUrl(meta.url);
    if (ok) {
      console.log('✅ OK');
    } else {
      console.log('❌ FAILED');
    }
  }
}

validate();
