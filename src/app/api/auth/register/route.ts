import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { id, name, identifier, password, phone } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email/Username and password are required' },
        { status: 400 }
      );
    }

    const isEmail = identifier.includes('@');
    const email = (isEmail ? identifier : `${identifier}@gmail.com`).trim().toLowerCase();
    const finalName = (name || identifier.split('@')[0]).trim();
    const cleanPhone = phone ? String(phone).trim() : null;

    // Check if user already exists
    const existingUser = await sql`
      SELECT id, name, email, phone, role, password_hash 
      FROM users 
      WHERE LOWER(email) = ${email} 
      LIMIT 1
    `;

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (existingUser.length > 0) {
      // If user exists without password_hash (e.g. created via Google OAuth), set the password & update phone
      if (!existingUser[0].password_hash) {
        const updated = await sql`
          UPDATE users 
          SET password_hash = ${passwordHash}, 
              name = COALESCE(${finalName}, name), 
              phone = COALESCE(${cleanPhone}, phone),
              updated_at = NOW()
          WHERE id = ${existingUser[0].id}
          RETURNING id, name, email, phone, role
        `;
        return NextResponse.json({ user: updated[0], message: 'Password set for existing account' }, { status: 200 });
      }

      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 }
      );
    }

    // Insert new user
    let user;
    if (id) {
      const result = await sql`
        INSERT INTO users (id, name, email, phone, password_hash, role)
        VALUES (${id}, ${finalName}, ${email}, ${cleanPhone}, ${passwordHash}, 'customer')
        ON CONFLICT (id) DO UPDATE 
        SET password_hash = EXCLUDED.password_hash, 
            name = EXCLUDED.name, 
            phone = COALESCE(EXCLUDED.phone, users.phone)
        RETURNING id, name, email, phone, role
      `;
      user = result[0];
    } else {
      const result = await sql`
        INSERT INTO users (name, email, phone, password_hash, role)
        VALUES (${finalName}, ${email}, ${cleanPhone}, ${passwordHash}, 'customer')
        RETURNING id, name, email, phone, role
      `;
      user = result[0];
    }

    return NextResponse.json({ user, message: 'Account created successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
