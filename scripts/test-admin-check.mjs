import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres.xsidvgynolsenmdnudqm:Tenali%402026@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require';
const sql = postgres(databaseUrl, { ssl: 'require', prepare: false });

async function run() {
  try {
    const userId = '141c62dd-8375-4cf3-bc85-d49d8a9fef50';
    const name = 'rayudusaikiran02';
    const email = 'rayudusaikiran02@gmail.com';
    const phone = '9398845947';

    const adminCheck = await sql`SELECT * FROM users WHERE id = ${userId} AND role = 'admin'`;
    console.log('adminCheck count:', adminCheck.length);

    await sql`
      UPDATE users SET 
        name = COALESCE(${name}, name),
        email = COALESCE(${email}, email),
        phone = COALESCE(${phone}, phone),
        updated_at = NOW()
      WHERE id = ${userId}
    `;

    const updated = await sql`SELECT id, name, email, phone, role FROM users WHERE id = ${userId}`;
    console.log('After update:', updated[0]);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}
run();
