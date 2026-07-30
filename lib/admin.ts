export const PRIMARY_ADMIN_EMAIL = 'suporte@totalflix.com';

export function isAdminEmail(email?: string | null): boolean {
  return email?.trim().toLowerCase() === PRIMARY_ADMIN_EMAIL;
}
