import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function run() {
  try {
    const sessions = await sql`SELECT * FROM payment_sessions ORDER BY created_at DESC LIMIT 10`;
    console.log('Payment sessions count:', sessions.length);
    console.log('Payment sessions:', JSON.stringify(sessions, null, 2));
  } catch (e) {
    console.error('Error fetching payment sessions:', e.message);
  }
  await sql.end();
}
run();
