/**
 * URL scheme allow-listing for any href/src derived from stored or
 * user-controlled data. React escapes HTML but deliberately does NOT
 * sanitize URL schemes — `javascript:...` in an href executes on click.
 */
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

export function safeExternalUrl(
  raw: string | undefined | null,
): string | null {
  if (!raw) return null;
  try {
    // Resolve against origin so scheme-relative "//evil.com" and bare
    // paths normalize safely; then enforce the protocol allow-list.
    const u = new URL(raw, window.location.origin);
    return ALLOWED_PROTOCOLS.has(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
}
