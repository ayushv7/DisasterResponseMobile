/**
 * User roles. The backend decides what each role may do; the app only uses
 * the role to pick a home screen and tab set (convenience, not authorization).
 */
export type Role = 'public' | 'coordinator' | 'field_worker' | 'ngo' | 'admin';

export const ROLE_LABELS: Record<Role, string> = {
  public: 'Public',
  coordinator: 'Coordinator',
  field_worker: 'Field worker',
  ngo: 'NGO',
  admin: 'Admin',
};
