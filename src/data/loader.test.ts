import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchDataIndex, fetchUnattested } from './loader';

// Mock the cache and environment
vi.mock('../utils/cache', () => ({
  cachedFetch: vi.fn((_key, _cache, fn) => fn()),
  transformationCache: {},
  symbolCache: {},
  indexCache: {}
}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('fetchDataIndex', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('correctly loads and flattens sharded data', async () => {
    // 1. Mock Manifest
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        symbols: [{ id: 'a' }],
        stats: {},
        shards: {
          transformations: ['t1.json'],
          unattested: ['u1.json']
        }
      })
    });

    // 2. Mock Transformation Shard
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 'a_to_b', name: 'Shift' }]
    });

    const result = await fetchDataIndex();

    expect(result.symbols).toHaveLength(1);
    expect(result.transformations).toHaveLength(1);
    expect(result.transformations[0].id).toBe('a_to_b');
    // Unattested ids are loaded separately, on demand.
    expect(result.unattested).toHaveLength(0);

    // Manifest + one transformation shard only.
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('loads unattested shards separately', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ symbols: [], stats: {}, shards: { transformations: [], unattested: ['u1.json'] } })
    });
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ['c_to_d'] });

    expect(await fetchUnattested()).toEqual(['c_to_d']);
  });

  it('throws a user-friendly error on manifest failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });

    await expect(fetchDataIndex()).rejects.toThrow('Could not load the phonetic transformation atlas');
  });
});
