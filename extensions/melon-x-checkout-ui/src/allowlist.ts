const ALLOWLISTED_EMAILS = ['folakemi@gmail.com'];

export function normalizeEmail(email: string | undefined | null): string {
  return (email ?? '').trim().toLowerCase();
}

export function isAllowlistedEmail(email: string | undefined | null): boolean {
  const normalized = normalizeEmail(email);

  if (!normalized) {
    return false;
  }

  return ALLOWLISTED_EMAILS.includes(normalized);
}