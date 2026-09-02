import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const revalidate = 5; // Fast revalidation for live notifications

export async function GET() {
  try {
    const rows = await sql`
      SELECT key, value FROM settings 
      WHERE key IN (
        'live_notification_enabled',
        'live_notification_text',
        'live_notification_badge',
        'live_notification_link',
        'live_notification_speed',
        'live_notification_direction'
      )
    `;

    const map: Record<string, string> = {};
    for (const r of rows) {
      map[r.key] = r.value;
    }

    const enabled = map.live_notification_enabled === 'true';
    const text = map.live_notification_text || 'Welcome to Tenali Exams Publishers! Latest 2026 Edition LDCE Guides for MTS, Postman & PA/SA are available now.';
    const badge = map.live_notification_badge || 'FLASH UPDATE';
    const link = map.live_notification_link || '#books';
    const speed = map.live_notification_speed || 'normal'; // 'slow' | 'normal' | 'fast'
    const direction = map.live_notification_direction || 'left-to-right'; // 'left-to-right' | 'right-to-left'

    return NextResponse.json({
      success: true,
      enabled,
      text,
      badge,
      link,
      speed,
      direction,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching live notification settings:', error);
    return NextResponse.json({
      success: false,
      enabled: false,
      text: '',
      badge: 'LIVE UPDATE',
      link: '#books',
      speed: 'normal',
      direction: 'left-to-right',
    }, { status: 200 });
  }
}
