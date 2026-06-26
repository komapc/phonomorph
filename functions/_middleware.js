// Cloudflare Pages middleware. Runs on every request.
//
//   1. SPA fallback: client-side routes (no file extension) that don't match a
//      static asset are served index.html.
//   2. Crawler-aware meta injection: social/search crawlers don't run JS, so
//      react-helmet-async never executes for them and every shared link would
//      otherwise preview as the generic homepage. For known crawler UAs (or the
//      ?_og=1 debug flag) we rewrite the <head> of index.html with route-specific
//      Open Graph / Twitter / title tags built from the static JSON data. The
//      per-pair og:image points at the /og/:from/:to.png rendering function.

const SITE_ORIGIN = 'https://echodrift.pages.dev';
const SITE_NAME = 'EchoDrift';
const DEFAULT_IMAGE = `${SITE_ORIGIN}/og-preview.png`;

const CRAWLER_UA =
  /(facebookexternalhit|facebot|twitterbot|slackbot|slack-imgproxy|discordbot|whatsapp|linkedinbot|telegrambot|pinterest|redditbot|embedly|quora link preview|skypeuripreview|nuzzel|bitlybot|vkshare|w3c_validator|google-inspectiontool|googlebot|bingbot|applebot|yandex|baiduspider|duckduckbot|petalbot|ia_archiver|mastodon|bluesky)/i;

function isCrawler(request, url) {
  if (url.searchParams.has('_og')) return true;
  const ua = request.headers.get('user-agent') || '';
  return CRAWLER_UA.test(ua);
}

function clamp(text, max) {
  if (!text) return '';
  const t = String(text).replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t;
}

