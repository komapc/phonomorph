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

// Lightweight transformation catalogue (id, name, commonality, languages, tags)
// from the shards in index.json. Cached per isolate so repeated crawler hits
// don't re-read ~600KB of JSON each time.
let catalogPromise = null;
function loadCatalog(env, request) {
  if (!catalogPromise) {
    catalogPromise = (async () => {
      const index = await fetchJSON(env, request, '/data/index.json');
      const shardFiles = index?.shards?.transformations || [];
      const shards = await Promise.all(
        shardFiles.map((f) => fetchJSON(env, request, `/data/shards/${f}`))
      );
      const transformations = shards.flat().filter(Boolean);
      const symbols = new Map((index?.symbols || []).map((s) => [s.id, s]));
      return {
        transformations,
        byId: new Map(transformations.map((t) => [t.id, t])),
        symbols,
        families: index?.stats?.families || [],
        languages: index?.stats?.languages || [],
      };
    })().catch(() => {
      catalogPromise = null;
      return { transformations: [], byId: new Map(), symbols: new Map(), families: [], languages: [] };
    });
  }
  return catalogPromise;
}

function pairLabel(catalog, id) {
  const [from, to] = id.split('_to_');
  const f = catalog.symbols.get(from)?.symbol || from;
  const t = catalog.symbols.get(to)?.symbol || to;
  return `[${f}] → [${t}]`;
}

function transformHref(id) {
  const [from, to] = id.split('_to_');
  return `/transform/${encodeURIComponent(from)}/${encodeURIComponent(to)}`;
}

function link(href, text) {
  return `<a href="${escapeAttr(href)}">${escapeText(text)}</a>`;
}

function transformList(catalog, items) {
  return (
    '<ul>' +
    items
      .map((t) => `<li>${link(transformHref(t.id), `${pairLabel(catalog, t.id)} — ${t.name || ''}`)}</li>`)
      .join('') +
    '</ul>'
  );
}

const SITE_NAV =
  '<nav>' +
  [
    ['/', 'IPA matrix'],
    ['/directory', 'All transformations'],
    ['/families', 'Language families'],
    ['/glossary', 'Glossary'],
    ['/sources', 'Sources'],
    ['/about', 'About'],
  ]
    .map(([h, t]) => link(h, t))
    .join(' · ') +
  '</nav>';

function breadcrumbLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: SITE_ORIGIN + path,
    })),
  };
}

// Static routes with no dynamic data: give crawlers the same title/description
// the client sets via react-helmet, instead of falling back to the homepage.
const STATIC_PAGES = {
  about: {
    title: 'About | EchoDrift — Universal Atlas of Phonetic Evolution',
    description:
      "Why this exists, the hypothesis behind the matrix, and the search for the missing [ʌ]↔[y] shift.",
  },
  sources: {
    title: 'Bibliography | EchoDrift — Phonetic Transformation Sources',
    description:
      'Scholarly sources and linguistic databases used to document the evolution of sounds.',
  },
  glossary: {
    title: 'Linguistic Glossary | EchoDrift Phonetic Atlas',
    description: "Key phonetic terminology: from Grimm's Law to Palatalization and Lenition.",
  },
  directory: {
    title: 'Full Transformation Directory | EchoDrift Phonetic Atlas',
    description:
      'A comprehensive directory of all documented phonetic transformations, sound shifts, and allophonic relationships in the EchoDrift atlas.',
  },
  families: {
    title: 'Language Families | EchoDrift Phonetic Atlas',
    description: 'Browse language families and their documented phonetic sound shifts.',
  },
};

