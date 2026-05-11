import { NextResponse } from 'next/server';
import { getMockRepos, getMockPRs, getMockMetrics } from '@/lib/mock-data';

export async function POST() {
  // In mock mode, simulate a successful sync
  const repos = getMockRepos();
  const prs = getMockPRs();
  const metrics = getMockMetrics();

  return NextResponse.json({
    status: 'success',
    message: 'Data sync completed successfully',
    repos_synced: repos.length,
    commits_synced: Math.floor(prs.length * 3),
    prs_synced: prs.length,
    metrics_synced: metrics.length,
  });
}
