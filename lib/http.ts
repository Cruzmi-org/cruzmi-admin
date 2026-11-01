/**
 * Redirect with a RELATIVE Location header.
 *
 * Behind Coolify's proxy, the standalone server only knows its internal address
 * (0.0.0.0:3000), so absolute URLs built from request.url point to the wrong
 * host. Relative redirects are resolved by the browser against the public URL.
 */
export function relativeRedirect(path: string, status: 303 | 307 = 303): Response {
  return new Response(null, { status, headers: { Location: path } })
}
