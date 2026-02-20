'use client';

import { Inbox } from '@novu/nextjs';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function NotificationInbox() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session?.user?.id) return null;

  const appId = process.env.NEXT_PUBLIC_NOVU_APP_ID;
  if (!appId) return null;

  return (
    <Inbox
      applicationIdentifier={appId}
      subscriber={session.user.id}
      routerPush={(path: string) => router.push(path)}
      placement="bottom-end"
      placementOffset={6}
      appearance={{
        variables: {
          colorBackground: 'hsl(224 71% 4%)',
          colorForeground: 'hsl(213 31% 91%)',
          colorPrimary: 'hsl(210 40% 98%)',
          colorPrimaryForeground: 'hsl(222.2 47.4% 11.2%)',
          colorSecondary: 'hsl(222.2 47.4% 11.2%)',
          colorSecondaryForeground: 'hsl(210 40% 98%)',
          colorCounter: 'hsl(0 72% 51%)',
          colorCounterForeground: 'hsl(210 40% 98%)',
          colorNeutral: 'hsl(216 12% 84%)',
          colorShadow: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
        },
        elements: {
          bellContainer: {
            width: '32px',
            height: '32px',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
          bellIcon: {
            width: '18px',
            height: '18px',
            color: 'hsl(215 20% 65%)',
          },
          bellDot: {
            width: '8px',
            height: '8px',
            top: '2px',
            right: '2px',
            background: 'hsl(0 72% 51%)',
          },
          inbox__popoverContent: {
            width: '380px',
            maxHeight: '480px',
            borderRadius: '0.75rem',
            border: '1px solid hsl(217.2 32.6% 17.5%)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
          },
        },
      }}
    />
  );
}
