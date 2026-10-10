/**
 * NGO approval — fixture-backed stand-in (mock mode only).
 * Only the backend can approve an NGO; it checks the caller has the admin role.
 */
import { SAMPLE_NGO_APPLICATIONS } from '@/fixtures/sample-ngos';
import { SAMPLE_TEMP_PASSWORD } from '@/fixtures/sample-accounts';
import { CreateNgoInput, NgoApplication, NgoCredentials } from '@/types/ngo-workspace';

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

/** Authority creates an NGO account; the backend would issue the code and password. */
export async function createNgo(
  input: CreateNgoInput
): Promise<{ ngo: NgoApplication; credentials: NgoCredentials }> {
  const ngo: NgoApplication = {
    id: `ngo-app-${applications.length + 101}`,
    name: input.name,
    status: 'APPROVED',
    focusAreas: [],
    area: input.area,
    registeredAt: new Date().toISOString(),
    decidedAt: new Date().toISOString(),
  };
  applications = [...applications, ngo];
  return {
    ngo: { ...ngo },
    credentials: {
      ngoCode: `SAMPLE-NGO-${applications.length}`,
      loginEmail: input.email,
      temporaryPassword: SAMPLE_TEMP_PASSWORD,
    },
  };
}
