/**
 * Test Twitter credentials
 * Usage: tsx test_twitter.ts
 */

import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';

dotenv.config();

async function testTwitterCredentials() {
  console.log('🐦 Testing Twitter credentials...\n');

  const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY!,
    appSecret: process.env.TWITTER_API_SECRET!,
    accessToken: process.env.TWITTER_ACCESS_TOKEN!,
    accessSecret: process.env.TWITTER_ACCESS_SECRET!,
  });

  try {
    console.log('📡 Connecting to Twitter API...');
    const me = await client.v2.me();

    console.log('\n✅ SUCCESS! Twitter connection working\n');
    console.log('User Info:');
    console.log(`  Username: @${me.data.username}`);
    console.log(`  Name: ${me.data.name}`);
    console.log(`  ID: ${me.data.id}`);

    // Test permissions
    console.log('\n📝 Testing tweet permissions...');
    const testTweet = await client.v2.tweet('🧪 Test from BaseGuardian - Setting up Twitter integration');
    console.log('✅ Tweet posted successfully!');
    console.log(`   Tweet ID: ${testTweet.data.id}`);
    console.log(`   URL: https://twitter.com/${me.data.username}/status/${testTweet.data.id}`);

    console.log('\n🎉 All tests passed! Twitter is ready to use.');

  } catch (error: any) {
    console.log('\n❌ FAILED! Twitter connection error\n');
    console.log('Error details:');
    console.log(`  Message: ${error.message}`);
    console.log(`  Code: ${error.code || 'N/A'}`);

    if (error.code === 401) {
      console.log('\n💡 Solution:');
      console.log('  1. Go to https://developer.twitter.com/en/portal/dashboard');
      console.log('  2. Select your app');
      console.log('  3. Go to "Keys and tokens"');
      console.log('  4. Regenerate all tokens');
      console.log('  5. Run: ./update_twitter_credentials.sh');
    }

    if (error.code === 403) {
      console.log('\n💡 Solution:');
      console.log('  1. Go to your app settings');
      console.log('  2. Enable "Read and Write" permissions');
      console.log('  3. Regenerate Access Token');
    }

    process.exit(1);
  }
}

testTwitterCredentials();
