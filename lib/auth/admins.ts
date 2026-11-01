import 'server-only'

/**
 * Super-admin whitelist, read at runtime from the ADMIN_EMAILS env var
 * (separated by commas, semicolons or whitespace; case-insensitive).
 * An empty or missing list denies everyone.
 */
function getAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(/[,;\s]+/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  )
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return getAdminEmails().has(email.trim().toLowerCase())
}
