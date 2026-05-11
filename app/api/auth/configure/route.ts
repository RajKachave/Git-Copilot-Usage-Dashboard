import { NextRequest, NextResponse } from 'next/server';
import { setAuthState } from '@/lib/auth-state';
import { getMockRepos } from '@/lib/mock-data';

export async function POST(req: NextRequest) {
  const body = await req.json() as { github_pat: string; github_org: string };
  const { github_pat, github_org } = body;

  if (!github_pat || !github_org) {
    return NextResponse.json({ error: 'github_pat and github_org are required' }, { status: 400 });
  }

  setAuthState(github_pat, github_org);

  const repos = getMockRepos();
  const repoOwners = [...new Set(repos.map(r => r.owner))];
  const staleOwners = repoOwners.filter(o => o !== github_org);
  const staleRepoWarning = staleOwners.length
    ? `Stored repository data exists for ${staleOwners.join(', ')} while active org is ${github_org}. Run Sync Now to prune stale repositories.`
    : null;

  return NextResponse.json({
    configured: true,
    org_name: github_org,
    token_valid: true,
    user_login: null,
    stale_repo_owners: staleOwners,
    stale_repo_warning: staleRepoWarning,
  });
}
