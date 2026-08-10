export function createRewriteOptions(
  requestHeaders: HeadersInit,
  routingHeaders: Record<string, string | null | undefined>,
  responseHeaders?: Record<string, string>
): {
  request: { headers: Headers };
  headers: Headers;
};
