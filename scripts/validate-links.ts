import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAPPED_SOURCES = path.join(__dirname, '../public/data/sources_mapped.json');

async function checkUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PhonoMorphBot/1.0)'
      }
    };
    https.get(url, options, (res) => {
      resolve(!!res.statusCode && res.statusCode >= 200 && res.statusCode < 400);
    }).on('error', () => {
      resolve(false);
    });
  });
}

async function validate() {
  console.log('--- Validating Source URLs (TS) ---');
  if (!fs.existsSync(MAPPED_SOURCES)) {
    console.error(`❌ File not found: ${MAPPED_SOURCES}`);
    process.exit(1);
  }

  const sources = JSON.parse(fs.readFileSync(MAPPED_SOURCES, 'utf8'));
  const entries = Object.entries(sources).filter(([_, meta]: [any, any]) => meta.url);

  let failedCount = 0;

  for (const [_, meta] of entries as [string, any][]) {
    process.stdout.write(`Checking: ${meta.title}... `);
    const ok = await checkUrl(meta.url);
    if (ok) {
      console.log('✅ OK');
    } else {
      console.log('❌ FAILED');
      failedCount++;
    }
  }

  if (failedCount > 0) {
    console.error(`\n❌ Validation complete. ${failedCount} URLs failed.`);
    // We don't exit with 1 here to avoid breaking CI on transient network issues,
    // but in a strict CI we might want to.
  } else {
    console.log('\n✅ All URLs validated successfully.');
  }
}

validate();
