import { NextResponse } from 'next/server';
import { computeUsersUsageDashboard } from '@/lib/mock-data';

export function GET() {
  return NextResponse.json(computeUsersUsageDashboard());
}
