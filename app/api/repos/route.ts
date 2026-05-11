import { NextResponse } from 'next/server';
import { getMockRepos } from '@/lib/mock-data';

export function GET() {
  const repos = getMockRepos().map(r => ({
    id: r.id,
    github_id: r.github_id,
    name: r.name,
    full_name: r.full_name,
    owner: r.owner,
    description: r.description,
    language: r.language,
    created_at: r.created_at,
    last_synced_at: r.last_synced_at,
  }));
  return NextResponse.json(repos);
}