function decodeSlug(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

async function fetchJSON(env, request, path) {
  try {
    const res = await env.ASSETS.fetch(new Request(new URL(path, request.url)));
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function buildMeta(env, request, url) {
  const segments = url.pathname.split('/').filter(Boolean);
  const canonical = SITE_ORIGIN + url.pathname;

  // /transform/:fromId/:toId
  if (segments[0] === 'transform' && segments.length === 3) {
    const fromId = segments[1];
    const toId = segments[2];
    const [trans, fromSym, toSym] = await Promise.all([
      fetchJSON(env, request, `/data/transformations/${fromId}_to_${toId}.json`),
      fetchJSON(env, request, `/data/symbols/${fromId}.json`),
      fetchJSON(env, request, `/data/symbols/${toId}.json`),
    ]);

    const fromSymbol = fromSym?.symbol || fromId;
    const toSymbol = toSym?.symbol || toId;
    const pair = `[${fromSymbol}] → [${toSymbol}]`;
    const image = `${SITE_ORIGIN}/og/${encodeURIComponent(fromId)}/${encodeURIComponent(toId)}.png`;

    if (trans) {
      const effect = (trans.phoneticEffects || '').split(',')[0].trim();
      const names =
        fromSym?.name && toSym?.name ? ` (${fromSym.name} to ${toSym.name})` : '';
      return {
        title: `${pair}${effect ? ' — ' + effect : ''} | ${SITE_NAME} Atlas`,
        description: clamp(
          `Documented phonetic shift ${pair}${names}. ${trans.preamble || ''}`,
          200
        ),
        ogType: 'article',
        canonical,
        image,
        imageAlt: `Phonetic shift ${pair}`,
        body: renderTransformBody(pair, trans, fromSym, toSym),
      };
    }

    if (fromSym || toSym) {
      const description = clamp(
        `The phonetic transformation ${pair} on EchoDrift — an atlas of sound changes and allophones across 200+ language families.`,
        200
      );
      return {
        title: `${pair} — phonetic shift | ${SITE_NAME} Atlas`,
        description,
        ogType: 'article',
        canonical,
        image,
        imageAlt: `Phonetic shift ${pair}`,
        body: `<main><h1>${escapeText(pair)}</h1><p>${escapeText(description)}</p></main>`,
      };
    }
    return null;
  }

  // /compare/:shiftA/:shiftB
  if (segments[0] === 'compare' && segments.length === 3) {
    const a = decodeSlug(segments[1]);
    const b = decodeSlug(segments[2]);
    const description = clamp(
      `Side-by-side comparison of the phonetic shifts ${a} and ${b} — commonality, certainty, language examples and sources on EchoDrift.`,
      200
    );
    return {
      title: `${a} vs ${b} | ${SITE_NAME} Compare`,
      description,
      ogType: 'website',
      canonical,
      image: DEFAULT_IMAGE,
      body: `<main><h1>${escapeText(`${a} vs ${b}`)}</h1><p>${escapeText(description)}</p></main>`,
    };
  }

  // /family/:slug, /language/:slug, /process/:slug
  const hub = { family: true, language: true, process: true };
  if (hub[segments[0]] && segments.length === 2) {
    const name = decodeSlug(segments[1]);
    const description = clamp(
      `Documented phonetic shifts and sound changes for ${name} — explore transformations, examples and sources on the EchoDrift atlas.`,
      200
    );
    return {
      title: `${name} Sound Changes | ${SITE_NAME} Atlas`,
      description,
      ogType: 'website',
      canonical,
      image: DEFAULT_IMAGE,
      body: `<main><h1>${escapeText(`${name} Sound Changes`)}</h1><p>${escapeText(description)}</p></main>`,
    };
  }

  return null;
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Escape for element text content (quotes are safe here).
function escapeText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Build a crawler-only HTML article from the transformation JSON. The SPA
// replaces #root on mount, so real browsers never see this; it exists purely
// to give search crawlers unique, render-independent content per URL.
function renderTransformBody(pair, trans, fromSym, toSym) {
  const effect = escapeText(trans.phoneticEffects || '');
  const fromName = fromSym?.name
    ? `${escapeText(fromSym.symbol || '')} — ${escapeText(fromSym.name)}`
    : '';
  const toName = toSym?.name
    ? `${escapeText(toSym.symbol || '')} — ${escapeText(toSym.name)}`
    : '';
  const examples = (trans.languageExamples || [])
    .map((le) => {
      const head =
        escapeText(le.language || '') +
        (le.languageFamily ? ` (${escapeText(le.languageFamily)})` : '');
      const items = (le.examples || [])
        .map((ex) => {
          const ft = [ex.from, ex.to].filter(Boolean).map(escapeText).join(' → ');
          const note = ex.note ? `: ${escapeText(ex.note)}` : '';
          return `<li>${ft}${note}</li>`;
        })
        .join('');
      return `<section><h3>${head}</h3><ul>${items}</ul></section>`;
    })
    .join('');
  const sources = (trans.sources || [])
    .map((s) => `<li>${escapeText(s)}</li>`)
    .join('');
  return (
    '<main>' +
    `<h1>${escapeText(pair)}</h1>` +
    (effect ? `<p><strong>Phonetic effects:</strong> ${effect}</p>` : '') +
    (fromName || toName
      ? `<p>${fromName}${fromName && toName ? ' → ' : ''}${toName}</p>`
      : '') +
    (trans.preamble ? `<p>${escapeText(trans.preamble)}</p>` : '') +
    (examples ? `<h2>Language examples</h2>${examples}` : '') +
    (sources ? `<h2>Sources</h2><ul>${sources}</ul>` : '') +
    (trans.certainty && trans.commonality
      ? `<p>Certainty ${trans.certainty}/5 · Commonality ${trans.commonality}/5</p>`
      : '') +
    '</main>'
  );
}

function injectBody(html, body) {
  if (!body) return html;
  return html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Replace the `content` of a <meta> tag identified by `<attr>="<key>"`.
function setMeta(html, attr, key, value) {
  if (value == null) return html;
  const re = new RegExp(
    `(<meta\\s+${attr}="${escapeRe(key)}"\\s+content=")[^"]*(")`,
    'i'
  );
  return html.replace(re, (_m, pre, post) => pre + escapeAttr(value) + post);
}

function injectMeta(html, meta) {
  html = html.replace(
    /<title>[\s\S]*?<\/title>/i,
    () => `<title>${escapeAttr(meta.title)}</title>`
  );
  html = setMeta(html, 'name', 'title', meta.title);
  html = setMeta(html, 'name', 'description', meta.description);
  html = setMeta(html, 'property', 'og:type', meta.ogType);
  html = setMeta(html, 'property', 'og:title', meta.title);
  html = setMeta(html, 'property', 'og:description', meta.description);
  html = setMeta(html, 'property', 'og:url', meta.canonical);
  html = setMeta(html, 'property', 'og:image', meta.image);
  html = setMeta(html, 'property', 'og:image:alt', meta.imageAlt);
  html = setMeta(html, 'name', 'twitter:title', meta.title);
  html = setMeta(html, 'name', 'twitter:description', meta.description);
  html = setMeta(html, 'name', 'twitter:url', meta.canonical);
  html = setMeta(html, 'name', 'twitter:image', meta.image);
  html = setMeta(html, 'name', 'twitter:image:alt', meta.imageAlt);
  if (meta.canonical) {
    html = html.replace(
      /(<link\s+rel="canonical"\s+href=")[^"]*(")/i,
      (_m, pre, post) => pre + escapeAttr(meta.canonical) + post
    );
  }
  return html;
}

function serveIndex(env, request) {
  // Fetch the site root: the Pages asset server 308-redirects /index.html → /,
  // so requesting /index.html yields an empty redirect body.
  return env.ASSETS.fetch(new Request(new URL('/', request.url)));
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const isRoute = !url.pathname.includes('.');

  // Crawler hitting a client-side route: inject route-specific meta.
  if (isRoute && isCrawler(request, url)) {
    try {
      const meta = await buildMeta(env, request, url);
      if (meta) {
        const indexRes = await serveIndex(env, request);
        let html = injectMeta(await indexRes.text(), meta);
        html = injectBody(html, meta.body);
        return new Response(html, {
          status: 200,
          headers: {
            'content-type': 'text/html; charset=utf-8',
            'cache-control': 'public, max-age=3600',
          },
        });
      }
    } catch (_) {
      // fall through to normal handling
    }
  }

  // Normal pipeline (static asset or matched function).
  const response = await next();
  if (response.status === 404 && isRoute) {
    return serveIndex(env, request);
  }
  return response;
}
