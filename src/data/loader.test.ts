import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchDataIndex } from './loader';

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

    // 3. Mock Unattested Shard
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ['c_to_d']
    });

    const result = await fetchDataIndex();

    expect(result.symbols).toHaveLength(1);
    expect(result.transformations).toHaveLength(1);
    expect(result.transformations[0].id).toBe('a_to_b');
    expect(result.unattested).toHaveLength(1);
    expect(result.unattested[0]).toBe('c_to_d');
    
    // Should have made 3 fetch calls
    expect(mockFetch).toHaveBeenCalledTimes(3);
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
