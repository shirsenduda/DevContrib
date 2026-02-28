import { NextResponse } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/api-helpers';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const user = await requireAuth();

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const unreadCount = notifications.filter((n) => !n.readAt).length;

    return NextResponse.json({ data: notifications, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH() {
  try {
    const user = await requireAuth();

    await prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
