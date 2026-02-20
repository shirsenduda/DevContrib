import dotenv from 'dotenv';
import path from 'path';

// Load env BEFORE any other imports
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  // Dynamic import so env vars are loaded first
  const { fullSync } = await import('../src/services/github-sync');

  console.log('Starting full GitHub scrape...');
  console.log('This will search for repos and fetch their issues.');
  console.log('Please wait, this takes a few minutes.\n');

  const result = await fullSync();

  console.log('\n=== Scrape Complete ===');
  console.log(`Repos processed: ${result.reposProcessed}`);
  console.log(`Issues found: ${result.issuesFound}`);
  console.log(`Issues saved: ${result.issuesUpdated}`);

  if (result.errors.length > 0) {
    console.log(`\nErrors (${result.errors.length}):`);
    result.errors.forEach((e) => console.log(`  - ${e}`));
  }

  console.log('\nDone! Refresh your browser to see real data.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Scrape failed:', error);
    process.exit(1);
  });
