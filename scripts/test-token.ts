import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
console.log('Token length:', token?.length);
console.log('Token starts with:', token?.substring(0, 4));
console.log('Token ends with:', token?.substring((token?.length || 0) - 4));

// Simple fetch to verify token
async function test() {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `token ${token}`,
      'User-Agent': 'DevContrib-Platform',
    },
  });

  console.log('\nStatus:', res.status);
  const data = await res.json();

  if (res.ok) {
    console.log('Authenticated as:', data.login);
    console.log('Token is VALID!');
  } else {
    console.log('Error:', data.message);
    console.log('Token is INVALID');
  }
}

test().catch(console.error);
