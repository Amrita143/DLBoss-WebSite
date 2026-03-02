import { NextResponse } from 'next/server';
import { clearAdminSession } from '@/lib/auth';
import { getEnv } from '@/lib/env';

export async function POST() {
  await clearAdminSession();
  const env = getEnv();
  return NextResponse.redirect(new URL('/admin/login', env.NEXT_PUBLIC_SITE_URL));
}
