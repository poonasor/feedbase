import { NextResponse } from 'next/server';
import { deleteCustomPage, updateCustomPage } from '@/lib/api/custom-pages';
import { isValidCustomPageId } from '@/lib/custom-pages.mjs';
import { isTrustedMutationRequest } from '@/lib/csrf.mjs';

export async function PATCH(
  request: Request,
  context: { params: { slug: string; id: string } }
) {
  if (!isTrustedMutationRequest(request)) {
    return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
  }

  if (!isValidCustomPageId(context.params.id)) {
    return NextResponse.json({ error: 'Invalid custom page id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const { data, error } = await updateCustomPage(
    context.params.id,
    context.params.slug,
    body,
    'route'
  );

  if (error) return NextResponse.json({ error: error.message }, { status: error.status });
  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(
  request: Request,
  context: { params: { slug: string; id: string } }
) {
  if (!isTrustedMutationRequest(request)) {
    return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
  }

  if (!isValidCustomPageId(context.params.id)) {
    return NextResponse.json({ error: 'Invalid custom page id.' }, { status: 400 });
  }

  const { data, error } = await deleteCustomPage(
    context.params.id,
    context.params.slug,
    'route'
  );

  if (error) return NextResponse.json({ error: error.message }, { status: error.status });
  return NextResponse.json(data, { status: 200 });
}
