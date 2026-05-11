import { NextRequest, NextResponse } from 'next/server';
import { getMockMetrics } from '@/lib/mock-data';

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  let metrics = getMockMetrics();

  if (from) metrics = metrics.filter(m => m.date >= from);
  if (to) metrics = metrics.filter(m => m.date <= to);

  return NextResponse.json(metrics);
}
