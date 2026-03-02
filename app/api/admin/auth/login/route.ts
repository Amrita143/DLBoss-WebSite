import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminSession } from '@/lib/auth';

const schema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid credentials format' }, { status: 400 });
  }

  const result = await createAdminSession(parsed.data.identifier, parsed.data.password);

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Invalid admin ID or password' }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
