/**
 * Debug Twitter credentials
 */

import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';

dotenv.config();

async function debugTwitter() {
  console.log('🔍 Debug Twitter Configuration\n');

  // Mostrar credenciales (parciales)
  console.log('Current credentials:');
  console.log(`  API_KEY: ${process.env.TWITTER_API_KEY?.substring(0, 10)}...`);
  console.log(`  API_SECRET: ${process.env.TWITTER_API_SECRET?.substring(0, 10)}...`);
  console.log(`  ACCESS_TOKEN: ${process.env.TWITTER_ACCESS_TOKEN}`);
  console.log(`  ACCESS_SECRET: ${process.env.TWITTER_ACCESS_SECRET?.substring(0, 10)}...`);
  console.log();

  // Verificar formato
  const accessToken = process.env.TWITTER_ACCESS_TOKEN || '';
  console.log('Access Token Analysis:');
  console.log(`  Length: ${accessToken.length} chars`);
  console.log(`  Format: ${accessToken.includes('-') ? 'Contains dash (✓)' : 'No dash (✗)'}`);
  console.log(`  Starts with number: ${/^\d/.test(accessToken) ? 'Yes (✓)' : 'No (✗)'}`);
  console.log();

  // Intentar conexión
  const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY!,
    appSecret: process.env.TWITTER_API_SECRET!,
    accessToken: process.env.TWITTER_ACCESS_TOKEN!,
    accessSecret: process.env.TWITTER_ACCESS_SECRET!,
  });

  try {
    console.log('Testing connection...');
    const me = await client.v2.me();
    console.log('\n✅ SUCCESS!');
    console.log(`  Username: @${me.data.username}`);
    console.log(`  ID: ${me.data.id}`);
  } catch (error: any) {
    console.log('\n❌ ERROR:');
    console.log(`  Status: ${error.code || error.statusCode}`);
    console.log(`  Message: ${error.message}`);

    if (error.data) {
      console.log(`  Details: ${JSON.stringify(error.data, null, 2)}`);
    }

    console.log('\n💡 Possible issues:');
    if (!accessToken.includes('-')) {
      console.log('  ⚠️  Access Token should contain a dash (-)');
      console.log('  ⚠️  Format should be: 1234567890-AbCdEfGhIjKlMnOp');
    }
    if (!/^\d/.test(accessToken)) {
      console.log('  ⚠️  Access Token should start with numbers (your User ID)');
    }
    console.log('  ⚠️  Make sure you generated OAuth 1.0a tokens, not OAuth 2.0');
    console.log('  ⚠️  Check app permissions are "Read and Write"');
  }
}

debugTwitter();
