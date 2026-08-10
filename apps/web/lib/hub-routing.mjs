export function createRewriteOptions(requestHeaders, routingHeaders, responseHeaders = {}) {
  const forwardedHeaders = new Headers(requestHeaders);
  for (const [name, value] of Object.entries(routingHeaders)) {
    if (value !== null && value !== undefined) forwardedHeaders.set(name, value);
  }

  return {
    request: { headers: forwardedHeaders },
    headers: new Headers(responseHeaders),
  };
}
