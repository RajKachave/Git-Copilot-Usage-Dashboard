import { NextRequest, NextResponse } from 'next/server';
import { computeUserDetail } from '@/lib/mock-data';

export function GET(req: NextRequest, { params }: { params: Promise<{ userLogin: string }> }) {
  return params.then(({ userLogin }) => {
    const decoded = decodeURIComponent(userLogin);
    const detail = computeUserDetail(decoded);
    if (!detail) {
      return NextResponse.json({ detail: `User '${decoded}' was not found` }, { status: 404 });
    }
    return NextResponse.json(detail);
  });
}
