import { NextRequest, NextResponse } from 'next/server';
import { getMockPRs } from '@/lib/mock-data';

export function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return params.then(({ id }) => {
    const pr = getMockPRs().find(p => p.id === parseInt(id, 10));
    if (!pr) return NextResponse.json({ detail: 'PR not found' }, { status: 404 });
    return NextResponse.json(pr.files ?? []);
  });
}
