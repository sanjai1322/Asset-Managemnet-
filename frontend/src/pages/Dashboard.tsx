import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Skeleton, Avatar, Chip, Button, Snackbar, Alert, CircularProgress } from '@mui/material';
import Grid from '@mui/material/Grid';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import DevicesIcon from '@mui/icons-material/Devices';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import ArchiveIcon from '@mui/icons-material/Archive';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AssignmentReturnedIcon from '@mui/icons-material/AssignmentReturned';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HandymanIcon from '@mui/icons-material/Handyman';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { getStats, runWarrantyCheck } from '../api';

// Mock trend data for stat cards
const trends = [
  { label: '+12% vs last month', positive: true },
  { label: '+8% vs last month', positive: true },
  { label: '+5% vs last month', positive: true },
  { label: '-3% vs last month', positive: false },
  { label: 'Stable', positive: true },
];

// Mock recent activity
const recentActivity = [
  { icon: <SwapHorizIcon sx={{ fontSize: 18 }} />, color: '#6366f1', text: 'MacBook Pro 14" M3 allocated to Alice Chen', time: '2 hours ago' },
  { icon: <AssignmentReturnedIcon sx={{ fontSize: 18 }} />, color: '#10b981', text: 'Dell Latitude 7420 returned by Ethan Brooks', time: '5 hours ago' },
  { icon: <HandymanIcon sx={{ fontSize: 18 }} />, color: '#f59e0b', text: 'HP EliteBook 840 G7 sent to maintenance', time: '1 day ago' },
  { icon: <PersonAddIcon sx={{ fontSize: 18 }} />, color: '#06b6d4', text: 'Dell XPS 15 9530 assigned to Marcus Rivera', time: '1 day ago' },
  { icon: <SwapHorizIcon sx={{ fontSize: 18 }} />, color: '#6366f1', text: 'Samsung ViewFinity S8 allocated to Olivia Martinez', time: '2 days ago' },
  { icon: <AssignmentReturnedIcon sx={{ fontSize: 18 }} />, color: '#10b981', text: 'HP ProBook 450 G8 returned by Noah Patel', time: '3 days ago' },
  { icon: <HandymanIcon sx={{ fontSize: 18 }} />, color: '#f59e0b', text: 'Lenovo ThinkPad T14s fan cleaning completed', time: '3 days ago' },
  { icon: <PersonAddIcon sx={{ fontSize: 18 }} />, color: '#06b6d4', text: 'JetBrains license assigned to Marcus Rivera', time: '5 days ago' },
];

