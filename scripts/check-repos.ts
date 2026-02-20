import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const BIG_TECH = [
  'facebook', 'google', 'microsoft', 'apple', 'amazon',
  'vercel', 'supabase', 'netlify', 'cloudflare', 'hashicorp', 'docker',
  'github', 'prisma', 'grafana', 'elastic',
  'openai', 'huggingface', 'langchain-ai',
  'vuejs', 'angular', 'sveltejs', 'remix-run', 'nuxt',
  'nodejs', 'denoland', 'django', 'laravel',
  'kubernetes', 'apache', 'cncf',
  'stripe', 'shopify', 'directus', 'nocodb', 'appwrite',
  'mongodb', 'cockroachdb',
];

async function main() {
  const repos = await prisma.repository.findMany({
    where: { isActive: true },
    select: { owner: true, fullName: true, stars: true, language: true },
    orderBy: { stars: 'desc' },
  });

  // Group by owner
  const byOwner = new Map<string, { count: number; stars: number }>();
  for (const r of repos) {
    const existing = byOwner.get(r.owner);
    if (existing) {
      existing.count++;
      existing.stars += r.stars;
    } else {
      byOwner.set(r.owner, { count: 1, stars: r.stars });
    }
  }

  // All owners sorted by stars
  const sorted = [...byOwner.entries()].sort((a, b) => b[1].stars - a[1].stars);

  console.log('\n=== ALL ACTIVE REPO OWNERS (by total stars) ===\n');
  console.log('Owner'.padEnd(28) + 'Repos'.padStart(6) + 'Stars'.padStart(12));
  console.log('-'.repeat(46));
  for (const [owner, data] of sorted) {
    console.log(owner.padEnd(28) + String(data.count).padStart(6) + String(data.stars).padStart(12));
  }
  console.log('-'.repeat(46));
  console.log(`Total: ${byOwner.size} owners, ${repos.length} repos\n`);

  // Big tech presence
  const ownerKeys = [...byOwner.keys()];
  const found = BIG_TECH.filter(org => ownerKeys.some(k => k.toLowerCase() === org));
  const missing = BIG_TECH.filter(org => !ownerKeys.some(k => k.toLowerCase() === org));

  console.log(`=== BIG TECH: ${found.length}/${BIG_TECH.length} found ===\n`);
  for (const org of found) {
    const entry = [...byOwner.entries()].find(([k]) => k.toLowerCase() === org);
    if (entry) {
      console.log(`  + ${entry[0].padEnd(25)} ${String(entry[1].count).padStart(3)} repos, ${entry[1].stars.toLocaleString()} stars`);
    }
  }

  if (missing.length > 0) {
    console.log(`\n=== MISSING (${missing.length}) ===\n`);
    console.log(`  ${missing.join(', ')}`);
  }

  // Top 10 repos by stars
  console.log('\n=== TOP 20 REPOS BY STARS ===\n');
  for (const r of repos.slice(0, 20)) {
    console.log(`  ${r.fullName.padEnd(40)} ${String(r.stars.toLocaleString()).padStart(10)}  ${r.language || 'N/A'}`);
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
