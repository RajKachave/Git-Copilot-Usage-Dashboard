'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, IconButton, Chip, useMediaQuery, useTheme,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InsightsIcon from '@mui/icons-material/Insights';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import GroupIcon from '@mui/icons-material/Group';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuIcon from '@mui/icons-material/Menu';
import GitHubIcon from '@mui/icons-material/GitHub';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { getAuthStatus } from '@/lib/api-client';

const DRAWER_WIDTH = 260;

const navItems = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'Feature Usage', path: '/feature-usage', icon: <InsightsIcon /> },
  { label: 'Users Usage', path: '/users-usage', icon: <GroupIcon /> },
  { label: 'PR Insight (AI vs Human)', path: '/prs', icon: <CallMergeIcon /> },
  { label: 'Settings', path: '/settings', icon: <SettingsIcon /> },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [staleRepoWarning, setStaleRepoWarning] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getAuthStatus()
      .then((res) => { if (!ignore) setStaleRepoWarning(res.stale_repo_warning ?? null); })
      .catch(() => { if (!ignore) setStaleRepoWarning(null); });

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { stale_repo_warning?: string } | undefined;
      setStaleRepoWarning(detail?.stale_repo_warning ?? null);
    };
    window.addEventListener('copilot-auth-status-updated', handler);
    return () => { ignore = true; window.removeEventListener('copilot-auth-status-updated', handler); };
  }, [pathname]);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <SmartToyIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
            Copilot
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
            Usage Dashboard
          </Typography>
        </Box>
      </Box>

      <List sx={{ px: 1.5, flex: 1 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <ListItemButton
              key={item.path}
              onClick={() => { router.push(item.path); setMobileOpen(false); }}
              sx={{
                borderRadius: 3, mb: 0.5, mx: 0.5, transition: 'all 0.2s ease',
                ...(isActive && {
                  background: 'linear-gradient(135deg, rgba(0,212,255,0.15) 0%, rgba(124,77,255,0.1) 100%)',
                  '& .MuiListItemIcon-root': { color: 'primary.main' },
                  '& .MuiListItemText-primary': { color: 'primary.main', fontWeight: 600 },
                }),
                '&:hover': { background: 'rgba(0,212,255,0.08)' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.9rem' }} />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Chip
          icon={<GitHubIcon sx={{ fontSize: 16 }} />}
          label="GitHub Copilot"
          size="small"
          sx={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', width: '100%' }}
        />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {isMobile && (
        <AppBar position="fixed" sx={{ bgcolor: 'background.paper', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Toolbar>
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
            <SmartToyIcon sx={{ mx: 1, color: 'primary.main' }} />
            <Typography variant="h6" noWrap>Copilot Dashboard</Typography>
          </Toolbar>
        </AppBar>
      )}

      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, bgcolor: 'background.paper', borderRight: '1px solid rgba(255,255,255,0.06)' } }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{ width: DRAWER_WIDTH, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, bgcolor: 'background.paper', borderRight: '1px solid rgba(255,255,255,0.06)' } }}
        >
          {drawer}
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 4 },
          mt: isMobile ? '64px' : 0,
          minHeight: '100vh',
          background: 'radial-gradient(ellipse at 20% 0%, rgba(0,212,255,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(124,77,255,0.04) 0%, transparent 60%)',
        }}
      >
        {staleRepoWarning && (
          <Box sx={{ mb: 3, px: 1.5, py: 1, display: 'flex', alignItems: 'center', gap: 1, borderRadius: 999, bgcolor: 'rgba(255,171,64,0.10)', border: '1px solid rgba(255,171,64,0.24)', width: 'fit-content', maxWidth: '100%' }}>
            <Chip
              icon={<WarningAmberIcon sx={{ fontSize: 14 }} />}
              label="Stale Repos"
              size="small"
              sx={{ height: 24, fontWeight: 700, color: '#ffb74d', bgcolor: 'rgba(255,171,64,0.14)', '& .MuiChip-icon': { color: '#ffb74d' } }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.78rem', lineHeight: 1.4, pr: 0.5, whiteSpace: 'normal' }}>
              {staleRepoWarning}
            </Typography>
          </Box>
        )}
        {children}
      </Box>
    </Box>
  );
}
