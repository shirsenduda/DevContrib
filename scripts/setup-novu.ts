import 'dotenv/config';

const NOVU_API_KEY = process.env.NOVU_SECRET_KEY!;
const BASE_URL = 'https://api.novu.co/v1';

if (!NOVU_API_KEY) {
  console.error('NOVU_SECRET_KEY is not set in .env.local');
  process.exit(1);
}

async function api(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `ApiKey ${NOVU_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`API ${method} ${path} failed: ${res.status} - ${JSON.stringify(json)}`);
  }
  return json;
}

const workflows = [
  {
    name: 'PR Merged',
    identifier: 'pr-merged',
    content: 'Your PR #{{prNumber}} on {{repoFullName}} has been merged! Congratulations!',
  },
  {
    name: 'PR Closed',
    identifier: 'pr-closed',
    content: 'Your PR #{{prNumber}} on {{repoFullName}} was closed without merging. Consider picking a new issue!',
  },
  {
    name: 'Contribution Reminder',
    identifier: 'contribution-reminder',
    content: 'You started working on "{{issueTitle}}" in {{repoFullName}} {{daysRemaining}} days ago. Keep going or consider abandoning if you\'re stuck!',
  },
  {
    name: 'PR Waiting 5 Days',
    identifier: 'pr-waiting-5d',
    content: 'Your PR #{{prNumber}} on {{repoFullName}} has been waiting for review for {{daysWaiting}} days. Check if your CI is passing and leave a polite "Ready for review!" comment.',
  },
  {
    name: 'PR Waiting 10 Days',
    identifier: 'pr-waiting-10d',
    content: 'Your PR #{{prNumber}} on {{repoFullName}} has been open for {{daysWaiting}} days with no review. Try tagging a maintainer or start a parallel contribution.',
  },
];

async function main() {
  console.log('Setting up Novu notification workflows...\n');

  // Get the default notification group
  const groupsRes = await api('/notification-groups');
  const groupId = groupsRes.data?.[0]?._id;
  if (!groupId) {
    console.error('No notification group found. Check your Novu account.');
    process.exit(1);
  }
  console.log(`Found notification group: ${groupId}\n`);

  // Check existing workflows
  const existing = await api('/notification-templates?page=0&limit=50');
  const existingIds = new Set(
    (existing.data || []).map((w: { triggers: { identifier: string }[] }) => w.triggers?.[0]?.identifier),
  );

  let created = 0;
  let skipped = 0;

  for (const wf of workflows) {
    if (existingIds.has(wf.identifier)) {
      console.log(`  SKIP  ${wf.name} (${wf.identifier}) — already exists`);
      skipped++;
      continue;
    }

    try {
      await api('/notification-templates', 'POST', {
        name: wf.name,
        notificationGroupId: groupId,
        active: true,
        draft: false,
        tags: ['system'],
        steps: [
          {
            template: {
              type: 'in_app',
              content: wf.content,
            },
            active: true,
          },
        ],
        triggers: [
          {
            identifier: wf.identifier,
            type: 'event',
            variables: [],
          },
        ],
      });
      console.log(`  OK    ${wf.name} (${wf.identifier})`);
      created++;
    } catch (e) {
      console.error(`  FAIL  ${wf.name} (${wf.identifier}):`, (e as Error).message);
    }
  }

  console.log(`\nDone! Created: ${created}, Skipped: ${skipped}`);
  console.log('Your notifications are now ready to use.');
}

main().catch(console.error);
