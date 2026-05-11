'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button, Alert,
  Chip, CircularProgress, Grid, Stack, Tooltip, IconButton, Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import SyncIcon from '@mui/icons-material/Sync';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import StorageIcon from '@mui/icons-material/Storage';
import {
  getAuthStatus, configureAuth, triggerSync, importNdjsonMetrics,
  getRepoSettings, saveRepoSettings,
} from '@/lib/api-client';
import type { AuthStatusResponse, SyncResponse, NDJSONImportResponse } from '@/types';

function publishAuthStatus(nextStatus: AuthStatusResponse) {
  window.dispatchEvent(new CustomEvent('copilot-auth-status-updated', { detail: nextStatus }));
}

interface RepoTagInputProps { repos: string[]; onChange: (repos: string[]) => void; }

function RepoTagInput({ repos, onChange }: RepoTagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addRepo = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed || repos.includes(trimmed)) return;
    onChange([...repos, trimmed]);
  }, [repos, onChange]);

  const removeRepo = useCallback((name: string) => {
    onChange(repos.filter((r) => r !== name));
  }, [repos, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addRepo(inputValue); setInputValue(''); }
    if (e.key === 'Backspace' && !inputValue && repos.length) removeRepo(repos[repos.length - 1]);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, minHeight: 56, bgcolor: 'background.paper' }}>
        {repos.length === 0 && <Typography variant="caption" color="text.disabled" sx={{ alignSelf: 'center' }}>No repositories added yet</Typography>}
        {repos.map((repo) => (
          <Chip key={repo} label={repo} size="small" onDelete={() => removeRepo(repo)}
            deleteIcon={<Tooltip title="Remove"><CloseIcon fontSize="inherit" /></Tooltip>}
            sx={{ bgcolor: 'rgba(0,212,255,0.1)', borderColor: 'primary.main', border: '1px solid', '& .MuiChip-label': { fontSize: '0.78rem', fontWeight: 600 } }}
          />
        ))}
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField fullWidth size="small" placeholder="Enter repo name, then press Enter or +"
          value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown}
          helperText="e.g. builder-studio-ui  ·  Press Enter or click + to add"
        />
        <IconButton color="primary" onClick={() => { addRepo(inputValue); setInputValue(''); }} disabled={!inputValue.trim()}
          sx={{ border: '1px solid', borderColor: 'primary.main', borderRadius: 2, px: 2, alignSelf: 'flex-start' }}>
          <AddIcon />
        </IconButton>
      </Box>
    </Box>
  );
}

interface Message { type: 'success' | 'error' | 'info'; text: string; }

