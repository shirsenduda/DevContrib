import 'dotenv/config';

const NOVU_API_KEY = process.env.NOVU_SECRET_KEY!;
const BASE_URL = 'https://api.novu.co/v1';
const SUBSCRIBER_ID = 'cmlmn1rdc0000lgc3yle6cn4n';

async function api(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `ApiKey ${NOVU_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

async function main() {
  // 1. Check subscriber
  console.log('=== Subscriber ===');
  const sub = await api(`/subscribers/${SUBSCRIBER_ID}`);
  if (sub.data) {
    console.log(`  Found: ${sub.data.subscriberId}`);
    console.log(`  Email: ${sub.data.email}`);
    console.log(`  Name: ${sub.data.firstName} ${sub.data.lastName || ''}`);
  } else {
    console.log('  NOT FOUND - creating subscriber...');
    const created = await api('/subscribers', 'POST', {
      subscriberId: SUBSCRIBER_ID,
      email: 'shirsendudas49@gmail.com',
      firstName: 'Shirsendu',
    });
    console.log('  Created:', created.data?.subscriberId || 'FAILED');
  }

  // 2. Check activity feed (recent notifications)
  console.log('\n=== Activity Feed (last 10) ===');
  const activity = await api('/notifications?page=0&limit=10');
  if (activity.data?.length) {
    for (const a of activity.data) {
      console.log(`  ${a.template?.name || 'unknown'} → ${a.subscriber?.subscriberId || 'unknown'} | status: ${a.status} | channel: ${a.channel}`);
      if (a.jobs?.length) {
        for (const j of a.jobs) {
          console.log(`    job: ${j.type} | status: ${j.status} | error: ${j.error || 'none'}`);
        }
      }
    }
  } else {
    console.log('  No activity found');
    console.log('  Raw:', JSON.stringify(activity).substring(0, 500));
  }

  // 3. Check in-app messages for subscriber
  console.log('\n=== In-App Messages ===');
  const messages = await api(`/subscribers/${SUBSCRIBER_ID}/messages?channel=in_app&limit=10`);
  if (messages.data?.length) {
    for (const m of messages.data) {
      console.log(`  ${m.content} | read: ${m.read} | seen: ${m.seen}`);
    }
  } else {
    console.log('  No in-app messages');
    console.log('  Raw:', JSON.stringify(messages).substring(0, 500));
  }

  // 4. Send another test notification
  console.log('\n=== Sending fresh test notification ===');
  const trigger = await api('/events/trigger', 'POST', {
    name: 'dc-pr-merged',
    to: { subscriberId: SUBSCRIBER_ID },
    payload: {
      repoFullName: 'langgenius/dify',
      issueTitle: 'Test from debug script',
      prNumber: 99999,
      prUrl: 'https://github.com/langgenius/dify/pull/99999',
    },
  });
  console.log('  Acknowledged:', trigger.data?.acknowledged);
  console.log('  Transaction ID:', trigger.data?.transactionId);

  // Wait and check again
  console.log('\n  Waiting 5 seconds...');
  await new Promise((r) => setTimeout(r, 5000));

  console.log('\n=== In-App Messages (after trigger) ===');
  const messagesAfter = await api(`/subscribers/${SUBSCRIBER_ID}/messages?channel=in_app&limit=10`);
  if (messagesAfter.data?.length) {
    for (const m of messagesAfter.data) {
      console.log(`  ${m.content} | read: ${m.read} | seen: ${m.seen}`);
    }
  } else {
    console.log('  Still no in-app messages');
    console.log('  Raw:', JSON.stringify(messagesAfter).substring(0, 500));
  }

  // 5. Check notification feed
  console.log('\n=== Notification Feed ===');
  const feed = await api(`/subscribers/${SUBSCRIBER_ID}/notifications/feed?limit=10`);
  console.log('  Count:', feed.data?.length || 0);
  if (feed.data?.length) {
    for (const n of feed.data) {
      console.log(`  ${n.content} | channel: ${n.channel}`);
    }
  } else {
    console.log('  Raw:', JSON.stringify(feed).substring(0, 500));
  }
}

main().catch(console.error);