const categoryColors = ['#6366f1', '#06b6d4', '#f59e0b', '#10b981'];
// statusColors is defined but not used locally. Can be safely omitted.

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleRunWarrantyCheck = async () => {
    setChecking(true);
    try {
      const res = await runWarrantyCheck();
      setToast({
        open: true,
        message: `Warranty check sent — ${res.flagged_count} assets flagged.`,
        severity: 'success',
      });
    } catch (error: any) {
      console.error(error);
      setToast({
        open: true,
        message: 'Failed to run warranty check',
        severity: 'error',
      });
    } finally {
      setChecking(false);
    }
  };

  const statCards = stats ? [
    { title: 'Total Assets', value: stats.total_assets, icon: <DevicesIcon />, color: '#6366f1', bg: 'rgba(99,102,241,0.1)', trend: trends[0] },
    { title: 'Available', value: stats.available, icon: <CheckCircleIcon />, color: '#10b981', bg: 'rgba(16,185,129,0.1)', trend: trends[1] },
    { title: 'Allocated', value: stats.allocated, icon: <SwapHorizIcon />, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', trend: trends[2] },
    { title: 'In Maintenance', value: stats.in_maintenance, icon: <BuildCircleIcon />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', trend: trends[3] },
    { title: 'Retired', value: stats.retired, icon: <ArchiveIcon />, color: '#64748b', bg: 'rgba(100,116,139,0.1)', trend: trends[4] },
  ] : [];

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Dashboard Overview
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Real-time insights into your asset management system
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={checking ? <CircularProgress size={18} color="inherit" /> : <NotificationsActiveIcon />}
          onClick={handleRunWarrantyCheck}
          disabled={checking}
          sx={{
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            color: '#fff',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: 2,
            px: 2.5,
            py: 1,
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              background: 'linear-gradient(135deg, #4f46e5, #0891b2)',
              boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
              transform: 'translateY(-1px)',
            },
            '&:active': {
              transform: 'translateY(1px)',
            }
          }}
        >
          {checking ? 'Running Check...' : 'Run Warranty Check'}
        </Button>
      </Box>

      {/* ── Stat Cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={i}>
              <Paper sx={{ p: 2.5 }}>
                <Skeleton variant="rounded" width={40} height={40} sx={{ mb: 1.5 }} />
                <Skeleton width="60%" height={20} />
                <Skeleton width="40%" height={36} />
              </Paper>
            </Grid>
          ))
        ) : (
          statCards.map((card, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={i}>
              <Paper sx={{ p: 2.5, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{
                  position: 'absolute', top: -20, right: -20,
                  width: 80, height: 80, borderRadius: '50%',
                  background: card.bg, opacity: 0.5,
                }} />
                <Box sx={{
                  width: 40, height: 40, borderRadius: 2,
                  background: card.bg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: card.color, mb: 1.5,
                }}>
                  {card.icon}
                </Box>
                <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 500, mb: 0.3 }}>
                  {card.title}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#f1f5f9', WebkitTextFillColor: '#f1f5f9', background: 'none' }}>
                  {card.value}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                  {card.trend.positive ?
                    <TrendingUpIcon sx={{ fontSize: 14, color: '#10b981' }} /> :
                    <TrendingDownIcon sx={{ fontSize: 14, color: '#ef4444' }} />
                  }
                  <Typography variant="caption" sx={{ color: card.trend.positive ? '#10b981' : '#ef4444', fontWeight: 500 }}>
                    {card.trend.label}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))
        )}
      </Grid>

      {/* ── Utilization + Charts ── */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* Donut Chart — Assets by Category */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#e2e8f0', mb: 2 }}>
              Assets by Category
            </Typography>
            {loading ? (
              <Skeleton variant="circular" width={220} height={220} sx={{ mx: 'auto' }} />
            ) : stats && (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <PieChart
                  series={[{
                    data: Object.entries(stats.by_category || {}).map(([label, value]: [string, any], i: number) => ({
                      id: i,
                      value: value,
                      label: label.replace('_', ' '),
                      color: categoryColors[i % categoryColors.length],
                    })),
                    innerRadius: 60,
                    outerRadius: 100,
                    paddingAngle: 3,
                    cornerRadius: 6,
                    cx: 110,
                  }]}
                  width={380}
                  height={240}
                  sx={{
                    "& .MuiChartsLegend-text": {
                      fill: "#94a3b8 !important",
                      fontSize: "12px !important",
                    }
                  }}
                />
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Bar Chart — Assets by Status */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#e2e8f0', mb: 2 }}>
              Assets by Status
            </Typography>
            {loading ? (
              <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
            ) : stats && (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <BarChart
                  xAxis={[{
                    scaleType: 'band' as const,
                    data: ['Available', 'Allocated', 'Maintenance', 'Retired'],
                    tickLabelStyle: { fill: '#94a3b8', fontSize: 11 },
                  }]}
                  yAxis={[{
                    tickLabelStyle: { fill: '#64748b', fontSize: 11 },
                  }]}
                  series={[{
                    data: [stats.available, stats.allocated, stats.in_maintenance, stats.retired],
                    color: '#6366f1',
                  }]}
                  width={380}
                  height={240}
                  borderRadius={8}
                  sx={{
                    '& .MuiBarElement-root': {
                      rx: 6,
                    },
                  }}
                />
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* ── Utilization + Recent Activity ── */}
      <Grid container spacing={2.5}>
        {/* Utilization */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#e2e8f0', mb: 3, alignSelf: 'flex-start' }}>
              Asset Utilization
            </Typography>
            {loading ? (
              <Skeleton variant="circular" width={160} height={160} />
            ) : stats && (
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <Box sx={{
                  width: 160, height: 160, borderRadius: '50%',
                  background: `conic-gradient(#6366f1 ${stats.utilization_percent * 3.6}deg, rgba(148,163,184,0.08) 0deg)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Box sx={{
                    width: 120, height: 120, borderRadius: '50%',
                    background: 'rgba(15, 23, 42, 0.9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column',
                  }}>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#f1f5f9', lineHeight: 1 }}>
                      {stats.utilization_percent.toFixed(0)}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>Utilized</Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Activity Feed */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#e2e8f0', mb: 2 }}>
              Recent Activity
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {recentActivity.map((activity, i) => (
                <Box
                  key={i}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    py: 1.5, px: 1,
                    borderBottom: i < recentActivity.length - 1 ? '1px solid rgba(148,163,184,0.06)' : 'none',
                    borderRadius: 1.5,
                    transition: 'background 0.15s',
                    '&:hover': { background: 'rgba(148,163,184,0.04)' },
                  }}
                >
                  <Avatar sx={{
                    width: 32, height: 32,
                    background: `${activity.color}15`,
                    color: activity.color,
                  }}>
                    {activity.icon}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ color: '#e2e8f0', fontSize: '0.82rem' }} noWrap>
                      {activity.text}
                    </Typography>
                  </Box>
                  <Chip
                    label={activity.time}
                    size="small"
                    sx={{
                      background: 'rgba(148,163,184,0.06)',
                      color: '#64748b',
                      fontSize: '0.68rem',
                      height: 22,
                      flexShrink: 0,
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast(prev => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
