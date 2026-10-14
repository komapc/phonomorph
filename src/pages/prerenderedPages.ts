import { lazyPage } from '../utils/lazyPage';

// Content pages the build prerenders (scripts/prerender.ts). Lazy chunks, but
// preloadRoute() lets main.tsx load the right one before hydrating.
export const About = lazyPage(() => import('./About'));
export const Glossary = lazyPage(() => import('./Glossary'));
export const Directory = lazyPage(() => import('./Directory'));
export const Families = lazyPage(() => import('./Families'));

const BY_PATH: Record<string, { preload: () => Promise<unknown> }> = {
  '/about': About,
  '/glossary': Glossary,
  '/directory': Directory,
  '/families': Families,
};

export function preloadRoute(pathname: string): Promise<unknown> {
  const page = BY_PATH[pathname.replace(/\/$/, '')];
  return page ? page.preload() : Promise.resolve();
}
