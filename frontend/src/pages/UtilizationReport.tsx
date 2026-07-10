import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Skeleton, Avatar, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import { getUtilizationReport } from '../api';
import { useToast } from '../App';

const UtilizationReport = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const loadReport = async () => {
      try {
        const data = await getUtilizationReport();
        setReport(data);
      } catch (e) {
        showToast('Failed to load utilization report', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadReport();
  }, []);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Avatar sx={{ width: 36, height: 36, background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
            <AssessmentIcon sx={{ fontSize: 20 }} />
          </Avatar>
          <Typography variant="h4" sx={{ fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Utilization Report
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#64748b', ml: 6.5 }}>
          Real-time metrics on asset allocation rates, idle inventory, and historical usage patterns
        </Typography>
      </Box>

      {loading ? (
        <Box>
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Grid item xs={12} md={4} key={i}>
                <Skeleton variant="rounded" height={120} />
              </Grid>
            ))}
          </Grid>
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Skeleton variant="rounded" height={320} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Skeleton variant="rounded" height={320} />
            </Grid>
          </Grid>
        </Box>
      ) : report ? (
        <Box>
          {/* Stat Cards */}
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, position: 'relative', overflow: 'hidden', background: 'rgba(15, 23, 42, 0.45)', border: '1px solid rgba(148,163,184,0.08)' }}>
                <Box sx={{ position: 'absolute', top: -10, right: -10, width: 70, height: 70, borderRadius: '50%', background: 'rgba(99,102,241,0.08)' }} />
                <Box sx={{ width: 40, height: 40, borderRadius: 2, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', mb: 2 }}>
                  <QueryStatsIcon />
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.5 }}>OVERALL ALLOCATION RATE</Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#f1f5f9' }}>{report.overall_allocated_percent.toFixed(1)}%</Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, position: 'relative', overflow: 'hidden', background: 'rgba(15, 23, 42, 0.45)', border: '1px solid rgba(148,163,184,0.08)' }}>
                <Box sx={{ position: 'absolute', top: -10, right: -10, width: 70, height: 70, borderRadius: '50%', background: 'rgba(239,68,68,0.08)' }} />
                <Box sx={{ width: 40, height: 40, borderRadius: 2, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', mb: 2 }}>
                  <HourglassEmptyIcon />
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.5 }}>IDLE ASSETS (60d+)</Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#f1f5f9' }}>{report.overall_idle_count}</Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, position: 'relative', overflow: 'hidden', background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(20px)', border: '1px solid rgba(148,163,184,0.08)' }}>
                <Box sx={{ position: 'absolute', top: -10, right: -10, width: 70, height: 70, borderRadius: '50%', background: 'rgba(6,182,212,0.08)' }} />
                <Box sx={{ width: 40, height: 40, borderRadius: 2, background: 'rgba(6,182,212,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22d3ee', mb: 2 }}>
                  <ShowChartIcon />
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.5 }}>AVG ALLOCATION DURATION</Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#f1f5f9' }}>{report.overall_avg_duration_days.toFixed(1)} <Typography component="span" variant="h5" sx={{ color: '#64748b', fontWeight: 500 }}>days</Typography></Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Charts Row */}
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            {/* Monthly Trend (Line Chart) */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, background: 'rgba(15, 23, 42, 0.45)', border: '1px solid rgba(148,163,184,0.08)', backdropFilter: 'none !important' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#e2e8f0', mb: 3 }}>
                  Allocation Trend (Last 6 Months)
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <LineChart
                      tooltip={{ trigger: 'axis' }}
                      margin={{ top: 20, right: 20, bottom: 30, left: 40 }}
                      xAxis={[{
                        scaleType: 'point',
                        data: report.trend.map((t: any) => t.month),
                        tickLabelStyle: { fill: '#94a3b8', fontSize: 11 },
                      }]}
                      yAxis={[{
                        tickLabelStyle: { fill: '#64748b', fontSize: 11 },
                      }]}
                      series={[{
                        data: report.trend.map((t: any) => t.allocations),
                        color: '#6366f1',
                        area: true,
                        label: 'Allocations Filed',
                      }]}
                      width={500}
                      height={260}
                      sx={{
                        '& .MuiAreaElement-root': {
                          fill: 'url(#gradient-area)',
                          opacity: 0.2,
                        },
                        "& .MuiChartsLegend-text": {
                          fill: "#94a3b8 !important",
                          fontSize: "11px !important",
                        }
                      }}
                    >
                      <defs>
                        <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                      </defs>
                    </LineChart>
                  </Box>
                </Paper>
              </Grid>
  
              {/* Category Breakdown (Bar Chart) */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, background: 'rgba(15, 23, 42, 0.45)', border: '1px solid rgba(148,163,184,0.08)', backdropFilter: 'none !important' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#e2e8f0', mb: 3 }}>
                    Allocation Rate & Idle Assets by Category
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <BarChart
                      tooltip={{ trigger: 'axis' }}
                      margin={{ top: 20, right: 20, bottom: 30, left: 40 }}
                      xAxis={[{
                        scaleType: 'band' as const,
                        data: report.categories.map((c: any) => c.category.replace('_', ' ')),
                        tickLabelStyle: { fill: '#94a3b8', fontSize: 10 },
                      }]}
                      yAxis={[
                        {
                          tickLabelStyle: { fill: '#64748b', fontSize: 11 },
                          label: 'Rate (%) / Idle Count',
                        }
                      ]}
                      series={[
                        {
                          data: report.categories.map((c: any) => c.allocated_percent),
                          color: '#6366f1',
                          label: 'Allocated (%)',
                        },
                        {
                          data: report.categories.map((c: any) => c.idle_count),
                          color: '#f59e0b',
                          label: 'Idle Qty',
                        }
                      ]}
                      width={500}
                      height={260}
                      borderRadius={6}
                      sx={{
                        '& .MuiBarElement-root': {
                          rx: 4,
                        },
                        "& .MuiChartsLegend-text": {
                          fill: "#94a3b8 !important",
                          fontSize: "11px !important",
                        }
                      }}
                    />
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Breakdown Table */}
          <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 4, border: '1px solid rgba(148, 163, 184, 0.06)' }}>
            <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f1f5f9' }}>
                Detailed Category Utilization Breakdown
              </Typography>
            </Box>
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ background: 'rgba(148, 163, 184, 0.02)' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.78rem' }}>Category</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.78rem' }}>Total Assets</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.78rem' }}>Allocated %</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.78rem' }}>Avg Duration</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.78rem' }}>Idle Count</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.categories.map((row: any) => (
                    <TableRow
                      key={row.category}
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                        '&:hover': { background: 'rgba(99, 102, 241, 0.02)' }
                      }}
                    >
                      <TableCell component="th" scope="row" sx={{ color: '#e2e8f0', fontWeight: 600 }}>
                        {row.category.replace('_', ' ')}
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#cbd5e1' }}>{row.total}</TableCell>
                      <TableCell align="right" sx={{ color: '#cbd5e1', fontWeight: 600 }}>
                        <Chip
                          label={`${row.allocated_percent.toFixed(1)}%`}
                          size="small"
                          sx={{
                            background: row.allocated_percent > 50 ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.12)',
                            color: row.allocated_percent > 50 ? '#10b981' : '#818cf8',
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#cbd5e1' }}>{row.avg_duration_days.toFixed(1)} days</TableCell>
                      <TableCell align="right" sx={{ color: row.idle_count > 3 ? '#f59e0b' : '#cbd5e1' }}>
                        {row.idle_count}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      ) : (
        <Typography>No data available</Typography>
      )}
    </Box>
  );
};

export default UtilizationReport;
