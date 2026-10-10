/**
 * NGO approval — fixture-backed stand-in (mock mode only).
 * Only the backend can approve an NGO; it checks the caller has the admin role.
 */
import { SAMPLE_NGO_APPLICATIONS } from '@/fixtures/sample-ngos';
import { NgoApplication } from '@/types/ngo-workspace';

let applications: NgoApplication[] = JSON.parse(JSON.stringify(SAMPLE_NGO_APPLICATIONS));

export async function fetchNgoApplications(): Promise<NgoApplication[]> {
  return JSON.parse(JSON.stringify(applications));
}

export async function decideNgo(id: string, approved: boolean): Promise<NgoApplication> {
  const app = applications.find((a) => a.id === id);
  if (!app) throw new Error('NGO not found.');
  app.status = approved ? 'APPROVED' : 'SUSPENDED';
  app.decidedAt = new Date().toISOString();
  return { ...app };
}
