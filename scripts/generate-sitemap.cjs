const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_URL = 'https://echodrift.pages.dev';
const REPO_ROOT = path.join(__dirname, '..');
const INDEX_FILE = path.join(REPO_ROOT, 'public/data/index.json');
const SITEMAP_FILE = path.join(REPO_ROOT, 'public/sitemap.xml');

const STATIC_ROUTES = [
  { route: '', file: 'src/pages/Home.tsx' },
  { route: '/about', file: 'src/pages/About.tsx' },
  { route: '/sources', file: 'src/pages/Sources.tsx' },
  { route: '/glossary', file: 'src/pages/Glossary.tsx' },
  { route: '/directory', file: 'src/pages/Directory.tsx' },
  { route: '/families', file: 'src/pages/Families.tsx' },
];

// Maps each tracked file under the given paths to the date (YYYY-MM-DD) of its
// most recent commit, so <lastmod> reflects real content changes instead of
// the build date (Google discounts sitemaps whose lastmod never varies).
function buildLastCommitDateMap(paths) {
  let log;
  try {
    log = execSync(
      `git log --pretty=format:"@@%aI" --name-only -- ${paths.map(p => `"${p}"`).join(' ')}`,
      { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 }
    );
  } catch (err) {
    console.warn('git log failed, falling back to build date for lastmod:', err.message);
    return new Map();
  }

  const map = new Map();
  let currentDate = null;
  for (const line of log.split('\n')) {
    if (line.startsWith('@@')) {
      currentDate = line.slice(2, 12); // YYYY-MM-DD
    } else if (line.trim() && currentDate && !map.has(line)) {
      // git log is newest-first, so the first commit touching a file is its most recent.
      map.set(line, currentDate);
    }
  }
  return map;
}

function urlEntry(loc, lastmod, changefreq, priority) {
  return (
    '  <url>' + '\n' +
    '    <loc>' + loc + '</loc>' + '\n' +
    '    <lastmod>' + lastmod + '</lastmod>' + '\n' +
    '    <changefreq>' + changefreq + '</changefreq>' + '\n' +
    '    <priority>' + priority + '</priority>' + '\n' +
    '  </url>' + '\n'
  );
}

function generate() {
  console.log('--- Generating Sitemap ---');

  if (!fs.existsSync(INDEX_FILE)) {
    console.error('Index file not found. Run rebuild-index first.');
    return;
  }

  const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  const buildDate = new Date().toISOString().split('T')[0];
  const commitDates = buildLastCommitDateMap([
    'public/data/transformations',
    ...STATIC_ROUTES.map(r => r.file),
  ]);
  const dateForFile = (file) => commitDates.get(file) || buildDate;
  const dateForTransformation = (id) => dateForFile(`public/data/transformations/${id}.json`);
  const maxDate = (dates) => dates.reduce((max, d) => (d > max ? d : max), dates[0] || buildDate);

  let xml = '<?xml version="1.0" encoding="UTF-8"?>' + '\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + '\n';

  // Add static routes
  STATIC_ROUTES.forEach(({ route, file }) => {
    xml += urlEntry(BASE_URL + (route || '/'), dateForFile(file), 'weekly', '0.8');
  });

  // Load Transformations from Shards
  const transformations = [];
  if (index.shards && index.shards.transformations) {
    index.shards.transformations.forEach(shardFile => {
      const shardPath = path.join(REPO_ROOT, 'public/data/shards', shardFile);
      if (fs.existsSync(shardPath)) {
        const shardData = JSON.parse(fs.readFileSync(shardPath, 'utf8'));
        transformations.push(...shardData);
      }
    });
  }

  // Add Language Hubs (lastmod = most recent commit among the transformations shown on that hub)
  if (index.stats && index.stats.languages) {
    index.stats.languages.forEach(lang => {
      const dates = transformations
        .filter(t => t.languages && t.languages.includes(lang))
        .map(t => dateForTransformation(t.id));
      xml += urlEntry(BASE_URL + '/language/' + encodeURIComponent(lang), maxDate(dates), 'monthly', '0.7');
    });
  }

  // Add Family Hubs. Families live on each transformation's languageExamples,
  // not in the shard's lightweight `tags` (mirrors rebuild-index.ts's derivation),
  // so read the full transformation file to find which ones mention each family.
  const familyDates = new Map();
  transformations.forEach(t => {
    const filePath = path.join(REPO_ROOT, 'public/data/transformations', `${t.id}.json`);
    if (!fs.existsSync(filePath)) return;
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const date = dateForTransformation(t.id);
    (content.languageExamples || []).forEach(le => {
      if (le.languageFamily) {
        const arr = familyDates.get(le.languageFamily) || [];
        arr.push(date);
        familyDates.set(le.languageFamily, arr);
      }
    });
  });

  if (index.stats && index.stats.families) {
    index.stats.families.forEach(fam => {
      xml += urlEntry(BASE_URL + '/family/' + encodeURIComponent(fam), maxDate(familyDates.get(fam) || []), 'monthly', '0.7');
    });
  }

  // Add Process Hubs
  const processes = new Set();
  transformations.forEach(t => {
    if (t.tags) {
      t.tags.forEach(tag => {
        if (!index.stats.families.includes(tag)) {
          processes.add(tag);
        }
      });
    }
  });

  processes.forEach(proc => {
    const dates = transformations
      .filter(t => t.tags && t.tags.includes(proc))
      .map(t => dateForTransformation(t.id));
    xml += urlEntry(BASE_URL + '/process/' + encodeURIComponent(proc), maxDate(dates), 'monthly', '0.6');
  });

  // Add transformation routes
  transformations.forEach(t => {
    const [from, to] = t.id.split('_to_');
    xml += urlEntry(BASE_URL + '/transform/' + from + '/' + to, dateForTransformation(t.id), 'monthly', '0.6');
  });

  xml += '</urlset>';

  fs.writeFileSync(SITEMAP_FILE, xml);
  console.log('✅ Sitemap generated.');
}

generate();
