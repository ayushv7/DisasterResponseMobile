/**
 * Account types. The backend issues every NGO code, worker ID, password and
 * token; the app only sends what the user typed and shows what came back.
 */
import { Role } from './roles';

export type StaffRole = Extract<Role, 'ngo' | 'coordinator' | 'admin'>;

/** A field worker. Belongs to exactly one NGO; created by that NGO, never self-registered. */
export interface NgoMember {
  id: string;
  /** Issued by the backend. Used with the NGO code to sign in. */
  workerId: string;
  ngoId: string;
  ngoName: string;
  name: string;
  phone: string;
  skills: string[];
  status: 'ACTIVE' | 'DISABLED';
  /** True until the worker replaces the temporary password. */
  mustChangePassword: boolean;
  /** Team the worker is dispatched with (decides which tasks they see). */
  teamId?: string;
  createdAt: string;
}

/** Returned once by createWorker / resetWorkerPassword. Never stored by the app. */
export interface WorkerCredentials {
  workerId: string;
  temporaryPassword: string;
}

export interface CreateWorkerInput {
  name: string;
  phone: string;
  skills: string[];
}

export interface WorkerLoginInput {
  ngoCode: string;
  workerId: string;
  password: string;
}

/** Who is signed in, for display ("who did this"). Not authorization. */
export interface SessionUser {
  name: string;
  ngoName?: string;
  workerId?: string;
}

export interface StaffLoginResult {
  role: StaffRole;
  user: SessionUser;
}

export interface WorkerLoginResult {
  member: NgoMember;
}
