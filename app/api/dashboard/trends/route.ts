import { NextResponse } from 'next/server';
import { computeDashboardTrends } from '@/lib/mock-data';

export function GET() {
  return NextResponse.json(computeDashboardTrends());
}
