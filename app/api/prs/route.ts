import { NextRequest, NextResponse } from 'next/server';
import { getMockPRs } from '@/lib/mock-data';

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') ?? '200', 10);
  const prs = getMockPRs().slice(0, limit);
  return NextResponse.json(prs);
}
