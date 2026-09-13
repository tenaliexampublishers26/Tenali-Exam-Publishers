import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function run() {
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
  console.log('Tables in public schema:');
  for (const t of tables) {
    const count = await sql.unsafe(`SELECT COUNT(*) FROM "${t.table_name}"`);
    console.log(`- ${t.table_name}: ${count[0].count} rows`);
  }

  console.log('\n--- Checking Users ---');
  const users = await sql`SELECT id, name, email, phone, role, created_at FROM users`;
  console.log('Users:', users);

  console.log('\n--- Checking Orders ---');
  const orders = await sql`SELECT * FROM orders`;
  console.log('Orders:', orders);

  console.log('\n--- Checking Order Items ---');
  const items = await sql`SELECT * FROM order_items`;
  console.log('Order Items:', items);

  console.log('\n--- Checking Products ---');
  const products = await sql`SELECT id, name, stock FROM products`;
  console.log('Products:', products);

  console.log('\n--- Checking Addresses ---');
  const addresses = await sql`SELECT * FROM addresses`;
  console.log('Addresses:', addresses);

  await sql.end();
}

run().catch(console.error);
