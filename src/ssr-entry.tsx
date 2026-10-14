/// <reference types="node" />
// Server-side entry used only by scripts/prerender.ts (via Vite's ssrLoadModule).
import { prerenderToNodeStream } from 'react-dom/static';
import { StaticRouter } from 'react-router-dom';
import { AppShell } from './App';
import type { PagePayload } from './data/transformPayload';

// react-dom/static waits for every Suspense boundary (React.lazy routes) and
// emits the final markup, with no fallbacks and no streaming patch-up scripts.
export async function renderApp(path: string, payload: PagePayload | null): Promise<string> {
  const { prelude } = await prerenderToNodeStream(
    <StaticRouter location={path}>
      <AppShell payload={payload} />
    </StaticRouter>,
    // Don't outline big Suspense boundaries into hidden segments + swap scripts.
    { progressiveChunkSize: Number.MAX_SAFE_INTEGER }
  );
  const chunks: Buffer[] = [];
  for await (const chunk of prelude) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}
