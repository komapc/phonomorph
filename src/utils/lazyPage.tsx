import { lazy } from 'react';
import type { ComponentType } from 'react';

/**
 * React.lazy whose module can be loaded ahead of time. Once `preload()` has
 * resolved, rendering the page no longer suspends, so a prerendered page can be
 * hydrated in place instead of falling back to the Suspense fallback.
 */
export function lazyPage(load: () => Promise<{ default: ComponentType }>) {
  let loaded: ComponentType | null = null;
  const remember = (m: { default: ComponentType }) => {
    loaded = m.default;
    return m;
  };
  const Lazy = lazy(() => load().then(remember));
  const Page: ComponentType = () => {
    const Loaded = loaded;
    return Loaded ? <Loaded /> : <Lazy />;
  };
  return Object.assign(Page, { preload: () => load().then(remember) });
}
