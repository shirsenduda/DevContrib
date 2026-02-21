import 'dotenv/config';

const NOVU_API_KEY = process.env.NOVU_SECRET_KEY!;
const BASE_URL = 'https://api.novu.co/v1';

async function api(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `ApiKey ${NOVU_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (method === 'DELETE' && res.ok) return { ok: true };
  const json = await res.json();
  if (!res.ok && method !== 'GET') throw new Error(`${method} ${path}: ${res.status} - ${JSON.stringify(json)}`);
  return json;
}

async function main() {
  // Delete all existing workflows
  const res = await api('/notification-templates?page=0&limit=100');
  const all = res.data || [];
  console.log(`Deleting ${all.length} existing workflows...`);
  for (const w of all) {
    await api(`/notification-templates/${w._id}`, 'DELETE');
    console.log(`  Deleted: ${w.triggers?.[0]?.identifier}`);
  }

  await new Promise((r) => setTimeout(r, 2000));

  // Get notification group
  const groupsRes = await api('/notification-groups');
  const groupId = groupsRes.data?.[0]?._id;

  // Create with dc- prefix (guaranteed unique, no conflicts)
  const workflows = [
    {
      name: 'dc-pr-merged',
      content: 'Your PR #{{prNumber}} on {{repoFullName}} has been merged! Congratulations!',
    },
    {
      name: 'dc-pr-closed',
      content: 'Your PR #{{prNumber}} on {{repoFullName}} was closed without merging.',
    },
    {
      name: 'dc-contribution-reminder',
      content: 'You started working on "{{issueTitle}}" in {{repoFullName}} {{daysRemaining}} days ago.',
    },
    {
      name: 'dc-pr-waiting-5d',
      content: 'Your PR #{{prNumber}} on {{repoFullName}} has been waiting {{daysWaiting}} days for review.',
    },
    {
      name: 'dc-pr-waiting-10d',
      content: 'Your PR #{{prNumber}} on {{repoFullName}} has been open {{daysWaiting}} days with no review.',
    },
  ];

  console.log('\nCreating workflows with dc- prefix...');
  for (const wf of workflows) {
    const result = await api('/notification-templates', 'POST', {
      name: wf.name,
      notificationGroupId: groupId,
      active: true,
      draft: false,
      tags: ['system'],
      steps: [{ template: { type: 'in_app', content: wf.content }, active: true }],
      triggers: [{ identifier: wf.name, type: 'event', variables: [] }],
    });
    const actualId = result.data?.triggers?.[0]?.identifier;
    console.log(`  ${actualId === wf.name ? 'OK  ' : 'MISS'} ${wf.name} → ${actualId}`);
  }

  // Send a test notification
  console.log('\nSending test notification...');
  try {
    const triggerRes = await api('/events/trigger', 'POST', {
      name: 'dc-pr-merged',
      to: { subscriberId: 'cmlmn1rdc0000lgc3yle6cn4n' },
      payload: {
        repoFullName: 'langgenius/dify',
        issueTitle: 'Test notification',
        prNumber: 32341,
        prUrl: 'https://github.com/langgenius/dify/pull/32341',
      },
    });
    console.log('  Test notification sent!', triggerRes.data?.acknowledged ? 'Acknowledged' : 'Check inbox');
  } catch (e) {
    console.error('  Failed:', (e as Error).message);
  }

  console.log('\nDone! Check the bell icon on localhost:3000');
}

main().catch(console.error);
