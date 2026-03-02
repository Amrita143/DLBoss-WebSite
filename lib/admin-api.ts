import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth';

export async function ensureAdmin() {
  const session = await requireAdminSession();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    };
  }

  return { session, error: null };
}
