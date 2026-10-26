export const isAdminRole = (role: unknown): role is 'ADMIN' | 'OPERATOR' =>
  role === 'ADMIN' || role === 'OPERATOR';
