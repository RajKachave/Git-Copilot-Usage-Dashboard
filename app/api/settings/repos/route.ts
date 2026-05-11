import { NextRequest, NextResponse } from 'next/server';
import { getRepoSettings, saveRepoSettings } from '@/lib/repo-settings-store';
import { getAuthState } from '@/lib/auth-state';

function resolveOrg(org: string | null): string {
  return (org ?? getAuthState().github_org ?? '').trim();
}

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const org = resolveOrg(searchParams.get('org_name'));
  if (!org) {
    return NextResponse.json({ detail: 'org_name is required' }, { status: 400 });
  }
  const repo_names = getRepoSettings(org);
  return NextResponse.json({ org_name: org, repo_names });
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { org_name?: string; repo_names: string[] };
  const org = resolveOrg(body.org_name ?? null);
  if (!org) {
    return NextResponse.json({ detail: 'org_name is required' }, { status: 400 });
  }
  const repo_names = saveRepoSettings(org, body.repo_names ?? []);
  return NextResponse.json({ org_name: org, repo_names });
}
