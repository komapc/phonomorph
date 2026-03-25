// Cloudflare Pages _worker.js for EchoDrift
// Handles dynamic SEO injection for SPA routes

const escapeHtml = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Check if it's a dynamic route we want to SEO-ify
    const isTransform = url.pathname.startsWith('/transform/');
    const isLanguage = url.pathname.startsWith('/language/');
    const isFamily = url.pathname.startsWith('/family/');
    const isProcess = url.pathname.startsWith('/process/');
    const isAbout = url.pathname === '/about';
    const isGlossary = url.pathname === '/glossary';
    const isDirectory = url.pathname === '/directory';

    // Serve index.html for all these routes
    const indexRequest = new Request(new URL('/index.html', request.url), request);
    let response = await env.ASSETS.fetch(indexRequest);
    
    if (response.status === 200 && (isTransform || isLanguage || isFamily || isProcess || isAbout || isGlossary || isDirectory)) {
      let html = await response.text();
      let title = 'EchoDrift — Atlas of Phonetic Shifts';
      let description = 'Interactive atlas of phonetic transformations, sound changes, and allophones across 90+ language families.';
      let canonical = `https://echodrift.pages.dev${url.pathname}`;

      if (isTransform) {
        const parts = url.pathname.split('/');
        if (parts.length >= 4) {
          const from = decodeURIComponent(parts[2]);
          const to = decodeURIComponent(parts[3]);
          title = `[${from}] to [${to}] — Documented Sound Change | EchoDrift`;
          description = `Explore the documented phonetic transformation from [${from}] to [${to}]. View examples, conditions, and linguistic sources in the EchoDrift atlas.`;
        }
      } else if (isLanguage || isFamily || isProcess) {
        const parts = url.pathname.split('/');
        const name = decodeURIComponent(parts[parts.length - 1]);
        const type = isLanguage ? 'Language' : (isFamily ? 'Family' : 'Process');
        title = `${name} ${type} Sound Changes | EchoDrift Atlas`;
        description = `Comprehensive list of documented sound changes and phonetic transformations related to ${name}. Explore the phonetic history of ${name} in our interactive atlas.`;
      } else if (isAbout) {
        title = 'About | EchoDrift — Universal Atlas of Phonetic Evolution';
        description = 'The story behind EchoDrift: an attempt to prove that any speech sound can transform into any other. Learn about our data sources and methodology.';
      } else if (isGlossary) {
        title = 'Phonetic Glossary | EchoDrift';
        description = 'Definitions and explanations of phonetic processes like lenition, palatalization, debuccalization, and more used in the EchoDrift atlas.';
      } else if (isDirectory) {
        title = 'Full Transformation Directory | EchoDrift Atlas';
        description = 'A comprehensive directory of all 1600+ documented phonetic transformations, sound shifts, and allophonic relationships in EchoDrift.';
      }

      const metaTags = `
    <title>${title}</title>
    <meta name="description" content="${description}">
    <link rel="canonical" href="${canonical}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${url.href}">
    <meta property="twitter:title" content="${title}">
    <meta property="twitter:description" content="${description}">
      `;
      
      // Inject tags
      html = html.replace(/<title>.*?<\/title>/, '');
      html = html.replace('</head>', `${metaTags}
  </head>`);
      
      return new Response(html, {
        headers: {
          ...Object.fromEntries(response.headers),
          'Content-Type': 'text/html;charset=UTF-8'
        }
      });
    }

    return response;
  },
};