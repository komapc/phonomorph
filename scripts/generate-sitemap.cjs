const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://echodrift.pages.dev';
const INDEX_FILE = path.join(__dirname, '../public/data/index.json');
const SITEMAP_FILE = path.join(__dirname, '../public/sitemap.xml');

function generate() {
  console.log('--- Generating Sitemap ---');
  
  if (!fs.existsSync(INDEX_FILE)) {
    console.error('Index file not found. Run rebuild-index first.');
    return;
  }

  const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  const staticRoutes = ['', '/about', '/sources', '/glossary', '/directory', '/families'];
  const now = new Date().toISOString().split('T')[0];
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Add static routes
  staticRoutes.forEach(route => {
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}${route || '/'}</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';
  });

  // Add Language Hubs
  if (index.stats && index.stats.languages) {
    index.stats.languages.forEach(lang => {
      xml += '  <url>\n';
      xml += `    <loc>${BASE_URL}/language/${encodeURIComponent(lang)}</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    });
  }

  // Add Family Hubs
  if (index.stats && index.stats.families) {
    index.stats.families.forEach(fam => {
      xml += '  <url>\n';
      xml += `    <loc>${BASE_URL}/family/${encodeURIComponent(fam)}</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    });
  }

  // Add Process Hubs (extract from transformations)
  const processes = new Set();
  index.transformations.forEach(t => {
    if (t.tags) {
      t.tags.forEach(tag => {
        if (!index.stats.families.includes(tag)) {
          processes.add(tag);
        }
      });
    }
  });

  processes.forEach(proc => {
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}/process/${encodeURIComponent(proc)}</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>0.6</priority>\n';
    xml += '  </url>\n';
  });

  // Add transformation routes
  index.transformations.forEach(t => {
    const [from, to] = t.id.split('_to_');
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}/transform/${from}/${to}</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>0.6</priority>\n';
    xml += '  </url>\n';
  });

  xml += '</urlset>';

  fs.writeFileSync(SITEMAP_FILE, xml);
  console.log('✅ Sitemap generated.');
}

generate();
