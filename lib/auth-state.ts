// Runtime auth state – mirrors Python backend's `settings` singleton.
// In a production deployment you would persist this to a database.

export interface AuthState {
  github_pat: string | null;
  github_org: string | null;
}

const state: AuthState = {
  github_pat: process.env.GITHUB_PAT ?? null,
  github_org: process.env.GITHUB_ORG ?? null,
};

export function getAuthState(): Readonly<AuthState> {
  return state;
}

export function setAuthState(pat: string, org: string) {
  state.github_pat = pat;
  state.github_org = org;
}
