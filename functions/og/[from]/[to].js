// Dynamic per-pair Open Graph image: GET /og/:from/:to.png
//
// Rendered at the edge with workers-og (Satori + resvg wasm). Labels come from
// the static symbol/transformation JSON. Result is cached; on any failure we
// redirect to the static og-preview.png so link previews never break.

import { ImageResponse } from 'workers-og';

const SITE_ORIGIN = 'https://echodrift.pages.dev';
const FALLBACK_IMAGE = `${SITE_ORIGIN}/og-preview.png`;

function stripExt(s) {
  return s.replace(/\.(png|jpe?g)$/i, '');
}

// workers-og's HTML parser does NOT decode entities, so we can't entity-encode.
// Just strip the characters that would break the markup structure.
function sanitize(s) {
  return String(s).replace(/[<>]/g, '');
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

async function fetchFont(env, request, path) {
  const res = await env.ASSETS.fetch(new Request(new URL(path, request.url)));
  if (!res.ok) throw new Error(`font ${path} ${res.status}`);
  return res.arrayBuffer();
}

export async function onRequestGet(context) {
  const { params, request, env, waitUntil } = context;

  // Serve from edge cache when possible.
  const cache = caches.default;
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const fromId = stripExt(params.from);
    const toId = stripExt(params.to);

    const [trans, fromSym, toSym, fontRegular, fontBold] = await Promise.all([
      fetchJSON(env, request, `/data/transformations/${fromId}_to_${toId}.json`),
      fetchJSON(env, request, `/data/symbols/${fromId}.json`),
      fetchJSON(env, request, `/data/symbols/${toId}.json`),
      fetchFont(env, request, '/fonts/DejaVuSans.ttf'),
      fetchFont(env, request, '/fonts/DejaVuSans-Bold.ttf'),
    ]);

    const fromSymbol = sanitize(fromSym?.symbol || fromId);
    const toSymbol = sanitize(toSym?.symbol || toId);
    const effect = sanitize(
      ((trans?.phoneticEffects || '').split(',')[0] || 'Phonetic shift').trim()
    );
    const subtitle = sanitize(
      fromSym?.name && toSym?.name
        ? `${fromSym.name} → ${toSym.name}`
        : 'Atlas of phonetic shifts & sound changes'
    );

    const pills = [];
    if (trans?.certainty) pills.push(`Certainty ${trans.certainty}/5`);
    if (trans?.commonality) pills.push(`Commonality ${trans.commonality}/5`);
    if (trans?.isAllophone) pills.push('Allophone');
    const pillsHtml = pills
      .map(
        (p) =>
          `<div style="display:flex;background:#1e1e3a;border:1px solid #4f46e5;border-radius:100px;padding:8px 20px;color:#c7d2fe;font-size:24px;">${sanitize(
            p
          )}</div>`
      )
      .join('');

    const html = `
      <div style="display:flex;flex-direction:column;width:1200px;height:630px;background:#0b0e14;color:#ffffff;font-family:'DejaVu Sans';position:relative;">
        <div style="display:flex;width:10px;height:630px;background:#7c3aed;position:absolute;top:0;left:0;"></div>
        <div style="display:flex;flex-direction:column;padding:70px 80px;height:630px;justify-content:space-between;">
          <div style="display:flex;flex-direction:column;">
            <div style="display:flex;color:#7c8aff;font-size:26px;letter-spacing:4px;margin-bottom:20px;">PHONETIC SHIFT</div>
            <div style="display:flex;align-items:center;">
              <div style="display:flex;font-size:160px;font-weight:700;">[${fromSymbol}]</div>
              <div style="display:flex;font-size:110px;color:#7c8aff;margin:0 50px;">→</div>
              <div style="display:flex;font-size:160px;font-weight:700;">[${toSymbol}]</div>
            </div>
            <div style="display:flex;font-size:44px;color:#a5b4fc;font-weight:700;margin-top:24px;">${effect}</div>
            <div style="display:flex;font-size:30px;color:#9ca3c4;margin-top:12px;">${subtitle}</div>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;">${pillsHtml}</div>
            <div style="display:flex;font-size:30px;font-weight:700;color:#ffffff;">EchoDrift</div>
          </div>
        </div>
      </div>`;

    const image = new ImageResponse(html, {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'DejaVu Sans', data: fontRegular, weight: 400, style: 'normal' },
        { name: 'DejaVu Sans', data: fontBold, weight: 700, style: 'normal' },
      ],
    });

    const response = new Response(image.body, {
      headers: {
        'content-type': 'image/png',
        'cache-control': 'public, max-age=31536000, immutable',
      },
    });
    waitUntil(cache.put(request, response.clone()));
    return response;
  } catch (_) {
    return Response.redirect(FALLBACK_IMAGE, 302);
  }
}
