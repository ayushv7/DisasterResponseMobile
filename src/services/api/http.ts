/**
 * httpApi — real backend client. Not implemented yet.
 *
 * Implement each method against the agreed FastAPI contract
 * (draft: docs/api-contract-proposal.md) using API_BASE_URL. Return
 * `source: 'live'` so sample-data labels disappear.
 */
import { ApiClient, NotImplementedError } from './types';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

function notImplemented(method: string): () => Promise<never> {
  return () => Promise.reject(new NotImplementedError(method));
}

export const httpApi: ApiClient = {
  mode: 'http',
  getOpsSummary: notImplemented('getOpsSummary'),
  getActionQueue: notImplemented('getActionQueue'),
  getIncidents: notImplemented('getIncidents'),
  getIncident: notImplemented('getIncident'),
  getWorkOrders: notImplemented('getWorkOrders'),
  getWorkOrder: notImplemented('getWorkOrder'),
  getResources: notImplemented('getResources'),
  getRecommendation: notImplemented('getRecommendation'),
  assign: notImplemented('assign'),
  acknowledge: notImplemented('acknowledge'),
  start: notImplemented('start'),
  reportProblem: notImplemented('reportProblem'),
  submitCompletion: notImplemented('submitCompletion'),
  verify: notImplemented('verify'),
  getReassignments: notImplemented('getReassignments'),
  reassign: notImplemented('reassign'),
  getVerifiedNgos: notImplemented('getVerifiedNgos'),
  messageNgo: notImplemented('messageNgo'),
  getSentMessages: notImplemented('getSentMessages'),
  getNgoInbox: notImplemented('getNgoInbox'),
  publishUpdate: notImplemented('publishUpdate'),
};
