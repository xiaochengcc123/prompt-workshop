const separator = ",";

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(separator)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  return getAdminEmails().includes(email.trim().toLowerCase());
}

export function assertAdmin(email: string | null | undefined) {
  return isAdminEmail(email);
}
