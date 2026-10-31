/**
 * When two people book at the same moment, the server keeps one booking and answers the
 * other with 409 + `conflict: true` (nothing was saved). Those requests are safe to send
 * again, so retry them a few times with a short random pause before showing an error.
 */
export async function fetchWithConflictRetry(
  input: RequestInfo | URL,
  init: RequestInit,
  retries = 3,
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(input, init);
    if (res.status !== 409 || attempt >= retries) return res;
    const data = await res.clone().json().catch(() => null);
    if (!data?.conflict) return res;
    await new Promise((r) => setTimeout(r, 150 + Math.random() * 350 * (attempt + 1)));
  }
}
