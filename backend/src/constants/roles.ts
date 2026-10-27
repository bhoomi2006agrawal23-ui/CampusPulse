export const ROLES = {
  STUDENT: 'Student',
  ORGANIZER: 'Organizer',
  JUDGE: 'Judge',
  VOLUNTEER: 'Volunteer',
  ADMIN: 'Admin',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const VALID_ROLES: UserRole[] = [
  ROLES.STUDENT,
  ROLES.ORGANIZER,
  ROLES.JUDGE,
  ROLES.VOLUNTEER,
  ROLES.ADMIN,
];
