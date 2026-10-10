/**
 * Volunteer applications. Eligibility is decided by the backend; the app only
 * shows the result and its reasons.
 */
export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
  checkedAt: string;
}

export type VolunteerApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';

export const VOLUNTEER_STATUS_LABELS: Record<VolunteerApplicationStatus, string> = {
  PENDING: 'Pending review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  REVOKED: 'Revoked',
};

export interface VolunteerApplication {
  id: string;
  name: string;
  contact: string;
  skills: string[];
  availability: string;
  ngoId?: string;
  ngoName?: string;
  /** Citizen applied, or the NGO invited them. */
  source: 'APPLIED' | 'INVITED';
  status: VolunteerApplicationStatus;
  /** Reason the NGO gave when rejecting or revoking. */
  decisionReason?: string;
  eligibility?: EligibilityResult;
  createdAt: string;
  decidedAt?: string;
}

export interface ApplyToVolunteerInput {
  name: string;
  skills: string[];
  availability: string;
  ngoId?: string;
  /** Must be true: consent to share these details with the NGO and be contacted. */
  consent: boolean;
}

export type VolunteerDecision = 'APPROVE' | 'REJECT' | 'REVOKE';