export default function SettingsPage() {
  const [pat, setPat] = useState('');
  const [org, setOrg] = useState('');
  const [status, setStatus] = useState<AuthStatusResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResponse | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [copilotUsageFile, setCopilotUsageFile] = useState<File | null>(null);
  const [codeGenerationFile, setCodeGenerationFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<NDJSONImportResponse | null>(null);
  const [trackedRepos, setTrackedRepos] = useState<string[]>([]);
  const [reposSaving, setReposSaving] = useState(false);
  const [reposMessage, setReposMessage] = useState<Message | null>(null);
  const [reposLoading, setReposLoading] = useState(false);

  useEffect(() => {
    getAuthStatus()
      .then((res) => {
        setStatus(res);
        const orgName = res.org_name;
        if (orgName) {
          setOrg(orgName);
          setReposLoading(true);
          getRepoSettings(orgName)
            .then((r) => setTrackedRepos(r.repo_names || []))
            .catch(() => {})
            .finally(() => setReposLoading(false));
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true); setMessage(null);
    try {
      const res = await configureAuth({ github_pat: pat, github_org: org });
      setStatus(res); publishAuthStatus(res);
      setMessage({ type: 'success', text: 'Configuration saved successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: `Failed to save: ${(err as Error).message}` });
    } finally { setSaving(false); }
  };

  const handleSync = async () => {
    setSyncing(true); setSyncResult(null);
    try {
      const res = await triggerSync();
      setSyncResult(res);
      const statusRes = await getAuthStatus();
      setStatus(statusRes); publishAuthStatus(statusRes);
    } catch (err) {
      setSyncResult({ status: 'error', message: `Sync failed: ${(err as Error).message}` });
    } finally { setSyncing(false); }
  };

  const handleImport = async () => {
    if (!copilotUsageFile || !codeGenerationFile) return;
    setImporting(true); setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('copilot_usage_file', copilotUsageFile);
      formData.append('code_generation_file', codeGenerationFile);
      const res = await importNdjsonMetrics(formData) as NDJSONImportResponse;
      setImportResult(res);
    } catch (err) {
      setImportResult({ status: 'error', message: (err as Error).message || 'NDJSON import failed', total_records: 0, inserted_records: 0, skipped_existing_records: 0, invalid_records: 0, duplicate_records: 0, imported_dates: [] });
    } finally { setImporting(false); }
  };

  const handleSaveRepos = async () => {
    const activeOrg = org || status?.org_name;
    if (!activeOrg) { setReposMessage({ type: 'error', text: 'Please configure an organisation first.' }); return; }
    setReposSaving(true); setReposMessage(null);
    try {
      await saveRepoSettings({ org_name: activeOrg, repo_names: trackedRepos });
      setReposMessage({ type: 'success', text: `Saved ${trackedRepos.length} repositories. They will be synced next time you click "Sync Now".` });
    } catch (err) {
      setReposMessage({ type: 'error', text: (err as Error).message || 'Failed to save.' });
    } finally { setReposSaving(false); }
  };

  const PRESET_REPOS = ['builder-studio-ui', 'integration-hub', 'JazzXQAAutomation', 'terraform-azure-jaxi', 'jaxi-web', 'terraform-azure-jaxi-modules'];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Settings</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Configure GitHub authentication, tracked repositories, and data synchronization
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left column */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>GitHub Authentication</Typography>
              {status && (
                <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {status.token_valid ? (
                    <Chip icon={<CheckCircleIcon />} label={`Connected as ${status.user_login || 'user'}`} color="success" size="small" />
                  ) : status.configured ? (
                    <Chip icon={<ErrorIcon />} label="Token invalid" color="error" size="small" />
                  ) : (
                    <Chip label="Not configured" size="small" variant="outlined" />
                  )}
                </Box>
              )}
              {status?.stale_repo_warning && <Alert severity="warning" sx={{ mb: 2 }}>{status.stale_repo_warning}</Alert>}
              <TextField fullWidth label="Personal Access Token (PAT)" type="password" value={pat}
                onChange={(e) => setPat(e.target.value)} placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" sx={{ mb: 2 }}
                helperText="Requires scopes: manage_billing:copilot, read:org, repo" />
              <TextField fullWidth label="GitHub Organization" value={org} onChange={(e) => setOrg(e.target.value)} placeholder="your-org-name" sx={{ mb: 3 }} />
              {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}
              <Button variant="contained" startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />}
                onClick={handleSave} disabled={saving || !pat || !org} fullWidth>
                {saving ? 'Saving…' : 'Save Configuration'}
              </Button>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <StorageIcon color="primary" fontSize="small" />
                <Typography variant="h6" fontWeight={600}>Tracked Repositories</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add the repository names you want to sync PRs and commits from. These are combined with any repo configured in your <code>.env</code> file.
              </Typography>
              <Box sx={{ mb: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,193,7,0.06)', border: '1px solid rgba(255,193,7,0.2)' }}>
                <Typography variant="caption" color="text.secondary">
                  <strong>Default repos from .env:</strong>&nbsp;<code>builder-studio-service</code>&nbsp;·&nbsp;Add your org repos below and click Save.
                </Typography>
              </Box>
              {reposLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={24} /></Box>
              ) : (
                <RepoTagInput repos={trackedRepos} onChange={setTrackedRepos} />
              )}
              {reposMessage && <Alert severity={reposMessage.type} sx={{ mt: 2, mb: 1 }}>{reposMessage.text}</Alert>}
              <Button variant="contained" startIcon={reposSaving ? <CircularProgress size={18} /> : <SaveIcon />}
                onClick={handleSaveRepos} disabled={reposSaving || reposLoading} fullWidth sx={{ mt: 2 }}>
                {reposSaving ? 'Saving repos…' : 'Save Repositories'}
              </Button>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary">
                <strong>Pre-configured repos:</strong>&nbsp;{PRESET_REPOS.join(' · ')}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {PRESET_REPOS.map((name) => (
                  <Chip key={name} label={name} size="small" variant="outlined"
                    onClick={() => { if (!trackedRepos.includes(name)) setTrackedRepos([...trackedRepos, name]); }}
                    sx={{ cursor: 'pointer', fontSize: '0.7rem' }} />
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Click a chip above to quickly add it to your tracked list
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Right column */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>Data Synchronization</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Manually trigger a full data sync from GitHub. This fetches repositories, Copilot metrics, commits, and pull requests for <strong>all tracked repos</strong>.
              </Typography>
              <Button variant="contained" startIcon={syncing ? <CircularProgress size={18} /> : <SyncIcon />}
                onClick={handleSync} disabled={syncing} fullWidth sx={{ mb: 3 }}>
                {syncing ? 'Syncing…' : 'Sync Now'}
              </Button>
              {syncResult && <Alert severity={syncResult.status === 'error' ? 'error' : 'success'} sx={{ mb: 2 }}>{syncResult.message}</Alert>}
              {syncResult && syncResult.status === 'success' && (
                <Box sx={{ mt: 1 }}>
                  <Grid container spacing={1}>
                    {[
                      { label: 'Repos', value: syncResult.repos_synced },
                      { label: 'Commits', value: syncResult.commits_synced },
                      { label: 'PRs', value: syncResult.prs_synced },
                    ].map((s) => (
                      <Grid key={s.label} size={6}>
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(0,212,255,0.06)', textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                          <Typography variant="h6" fontWeight={700} sx={{ color: 'primary.main' }}>{s.value || 0}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Manual NDJSON Import</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload both GitHub export files when API sync is unavailable. Existing dates are not overwritten.
              </Typography>
              <Button component="label" variant="outlined" fullWidth sx={{ mb: 1.5 }}>
                {copilotUsageFile ? `copilot-usage: ${copilotUsageFile.name}` : 'Select copilot-usage.ndjson'}
                <input type="file" hidden accept=".ndjson,application/x-ndjson,application/json" onChange={(e) => setCopilotUsageFile(e.target.files?.[0] || null)} />
              </Button>
              <Button component="label" variant="outlined" fullWidth sx={{ mb: 2 }}>
                {codeGenerationFile ? `code-generation: ${codeGenerationFile.name}` : 'Select code-generation.ndjson'}
                <input type="file" hidden accept=".ndjson,application/x-ndjson,application/json" onChange={(e) => setCodeGenerationFile(e.target.files?.[0] || null)} />
              </Button>
              <Button variant="contained" startIcon={importing ? <CircularProgress size={18} /> : <UploadFileIcon />}
                onClick={handleImport} disabled={importing || !copilotUsageFile || !codeGenerationFile} fullWidth sx={{ mb: 2 }}>
                {importing ? 'Importing…' : 'Import NDJSON Data'}
              </Button>
              {importResult && <Alert severity={importResult.status === 'error' ? 'error' : 'success'} sx={{ mb: 2 }}>{importResult.message}</Alert>}
              {importResult && importResult.status === 'success' && (
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  {[
                    { label: 'Inserted', value: importResult.inserted_records },
                    { label: 'Skipped Existing', value: importResult.skipped_existing_records },
                    { label: 'Invalid', value: importResult.invalid_records },
                    { label: 'Duplicates', value: importResult.duplicate_records },
                  ].map((s) => (
                    <Grid key={s.label} size={6}>
                      <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(0,212,255,0.06)', textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                        <Typography variant="h6" fontWeight={700} sx={{ color: 'primary.main' }}>{s.value || 0}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>About</Typography>
              <Typography variant="body2" color="text.secondary">
                This dashboard provides analytics on GitHub Copilot usage across your organization. It integrates with the GitHub Copilot Metrics API and Usage Metrics API to provide insights into AI-assisted development vs human-written code.
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {['Next.js', 'TypeScript', 'Material UI', 'Recharts', 'Mock Data'].map((t) => (
                  <Chip key={t} label={t} size="small" variant="outlined" />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
