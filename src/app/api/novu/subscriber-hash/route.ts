import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const secretKey = process.env.NOVU_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'Novu not configured' }, { status: 500 });
  }

  const hash = createHmac('sha256', secretKey)
    .update(session.user.id)
    .digest('hex');

  return NextResponse.json({ subscriberHash: hash });
}
