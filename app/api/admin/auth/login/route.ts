import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminSession } from '@/lib/auth';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid credentials format' }, { status: 400 });
  }

  const ok = await createAdminSession(parsed.data.email, parsed.data.password);

  if (!ok) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
