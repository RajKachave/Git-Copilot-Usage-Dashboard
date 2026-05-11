import { NextResponse } from 'next/server';
import { computePRInsightsSummary } from '@/lib/mock-data';

export function GET() {
  return NextResponse.json(computePRInsightsSummary());
}
