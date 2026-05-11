import { NextResponse } from 'next/server';
import { computePRMetricsInsights } from '@/lib/mock-data';

export function GET() {
  return NextResponse.json(computePRMetricsInsights());
}
