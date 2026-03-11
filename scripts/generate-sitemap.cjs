const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://komapc.github.io/phonomorph'; // Adjust if custom domain used
const INDEX_FILE = path.join(__dirname, '../public/data/index.json');
const SITEMAP_FILE = path.join(__dirname, '../public/sitemap.xml');

function generate() {
  console.log('--- Generating Sitemap ---');
  
  if (!fs.existsSync(INDEX_FILE)) {
    console.error('Index file not found. Run rebuild-index first.');
    return;
  }

  const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  const staticRoutes = ['', '/about', '/sources'];
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Add static routes
  staticRoutes.forEach(route => {
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}/#${route}</loc>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';
  });

  // Add transformation routes
  index.transformations.forEach(t => {
    const [from, to] = t.id.split('_to_');
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}/#/transform/${from}/${to}</loc>\n`;
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>0.6</priority>\n';
    xml += '  </url>\n';
  });

  xml += '</urlset>';

  fs.writeFileSync(SITEMAP_FILE, xml);
  console.log(`✅ Sitemap generated at ${SITEMAP_FILE} with ${index.transformations.length + staticRoutes.length} URLs.`);
}

generate();
