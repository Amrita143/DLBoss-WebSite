import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth';
import type { AdminRole } from '@/lib/types';

interface EnsureAdminOptions {
  roles?: AdminRole[];
}

export async function ensureAdmin(options: EnsureAdminOptions = {}) {
  const session = await requireAdminSession();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    };
  }

  if (options.roles && !options.roles.includes(session.role)) {
    return {
      session,
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    };
  }

  return { session, error: null };
}
