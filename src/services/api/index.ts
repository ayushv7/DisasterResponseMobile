import { API_BASE_URL, httpApi } from './http';
import { mockApi } from './mock';
import { ApiClient } from './types';

/** EXPO_PUBLIC_API_BASE_URL unset → mock (sample data). Set → real backend. */
export const api: ApiClient = API_BASE_URL ? httpApi : mockApi;

export const IS_MOCK_API = api.mode === 'mock';

export * from './types';
