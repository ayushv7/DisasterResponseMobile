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
    loaded = {
      ...(require('@/services/api') as ApiModule),
      mockApi: require('@/services/api/mock').mockApi,
      httpApi: require('@/services/api/http').httpApi,
    };
  });
  /* eslint-enable @typescript-eslint/no-require-imports */
  return loaded;
}

afterEach(() => {
  delete process.env.EXPO_PUBLIC_API_BASE_URL;
});

describe('api slices', () => {
  it('uses mock for every slice without a backend URL', () => {
    const m = load();
    expect(m.REAL_SLICES).toEqual([]);
    expect(m.IS_MOCK_API).toBe(true);
    expect(m.api.getHealth).toBe(m.mockApi.getHealth);
    expect(m.api.getIncidents).toBe(m.mockApi.getIncidents);
  });

  it('makes only health real when a backend URL is set', () => {
    const m = load('http://localhost:8000');
    expect(m.REAL_SLICES).toEqual(['health']);
    expect(m.IS_MOCK_API).toBe(true);
    expect(m.api.getHealth).toBe(m.httpApi.getHealth);
    for (const method of ['getIncidents', 'getResources', 'getResourcePlan', 'getWorkOrders', 'staffLogin'] as const) {
      expect(m.api[method]).toBe(m.mockApi[method]);
    }
  });
});
