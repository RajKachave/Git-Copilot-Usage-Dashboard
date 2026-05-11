import { NextResponse } from 'next/server';
import { computeDashboardTrends, getMockMetrics } from '@/lib/mock-data';

export function GET() {
  const metrics = getMockMetrics();
  if (!metrics.length) {
    return NextResponse.json({ total_active_users: 0, total_engaged_users: 0, languages: [], editors: [] });
  }
  const { languages, editors } = computeDashboardTrends();
  const maxActiveUsers = Math.max(...metrics.map(m => m.total_active_users));
  const maxEngagedUsers = Math.max(...metrics.map(m => m.total_engaged_users));
  return NextResponse.json({ total_active_users: maxActiveUsers, total_engaged_users: maxEngagedUsers, languages, editors });
}
