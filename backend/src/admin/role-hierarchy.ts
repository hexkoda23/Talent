export const ROLE_RANK: Record<string, number> = {
  superadmin: 100,
  campus_admin: 80,
  coding_mentor: 60,
  student: 10,
  candidate: 5,
};

export const ADMIN_ROLE_NAMES = ['superadmin', 'campus_admin', 'coding_mentor'];
export const ASSIGNABLE_ROLE_NAMES = Object.keys(ROLE_RANK);

export function highestRoleRank(roles: string[] = []) {
  return roles.reduce((highest, role) => Math.max(highest, ROLE_RANK[role] ?? 0), 0);
}

export function isAdminRole(role: string) {
  return ADMIN_ROLE_NAMES.includes(role);
}
