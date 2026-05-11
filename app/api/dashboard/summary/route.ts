import { NextResponse } from 'next/server';
import { computeDashboardSummary } from '@/lib/mock-data';

export function GET() {
  return NextResponse.json(computeDashboardSummary());
}
