import { NextResponse } from 'next/server';
import { createCustomPage, getAllCustomPages } from '@/lib/api/custom-pages';
import { isTrustedMutationRequest } from '@/lib/csrf.mjs';

export async function GET(_request: Request, context: { params: { slug: string } }) {
  const { data, error } = await getAllCustomPages(context.params.slug, 'route');

  if (error) return NextResponse.json({ error: error.message }, { status: error.status });
  return NextResponse.json(data, { status: 200 });
}

export async function POST(request: Request, context: { params: { slug: string } }) {
  if (!isTrustedMutationRequest(request)) {
    return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const { data, error } = await createCustomPage(context.params.slug, body, 'route');

  if (error) return NextResponse.json({ error: error.message }, { status: error.status });
  return NextResponse.json(data, { status: 201 });
}
