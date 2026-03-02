export const LOGIN_ID_REGEX = /^[a-z0-9][a-z0-9._-]{2,63}$/;

export function normalizeLoginId(value: string) {
  return value.trim().toLowerCase();
}

export function isValidLoginId(value: string) {
  return LOGIN_ID_REGEX.test(normalizeLoginId(value));
}

export function loginIdToAuthEmail(loginId: string) {
  return `${normalizeLoginId(loginId)}@admin.dlboss.local`;
}