async function buildMeta(env, request, url) {
  const segments = url.pathname.split('/').filter(Boolean);
  const canonical = SITE_ORIGIN + url.pathname;

  // Homepage: keep index.html's own meta, but give non-JS crawlers a body with
  // real links into the atlas (landmark shifts + hubs) instead of an empty #root.
  if (segments.length === 0) {
    const catalog = await loadCatalog(env, request);
    const landmarks = catalog.transformations.filter((t) => t.commonality === 5).slice(0, 40);
    const processes = [...new Set(catalog.transformations.flatMap((t) => t.tags || []))]
      .filter((tag) => !catalog.families.includes(tag))
      .sort();
    return {
      metaOnlyBody: true,
      body:
        '<main>' +
        SITE_NAV +
        '<h1>EchoDrift — Atlas of Phonetic Shifts, Sound Changes &amp; Allophones</h1>' +
        `<p>Interactive IPA matrix of ${catalog.transformations.length} documented phonetic transformations across ${catalog.families.length} language families and ${catalog.languages.length} languages.</p>` +
        '<h2>Landmark sound changes</h2>' +
        transformList(catalog, landmarks) +
        '<h2>Phonetic processes</h2><ul>' +
        processes.map((p) => `<li>${link(`/process/${encodeURIComponent(p)}`, p)}</li>`).join('') +
        '</ul><h2>Language families</h2><ul>' +
        catalog.families
          .filter((f) => catalog.transformations.some((t) => t.tags?.includes(f)))
          .map((f) => `<li>${link(`/family/${encodeURIComponent(f)}`, f)}</li>`)
          .join('') +
        '</ul></main>',
    };
  }

  // Static content routes: /about, /sources, /glossary, /directory, /families
  if (segments.length === 1 && STATIC_PAGES[segments[0]]) {
    const page = STATIC_PAGES[segments[0]];
    const key = segments[0];
    let extra = '';
    if (key === 'directory' || key === 'families' || key === 'glossary') {
      const catalog = await loadCatalog(env, request);
      if (key === 'directory') {
        extra = transformList(
          catalog,
          [...catalog.transformations].sort((a, b) => a.id.localeCompare(b.id))
        );
      } else if (key === 'families') {
        extra =
          '<ul>' +
          catalog.families
            .map((f) => [f, catalog.transformations.filter((t) => t.tags?.includes(f)).length])
            .filter(([, n]) => n > 0)
            .map(([f, n]) => `<li>${link(`/family/${encodeURIComponent(f)}`, f)} (${n})</li>`)
            .join('') +
          '</ul>';
      } else {
        const processes = [...new Set(catalog.transformations.flatMap((t) => t.tags || []))]
          .filter((tag) => !catalog.families.includes(tag))
          .sort();
        extra =
          '<ul>' +
          processes.map((p) => `<li>${link(`/process/${encodeURIComponent(p)}`, p)}</li>`).join('') +
          '</ul>';
      }
    }
    return {
      title: page.title,
      description: page.description,
      ogType: 'website',
      canonical,
      image: DEFAULT_IMAGE,
      jsonLd: breadcrumbLd([['Home', '/'], [page.title.split('|')[0].trim(), url.pathname]]),
      body: `<main>${SITE_NAV}<h1>${escapeText(page.title.split('|')[0].trim())}</h1><p>${escapeText(
        page.description
      )}</p>${extra}</main>`,
    };
  }

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
      const catalog = await loadCatalog(env, request);
      const title = `${pair}${effect ? ' — ' + effect : ''} | ${SITE_NAME} Atlas`;
      const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'ScholarlyArticle',
            headline: `Phonetic Shift: ${pair}${effect ? ` (${effect})` : ''}`,
            description: trans.preamble || '',
            url: canonical,
            image,
            author: { '@type': 'Organization', name: 'EchoDrift Contributors' },
            publisher: {
              '@type': 'Organization',
              name: SITE_NAME,
              logo: { '@type': 'ImageObject', url: `${SITE_ORIGIN}/favicon.svg` },
            },
            about: [fromSym, toSym]
              .filter(Boolean)
              .map((s) => ({ '@type': 'Thing', name: s.name, alternateName: s.symbol })),
            keywords: (trans.tags || []).join(', '),
            citation: trans.sources || [],
          },
          breadcrumbLd([['Home', '/'], ['All transformations', '/directory'], [pair, url.pathname]]),
        ],
      };
      return {
        title,
        description: clamp(
          `Documented phonetic shift ${pair}${names}. ${trans.preamble || ''}`,
          200
        ),
        ogType: 'article',
        canonical,
        image,
        imageAlt: `Phonetic shift ${pair}`,
        jsonLd,
        body: renderTransformBody(pair, trans, fromSym, toSym, { fromId, toId, catalog }),
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
    const mode = segments[0];
    const name = decodeSlug(segments[1]);
    const catalog = await loadCatalog(env, request);
    // Mirrors HubPage.tsx: languages live in `languages`, families and
    // processes both live in `tags`.
    const shifts = catalog.transformations.filter((t) =>
      mode === 'language' ? t.languages?.includes(name) : t.tags?.includes(name)
    );
    const noun = mode === 'process' ? 'phonetic process' : mode === 'family' ? 'language family' : 'language';
    const description = clamp(
      `${shifts.length} documented phonetic shifts and sound changes for the ${noun} ${name} — transformations, language examples and sources on the EchoDrift atlas.`,
      200
    );
    const parentPath = mode === 'language' ? '/directory' : mode === 'family' ? '/families' : '/glossary';
    // A language hub with a single documented shift is a title, one example
    // sentence, and nav links — thin, near-duplicate across ~950 such pages.
    // Keep it linkable (still helps internal linking / users) but not indexed.
    const thin = mode === 'language' && shifts.length < 2;
    return {
      title: `${name} Sound Changes | ${SITE_NAME} Atlas`,
      description,
      ogType: 'website',
      canonical,
      image: DEFAULT_IMAGE,
      robots: thin ? 'noindex, follow' : undefined,
      jsonLd: breadcrumbLd([['Home', '/'], [mode[0].toUpperCase() + mode.slice(1) + 's', parentPath], [name, url.pathname]]),
      body:
        `<main>${SITE_NAV}<h1>${escapeText(`${name} Sound Changes`)}</h1><p>${escapeText(description)}</p>` +
        (shifts.length ? `<h2>Documented transformations</h2>${transformList(catalog, shifts)}` : '') +
        '</main>',
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
function renderTransformBody(pair, trans, fromSym, toSym, ctx) {
  const { fromId, toId, catalog } = ctx;
  const effect = escapeText(trans.phoneticEffects || '');

  // Internal links: hubs for every language / family / process this shift
  // touches, the inverse shift, and `related` chain shifts. Without these the
  // crawler-facing page is a dead end and PageRank never flows between entries.
  const families = new Set();
  const languages = new Set();
  (trans.languageExamples || []).forEach((le) => {
    if (le.language) languages.add(le.language);
    if (le.languageFamily) families.add(le.languageFamily);
  });
  const processes = (trans.tags || []).filter((t) => !families.has(t) && !catalog.families.includes(t));
  const relatedIds = new Set();
  const inverseId = `${toId}_to_${fromId}`;
  if (catalog.byId.has(inverseId)) relatedIds.add(inverseId);
  (trans.related || []).forEach((r) => {
    const id = `${r.fromId}_to_${r.toId}`;
    if (catalog.byId.has(id)) relatedIds.add(id);
  });
  const hubList = (label, items, prefix) =>
    items.length
      ? `<p><strong>${label}:</strong> ${items
          .map((n) => link(`/${prefix}/${encodeURIComponent(n)}`, n))
          .join(', ')}</p>`
      : '';
  const relatedHtml = relatedIds.size
    ? `<h2>Related shifts</h2><ul>${[...relatedIds]
        .map((id) => {
          const t = catalog.byId.get(id);
          const label = id === inverseId ? 'Reverse shift: ' : '';
          return `<li>${link(transformHref(id), `${label}${pairLabel(catalog, id)} — ${t.name || ''}`)}</li>`;
        })
        .join('')}</ul>`
    : '';
  const navHtml =
    SITE_NAV +
    hubList('Phonetic processes', processes, 'process') +
    hubList('Language families', [...families], 'family') +
    hubList('Languages', [...languages], 'language');
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
    relatedHtml +
    navHtml +
    '</main>'
  );
}

function injectJsonLd(html, data) {
  if (!data) return html;
  // `</script` inside JSON would terminate the tag early; escape it.
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return html.replace('</head>', `<script type="application/ld+json">${json}</script></head>`);
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
  html = setMeta(html, 'name', 'robots', meta.robots || 'index, follow');
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
        let html = await indexRes.text();
        if (!meta.metaOnlyBody) html = injectMeta(html, meta);
        html = injectJsonLd(html, meta.jsonLd);
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
