import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import postgres from 'postgres';
import bcrypt from 'bcryptjs';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL not found in .env.local');
  process.exit(1);
}

const sql = postgres(databaseUrl, { ssl: 'require' });

async function resetPassword() {
  const email = 'tenaliexampublishers26@gmail.com';
  const newPassword = 'Admin@Tenali2026!';

  console.log(`🔄 Generating hash for password...`);
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  console.log(`🔄 Updating password in database for admin: ${email}...`);
  try {
    const result = await sql`
      UPDATE users 
      SET password_hash = ${passwordHash}
      WHERE LOWER(email) = LOWER(${email}) AND role = 'admin'
      RETURNING id, name, email, role
    `;

    if (result.length === 0) {
      console.error(`❌ Error: No admin user found with email ${email}`);
    } else {
      console.log('✅ Admin password updated successfully!');
      console.log('Updated User details:', result[0]);
      console.log(`New Login Credentials:`);
      console.log(`Username/Email: ${email}`);
      console.log(`Password: ${newPassword}`);
    }
  } catch (error) {
    console.error('❌ Database update error:', error);
  }
}

resetPassword();
