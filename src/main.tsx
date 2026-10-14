import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import type { PagePayload } from './data/transformPayload'

// index.html carries default <head> tags for non-JS clients. Each page renders
// its own <title>/<meta>/<link> (React 19 hoists them into <head>), so drop the
// static ones first to avoid duplicates (document.title would otherwise keep
// reading the first <title>).
document.head
  .querySelectorAll(
    'title, meta[name="title"], meta[name="description"], meta[name="robots"], ' +
      'meta[property^="og:"]:not([property="og:site_name"]):not([property="og:locale"]), meta[name^="twitter:"], link[rel="canonical"], ' +
      'script[type="application/ld+json"]'
  )
  .forEach((el) => el.remove())

const rootEl = document.getElementById('root')!

// Data the prerendered page was generated from (see scripts/prerender.ts).
let payload: PagePayload | null = null
try {
  const raw = document.getElementById('page-payload')?.textContent
  if (raw) payload = JSON.parse(raw)
} catch {
  /* fall back to client rendering */
}

const app = (
  <StrictMode>
    <App payload={payload} />
  </StrictMode>
)

// Pages prerendered by scripts/prerender.tsx ship their markup in #root plus the
// data they were rendered from; hydrate them instead of rendering from scratch.
if (payload && rootEl.hasAttribute('data-prerendered')) {
  hydrateRoot(rootEl, app)
} else {
  createRoot(rootEl).render(app)
}
