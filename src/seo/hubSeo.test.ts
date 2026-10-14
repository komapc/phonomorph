import { describe, it, expect } from 'vitest';
import { hubSeo } from './hubSeo';

describe('hubSeo', () => {
  it('builds title, canonical and encodes the name', () => {
    const s = hubSeo('language', 'African American Vernacular English', 5);
    expect(s.title).toBe('African American Vernacular English Sound Changes | EchoDrift');
    expect(s.canonical).toMatch(/\/language\/African%20American%20Vernacular%20English$/);
    expect(s.robots).toBeUndefined();
  });

  it('marks single-shift hubs noindex', () => {
    const s = hubSeo('process', 'Rare', 1);
    expect(s.robots).toBe('noindex, follow');
    expect(s.head.some(t => t.attrs.name === 'robots')).toBe(true);
  });

  it('mentions the count in the description', () => {
    expect(hubSeo('family', 'Germanic', 389).description).toContain('389');
  });
});
