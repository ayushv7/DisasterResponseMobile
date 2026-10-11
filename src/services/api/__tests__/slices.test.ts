/** Per-slice routing: only health goes to the real backend, and only when a base URL is set. */
import { afterEach, describe, expect, it, jest } from '@jest/globals';

type ApiModule = typeof import('@/services/api');
type Adapters = {
  mockApi: typeof import('@/services/api/mock').mockApi;
  httpApi: typeof import('@/services/api/http').httpApi;
};

function load(baseUrl?: string): ApiModule & Adapters {
  let loaded!: ApiModule & Adapters;
  // isolateModules needs synchronous require() to re-read the env per load
  /* eslint-disable @typescript-eslint/no-require-imports */
  jest.isolateModules(() => {
    if (baseUrl) process.env.EXPO_PUBLIC_API_BASE_URL = baseUrl;
    else delete process.env.EXPO_PUBLIC_API_BASE_URL;
    const mod = require('@/services/api') as ApiModule;
    const adapters: Adapters = {
      mockApi: require('@/services/api/mock').mockApi,
      httpApi: require('@/services/api/http').httpApi,
    };
    // Read through to the module so reassigned exports (live bindings) stay current
    loaded = new Proxy(mod, {
      get: (target, key) => (key in adapters ? adapters[key as keyof Adapters] : target[key as keyof ApiModule]),
    }) as ApiModule & Adapters;
  });
  /* eslint-enable @typescript-eslint/no-require-imports */
  return loaded;
}

afterEach(() => {
  delete process.env.EXPO_PUBLIC_API_BASE_URL;
});

describe('api slices', () => {
  it('defaults to Live: real slices use http even without a URL, and fail clearly', async () => {
    const m = load();
    expect(m.getDataSource().mode).toBe('live');
    expect(m.REAL_SLICES).toEqual(['health', 'incidents', 'observations']);
    expect(m.adapterFor('getIncidents')).toBe(m.httpApi);
    expect(m.adapterFor('getMyAlerts')).toBe(m.mockApi);
    // Never silently served from sample data
    await expect(m.api.getIncidents()).rejects.toMatchObject({ code: 'NO_BACKEND_URL' });
  });

  it('makes health, incidents and observations real when a backend URL is set', () => {
    const m = load('http://localhost:8000');
    expect(m.REAL_SLICES).toEqual(['health', 'incidents', 'observations']);
    expect(m.IS_MOCK_API).toBe(true);
    for (const method of ['getHealth', 'getIncidents', 'getIncident', 'getIncidentObservations'] as const) {
      expect(m.adapterFor(method)).toBe(m.httpApi);
    }
    // Everything else, including public alerts and the ops summary, stays mock
    for (const method of [
      'getMyAlerts',
      'getOpsSummary',
      'getActionQueue',
      'getResources',
      'getResourcePlan',
      'getWorkOrders',
      'staffLogin',
    ] as const) {
      expect(m.adapterFor(method)).toBe(m.mockApi);
    }
  });

  it('the sample data switch forces every slice to mock at runtime, and off restores Live', () => {
    const m = load('http://localhost:8000');
    m.setDataMode('sample');
    expect(m.REAL_SLICES).toEqual([]);
    expect(m.adapterFor('getIncidents')).toBe(m.mockApi);
    expect(m.adapterFor('getHealth')).toBe(m.mockApi);
    m.setDataMode('live');
    expect(m.REAL_SLICES).toEqual(['health', 'incidents', 'observations']);
    expect(m.adapterFor('getIncidents')).toBe(m.httpApi);
  });

  it('a saved URL overrides the build-time URL', () => {
    const m = load('http://localhost:8000');
    m.setSavedUrl('http://10.0.2.2:8000');
    expect(m.getBaseUrl()).toBe('http://10.0.2.2:8000');
    expect(m.adapterFor('getIncidents')).toBe(m.httpApi);
  });

  it('accepts only http(s) URLs, trimmed', () => {
    const m = load();
    expect(m.normalizeUrl('  http://192.168.1.20:8000/  ')).toBe('http://192.168.1.20:8000');
    expect(m.normalizeUrl('ftp://x')).toBeNull();
    expect(m.normalizeUrl('localhost:8000')).toBeNull();
  });
});
