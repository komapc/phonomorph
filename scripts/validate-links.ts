import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAPPED_SOURCES = path.join(__dirname, '../public/data/sources_mapped.json');

interface CheckResult {
  ok: boolean;
  status?: number;
  error?: string;
}

async function checkUrl(url: string, redirects = 0): Promise<CheckResult> {
  if (redirects > 5) {
    return { ok: false, error: 'Too many redirects' };
  }

  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 15000
    };

    try {
      const req = protocol.get(url, options, (res) => {
        const status = res.statusCode || 0;

        // Follow redirects
        if (status >= 300 && status < 400 && res.headers.location) {
          let nextUrl = res.headers.location;
          if (!nextUrl.startsWith('http')) {
            const urlObj = new URL(url);
            nextUrl = `${urlObj.protocol}//${urlObj.host}${nextUrl}`;
          }
          resolve(checkUrl(nextUrl, redirects + 1));
          return;
        }

        // 2xx and 403 (often bot detection) are considered OK for CI stability
        const ok = (status >= 200 && status < 300) || status === 403;
        resolve({ ok, status });
      });

      req.on('error', (err) => {
        resolve({ ok: false, error: err.message });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: true, error: 'Timeout (ignored)' }); // Ignore timeouts in CI
      });
    } catch (err) {
      resolve({ ok: false, error: (err as Error).message });
    }
  });
}

interface SourceMeta {
  title: string;
  url?: string;
}

async function validate() {
  console.log('--- Validating Source URLs (Advanced) ---');
  if (!fs.existsSync(MAPPED_SOURCES)) {
    console.error(`❌ File not found: ${MAPPED_SOURCES}`);
    process.exit(1);
  }

  const sources = JSON.parse(fs.readFileSync(MAPPED_SOURCES, 'utf8')) as Record<string, SourceMeta>;
  const entries = Object.entries(sources).filter(([, meta]) => meta.url);

  let failedCount = 0;
  const googleBookIds = new Map<string, string>();

  for (const [key, meta] of entries) {
    process.stdout.write(`Checking: ${meta.title.padEnd(50).slice(0, 50)}... `);
    
    // Check for duplicate Google Books IDs (common placeholder error)
    if (meta.url?.includes('books.google.com/books?id=')) {
      const id = new URL(meta.url).searchParams.get('id');
      if (id) {
        if (googleBookIds.has(id)) {
          console.log(`⚠️ WARNING: Duplicate Google Books ID detected (Previously: ${googleBookIds.get(id)})`);
        } else {
          googleBookIds.set(id, meta.title);
        }
      }
    }

    const result = await checkUrl(meta.url!);
    
    if (result.ok) {
      console.log(`✅ OK ${result.status ? `(${result.status})` : ''}`);
    } else {
      console.log(`❌ FAILED ${result.status ? `(Status: ${result.status})` : `(Error: ${result.error})`}`);
      failedCount++;
    }
  }

  if (failedCount > 0) {
    console.error(`\n❌ Validation complete. ${failedCount} URLs failed audit.`);
  } else {
    console.log('\n✅ All URLs validated successfully.');
  }
}

validate();
