import { lazy } from 'react';
import type { ComponentType } from 'react';

/**
 * React.lazy whose module can be loaded ahead of time. Once `preload()` has
 * resolved, rendering the page no longer suspends, so a prerendered page can be
 * hydrated in place instead of falling back to the Suspense fallback.
 */
export function lazyPage<P extends object>(load: () => Promise<{ default: ComponentType<P> }>) {
  let loaded: ComponentType<P> | null = null;
  const remember = (m: { default: ComponentType<P> }) => {
    loaded = m.default;
    return m;
  };
  const Lazy = lazy(() => load().then(remember));
  const Page = (props: P) => {
    const Loaded = loaded;
    return Loaded ? <Loaded {...props} /> : <Lazy {...props} />;
  };
  return Object.assign(Page, { preload: () => load().then(remember) });
}
