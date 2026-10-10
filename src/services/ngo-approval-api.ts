/**
 * NGO approval — fixture-backed stand-in (mock mode only).
 * Only the backend can approve an NGO; it checks the caller has the admin role.
 */
import { activateNgo, suspendNgo } from '@/services/mock/cascades';
import { store } from '@/services/mock/store';
import { SAMPLE_TEMP_PASSWORD } from '@/fixtures/sample-accounts';
import { CreateNgoInput, NgoApplication, NgoCredentials } from '@/types/ngo-workspace';

// The queue lives in the shared mock store; approval side effects in mock/cascades.

export async function fetchNgoApplications(): Promise<NgoApplication[]> {
  return JSON.parse(JSON.stringify(store.ngoApplications));
}

export async function decideNgo(id: string, approved: boolean): Promise<NgoApplication> {
  const app = store.ngoApplications.find((a) => a.id === id);
  if (!app) throw new Error('NGO not found.');
  app.status = approved ? 'APPROVED' : 'SUSPENDED';
  app.decidedAt = new Date().toISOString();
  if (approved) activateNgo(app);
  else suspendNgo(app.id);
  return { ...app };
}

/** Authority creates an NGO account; the backend would issue the code and password. */
export async function createNgo(
  input: CreateNgoInput
): Promise<{ ngo: NgoApplication; credentials: NgoCredentials }> {
  const ngo: NgoApplication = {
    id: `ngo-app-${store.ngoApplications.length + 101}`,
    name: input.name,
    status: 'APPROVED',
    focusAreas: [],
    area: input.area,
    registeredAt: new Date().toISOString(),
    decidedAt: new Date().toISOString(),
  };
  store.ngoApplications = [...store.ngoApplications, ngo];
  const ngoCode = `SAMPLE-NGO-${store.ngoApplications.length}`;
  activateNgo(ngo, ngoCode);
  return {
    ngo: { ...ngo },
    credentials: {
      ngoCode,
      loginEmail: input.email,
      temporaryPassword: SAMPLE_TEMP_PASSWORD,
    },
  };
}
