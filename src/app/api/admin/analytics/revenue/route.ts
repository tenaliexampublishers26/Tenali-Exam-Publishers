export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withServerCache } from '@/lib/server-cache';

const FALLBACK_REVENUE = {
  summary: {
    totalRevenue: 0,
    orderCount: 0,
    averageRevenue: 0,
    revenueGrowth: 0,
    orderGrowth: 0,
    prevTotalRevenue: 0,
    prevOrderCount: 0,
  },
  chartData: [],
  range: '30days',
  period: 'monthly',
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly'; // 'daily' | 'weekly' | 'monthly'
    const range = searchParams.get('range') || '30days'; // 'today' | 'yesterday' | '7days' | '30days' | 'thismonth' | 'lastmonth' | 'thisyear' | 'custom'
    const startStr = searchParams.get('startDate');
    const endStr = searchParams.get('endDate');

    const cacheKey = `admin-rev-${period}-${range}-${startStr || ''}-${endStr || ''}`;

    const data = await withServerCache(
      cacheKey,
      async () => {

    let currentStart = new Date();
    let currentEnd = new Date();
    let prevStart = new Date();
    let prevEnd = new Date();

    const now = new Date();

    if (range === 'today') {
      currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      prevStart = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);
      prevEnd = new Date(currentEnd.getTime() - 24 * 60 * 60 * 1000);
    } else if (range === 'yesterday') {
      currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      prevStart = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);
      prevEnd = new Date(currentEnd.getTime() - 24 * 60 * 60 * 1000);
    } else if (range === '7days') {
      currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      currentEnd = now;
      prevStart = new Date(currentStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      prevEnd = new Date(currentStart.getTime() - 1);
    } else if (range === '30days') {
      currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
      currentEnd = now;
      prevStart = new Date(currentStart.getTime() - 30 * 24 * 60 * 60 * 1000);
      prevEnd = new Date(currentStart.getTime() - 1);
    } else if (range === 'thismonth') {
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      currentEnd = now;
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, Math.max(1, now.getDate()));
    } else if (range === 'lastmonth') {
      currentStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      currentEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
    } else if (range === 'thisyear') {
      currentStart = new Date(now.getFullYear(), 0, 1);
      currentEnd = now;
      prevStart = new Date(now.getFullYear() - 1, 0, 1);
      prevEnd = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    } else if (range === 'custom' && startStr && endStr) {
      currentStart = new Date(startStr);
      currentEnd = new Date(endStr);
      const diffTime = Math.abs(currentEnd.getTime() - currentStart.getTime());
      prevStart = new Date(currentStart.getTime() - diffTime);
      prevEnd = new Date(currentStart.getTime() - 1);
    } else {
      currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
      currentEnd = now;
      prevStart = new Date(currentStart.getTime() - 30 * 24 * 60 * 60 * 1000);
      prevEnd = new Date(currentStart.getTime() - 1);
    }

    const orders = await sql`
      SELECT id, total, created_at as "createdAt"
      FROM orders
      WHERE payment_status = 'paid'
      AND created_at >= ${prevStart.toISOString()}
      AND created_at <= ${currentEnd.toISOString()}
      ORDER BY created_at ASC
    `;

    const currentOrders = orders.filter((o: any) => {
      const d = new Date(o.createdAt);
      return d >= currentStart && d <= currentEnd;
    });

    const prevOrders = orders.filter((o: any) => {
      const d = new Date(o.createdAt);
      return d >= prevStart && d <= prevEnd;
    });

    const currentTotalRevenue = currentOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total || '0'), 0);
    const currentOrderCount = currentOrders.length;
    const currentAverageRevenue = currentOrderCount > 0 ? currentTotalRevenue / currentOrderCount : 0;

    const prevTotalRevenue = prevOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total || '0'), 0);
    const prevOrderCount = prevOrders.length;

    let revenueGrowth = 0;
    if (prevTotalRevenue > 0) {
      revenueGrowth = ((currentTotalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100;
    } else if (currentTotalRevenue > 0) {
      revenueGrowth = 100;
    }

    let orderGrowth = 0;
    if (prevOrderCount > 0) {
      orderGrowth = ((currentOrderCount - prevOrderCount) / prevOrderCount) * 100;
    } else if (currentOrderCount > 0) {
      orderGrowth = 100;
    }

    const chartDataMap = new Map<string, { label: string, revenue: number, orders: number }>();

    if (period === 'daily') {
      const isShortRange = (currentEnd.getTime() - currentStart.getTime()) <= 8 * 24 * 60 * 60 * 1000;
      let dateCursor = new Date(currentStart);
      while (dateCursor <= currentEnd) {
        const key = dateCursor.toISOString().split('T')[0];
        let label = '';
        if (isShortRange) {
          label = dateCursor.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
          label = dateCursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        chartDataMap.set(key, { label, revenue: 0, orders: 0 });
        dateCursor.setDate(dateCursor.getDate() + 1);
      }

      currentOrders.forEach((o: any) => {
        const d = new Date(o.createdAt);
        const key = d.toISOString().split('T')[0];
        const existing = chartDataMap.get(key);
        if (existing) {
          existing.revenue += parseFloat(o.total || '0');
          existing.orders += 1;
        } else {
          const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          chartDataMap.set(key, { label, revenue: parseFloat(o.total || '0'), orders: 1 });
        }
      });
    } else if (period === 'weekly') {
      let dateCursor = new Date(currentStart);
      let weekNum = 1;
      while (dateCursor <= currentEnd) {
        const key = `week-${weekNum}`;
        const label = `Week ${weekNum}`;
        chartDataMap.set(key, { label, revenue: 0, orders: 0 });
        dateCursor.setDate(dateCursor.getDate() + 7);
        weekNum++;
      }

      currentOrders.forEach((o: any) => {
        const d = new Date(o.createdAt);
        const diffMs = d.getTime() - currentStart.getTime();
        const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
        const key = `week-${diffWeeks}`;
        const existing = chartDataMap.get(key);
        if (existing) {
          existing.revenue += parseFloat(o.total || '0');
          existing.orders += 1;
        } else {
          const label = `Week ${diffWeeks}`;
          chartDataMap.set(key, { label, revenue: parseFloat(o.total || '0'), orders: 1 });
        }
      });
    } else {
      let dateCursor = new Date(currentStart.getFullYear(), currentStart.getMonth(), 1);
      while (dateCursor <= currentEnd) {
        const key = `${dateCursor.getFullYear()}-${String(dateCursor.getMonth() + 1).padStart(2, '0')}`;
        const label = dateCursor.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        chartDataMap.set(key, { label, revenue: 0, orders: 0 });
        dateCursor.setMonth(dateCursor.getMonth() + 1);
      }

      currentOrders.forEach((o: any) => {
        const d = new Date(o.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const existing = chartDataMap.get(key);
        if (existing) {
          existing.revenue += parseFloat(o.total || '0');
          existing.orders += 1;
        } else {
          const label = d.toLocaleDateString('en-US', { month: 'short' });
          chartDataMap.set(key, { label, revenue: parseFloat(o.total || '0'), orders: 1 });
        }
      });
    }

    const chartData = Array.from(chartDataMap.values());

        return {
          summary: {
            totalRevenue: currentTotalRevenue,
            orderCount: currentOrderCount,
            averageRevenue: currentAverageRevenue,
            revenueGrowth,
            orderGrowth,
            prevTotalRevenue,
            prevOrderCount
          },
          chartData,
          range,
          period
        };
      },
      {
        ttl: 15_000,
        tags: ['admin-analytics', 'orders'],
        staleWhileRevalidate: true,
      }
    );

    return NextResponse.json({
      success: true,
      data: data || FALLBACK_REVENUE,
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
      },
    });

  } catch (error) {
    console.error('Error calculating revenue analytics:', error);
    return NextResponse.json({ success: true, data: FALLBACK_REVENUE }, { status: 200 });
  }
}
