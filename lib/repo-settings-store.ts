// Runtime repo settings store – mirrors Python RepoConfig table logic.
// In a production deployment you would persist this to a database.

interface RepoEntry {
  org_name: string;
  repo_name: string;
  enabled: boolean;
}

const entries: RepoEntry[] = [];

export function getRepoSettings(orgName: string): string[] {
  const rows = entries.filter(e => e.org_name === orgName && e.enabled).map(e => e.repo_name);
  if (rows.length === 0) {
    const envRepo = (process.env.GITHUB_REPO ?? '').trim();
    return envRepo ? [envRepo] : [];
  }
  return rows;
}

export function saveRepoSettings(orgName: string, repoNames: string[]): string[] {
  const normalised = [...new Set(repoNames.map(n => n.trim()).filter(Boolean))].sort();

  // Disable repos no longer in list
  entries.forEach(e => {
    if (e.org_name === orgName && !normalised.includes(e.repo_name)) {
      e.enabled = false;
    }
  });

  // Upsert
  for (const repo of normalised) {
    const existing = entries.find(e => e.org_name === orgName && e.repo_name === repo);
    if (existing) {
      existing.enabled = true;
    } else {
      entries.push({ org_name: orgName, repo_name: repo, enabled: true });
    }
  }

  return normalised;
}
