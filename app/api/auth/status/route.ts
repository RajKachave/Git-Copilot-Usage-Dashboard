import { NextResponse } from 'next/server';
import { getAuthState } from '@/lib/auth-state';
import { getMockRepos } from '@/lib/mock-data';

function staleRepoContext(activeOrg: string | null) {
  if (!activeOrg) return { stale_repo_owners: [], stale_repo_warning: null };
  const repos = getMockRepos();
  const repoOwners = [...new Set(repos.map(r => r.owner))];
  const staleOwners = repoOwners.filter(o => o !== activeOrg);
  if (!staleOwners.length) return { stale_repo_owners: [], stale_repo_warning: null };
  const warning = `Stored repository data exists for ${staleOwners.join(', ')} while active org is ${activeOrg}. Run Sync Now to prune stale repositories.`;
  return { stale_repo_owners: staleOwners, stale_repo_warning: warning };
}

export async function GET() {
  const auth = getAuthState();
  if (!auth.github_pat) {
    return NextResponse.json({ configured: false, token_valid: false, stale_repo_owners: [], stale_repo_warning: null });
  }
  const { stale_repo_owners, stale_repo_warning } = staleRepoContext(auth.github_org);
  return NextResponse.json({
    configured: true,
    org_name: auth.github_org,
    token_valid: true,
    user_login: null,
    stale_repo_owners,
    stale_repo_warning,
  });
}
