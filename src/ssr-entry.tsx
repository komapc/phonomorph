// Server-side entry used only by scripts/prerender.ts (via Vite's ssrLoadModule).
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { AppShell } from './App';
import type { TransformPayload } from './data/transformPayload';

export function renderApp(path: string, payload: TransformPayload | null): string {
  return renderToString(
    <StaticRouter location={path}>
      <AppShell payload={payload} />
    </StaticRouter>
  );
}
