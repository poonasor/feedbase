function getOrigin(value) {
  if (!value || value === 'null') return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function isTrustedMutationRequest(request) {
  if (request.headers.get('authorization')) return true;

  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get('origin');
  if (origin) return getOrigin(origin) === requestOrigin;

  const referer = request.headers.get('referer');
  return getOrigin(referer) === requestOrigin;
}
