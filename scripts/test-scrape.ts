import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('GitHub token exists:', !!process.env.GITHUB_PERSONAL_ACCESS_TOKEN);
console.log('Token prefix:', process.env.GITHUB_PERSONAL_ACCESS_TOKEN?.substring(0, 8) + '...');

import { searchRepositories, getRepositoryIssues } from '../src/lib/github';

async function test() {
  console.log('\n--- Testing GitHub API ---');

  // Test 1: Search for repos
  console.log('\n1. Searching for repositories with good-first-issues...');
  try {
    const repos = await searchRepositories('stars:>1000 good-first-issues:>5 pushed:>2025-06-01', 5);
    console.log(`   Found ${repos.length} repositories:`);
    for (const repo of repos) {
      console.log(`   - ${repo.nameWithOwner} (${repo.stargazerCount} stars, ${repo.primaryLanguage?.name || 'unknown'})`);
    }

    if (repos.length > 0) {
      // Test 2: Get issues for the first repo
      const firstRepo = repos[0];
      console.log(`\n2. Fetching issues for ${firstRepo.nameWithOwner}...`);
      const issues = await getRepositoryIssues(firstRepo.owner.login, firstRepo.name);
      console.log(`   Found ${issues.length} issues:`);
      for (const issue of issues.slice(0, 5)) {
        console.log(`   - #${issue.number}: ${issue.title}`);
      }
    }
  } catch (error: any) {
    console.error('ERROR:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

test().catch(console.error);
