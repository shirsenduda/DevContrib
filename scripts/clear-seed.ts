import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clearSeedData() {
  const contributions = await prisma.userContribution.deleteMany({});
  console.log('Deleted contributions:', contributions.count);

  const issues = await prisma.issue.deleteMany({});
  console.log('Deleted issues:', issues.count);

  const repos = await prisma.repository.deleteMany({});
  console.log('Deleted repositories:', repos.count);

  const scrapeLogs = await prisma.scrapeLog.deleteMany({});
  console.log('Deleted scrape logs:', scrapeLogs.count);

  console.log('\nAll seed data cleared! Database is ready for real data.');

  const repoCount = await prisma.repository.count();
  const issueCount = await prisma.issue.count();
  console.log(`Verification - Repos: ${repoCount}, Issues: ${issueCount}`);
}

clearSeedData()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
