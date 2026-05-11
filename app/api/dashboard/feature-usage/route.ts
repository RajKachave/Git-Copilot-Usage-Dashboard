import { NextResponse } from 'next/server';
import { computeFeatureUsageDashboard } from '@/lib/mock-data';

export function GET() {
  return NextResponse.json(computeFeatureUsageDashboard());
}
