import { SeverityLevel } from '@/types/operations';

/** Display labels; UNKNOWN means the backend has not assessed severity yet. */
export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MODERATE: 'Moderate',
  LOW: 'Low',
  UNKNOWN: 'Not assessed',
};
