import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Chip, Skeleton, Avatar, LinearProgress, Divider
} from '@mui/material';
import Grid from '@mui/material/Grid';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SpeedIcon from '@mui/icons-material/Speed';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { getPredictiveMaintenance } from '../api';

const PredictiveMaintenance = () => {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getPredictiveMaintenance();
        setFlags(data);
        if (data.length > 0) setSelectedId(0);
      } catch (e) {
        console.error('Failed to fetch predictions', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const selected = selectedId !== null ? flags[selectedId] : null;

  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return '#ef4444';
    if (score >= 0.85) return '#f59e0b';
    return '#06b6d4';
  };

  const getSuggestionColor = (suggestion: string) => {
    const s = suggestion.toLowerCase();
    if (s.includes('replace')) return { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' };
    if (s.includes('service') || s.includes('soon')) return { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.2)' };
    return { bg: 'rgba(6,182,212,0.1)', color: '#06b6d4', border: 'rgba(6,182,212,0.2)' };
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Avatar sx={{ width: 36, height: 36, background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
            <SmartToyIcon sx={{ fontSize: 20 }} />
          </Avatar>
          <Typography variant="h4" sx={{ fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AI Predictive Maintenance
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#64748b', ml: 6.5 }}>
          {flags.length} assets flagged for attention — powered by intelligent rule-based analysis
        </Typography>
      </Box>

      {loading ? (
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 3 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} height={72} sx={{ mb: 1, borderRadius: 2 }} />
              ))}
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper sx={{ p: 3 }}>
              <Skeleton height={300} sx={{ borderRadius: 2 }} />
            </Paper>
          </Grid>
        </Grid>
      ) : flags.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <AutoFixHighIcon sx={{ fontSize: 48, color: '#10b981', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#e2e8f0', mb: 1 }}>All Clear!</Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            No assets currently flagged for maintenance. Everything looks healthy.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {/* ── Flagged Assets List ── */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 2, maxHeight: 'calc(100vh - 220px)', overflow: 'auto' }}>
              <Typography variant="overline" sx={{ px: 1, color: '#475569', fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.65rem' }}>
                Flagged Assets ({flags.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                {flags.map((flag, i) => {
                  const isSelected = selectedId === i;
                  const sc = getSuggestionColor(flag.suggestion);
                  return (
                    <Box
                      key={i}
                      onClick={() => setSelectedId(i)}
                      sx={{
                        p: 2, borderRadius: 2.5, cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                        background: isSelected ? 'rgba(99,102,241,0.08)' : 'transparent',
                        border: isSelected ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                        '&:hover': {
                          background: isSelected ? 'rgba(99,102,241,0.1)' : 'rgba(148,163,184,0.04)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.85rem' }}>
                          {flag.asset_name}
                        </Typography>
                        <Chip
                          label={`${(flag.confidence_score * 100).toFixed(0)}%`}
                          size="small"
                          sx={{
                            background: `${getConfidenceColor(flag.confidence_score)}15`,
                            color: getConfidenceColor(flag.confidence_score),
                            fontWeight: 700, fontSize: '0.7rem', height: 22,
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.8 }}>
                        <WarningAmberIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          {flag.reason}
                        </Typography>
                      </Box>
                      <Chip
                        label={flag.suggestion}
                        size="small"
                        sx={{
                          background: sc.bg, color: sc.color,
                          border: `1px solid ${sc.border}`,
                          fontWeight: 500, fontSize: '0.7rem', height: 22,
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          </Grid>

          {/* ── AI Insights Panel ── */}
          <Grid size={{ xs: 12, md: 7 }}>
            {selected ? (
              <Paper sx={{ p: 3.5 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Avatar sx={{ width: 40, height: 40, background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
                    <PsychologyIcon sx={{ fontSize: 22 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#f1f5f9', lineHeight: 1.2 }}>
                      AI Insight Report
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Analysis for {selected.asset_name}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ borderColor: 'rgba(148,163,184,0.08)', mb: 3 }} />

                {/* AI Explanation */}
                <Box sx={{
                  p: 2.5, borderRadius: 3,
                  background: 'rgba(99,102,241,0.04)',
                  border: '1px solid rgba(99,102,241,0.08)',
                  mb: 3,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <SmartToyIcon sx={{ fontSize: 16, color: '#818cf8' }} />
                    <Typography variant="overline" sx={{ color: '#818cf8', fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.65rem' }}>
                      AI Recommendation
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#cbd5e1', lineHeight: 1.7, fontSize: '0.88rem' }}>
                    {selected.ai_explanation}
                  </Typography>
                </Box>

                {/* Metrics */}
                <Grid container spacing={2.5}>
                  {/* Confidence Score */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{
                      p: 2.5, borderRadius: 3,
                      background: 'rgba(148,163,184,0.03)',
                      border: '1px solid rgba(148,163,184,0.06)',
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <SpeedIcon sx={{ fontSize: 18, color: getConfidenceColor(selected.confidence_score) }} />
                        <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 500 }}>
                          Confidence Score
                        </Typography>
                      </Box>
                      <Typography variant="h4" sx={{
                        fontWeight: 700, mb: 1,
                        color: getConfidenceColor(selected.confidence_score),
                        WebkitTextFillColor: getConfidenceColor(selected.confidence_score),
                        background: 'none',
                      }}>
                        {(selected.confidence_score * 100).toFixed(0)}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={selected.confidence_score * 100}
                        sx={{
                          height: 6, borderRadius: 3,
                          background: 'rgba(148,163,184,0.1)',
                          '& .MuiLinearProgress-bar': {
                            background: getConfidenceColor(selected.confidence_score),
                            borderRadius: 3,
                          },
                        }}
                      />
                    </Box>
                  </Grid>

                  {/* Estimated Cost */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{
                      p: 2.5, borderRadius: 3,
                      background: 'rgba(148,163,184,0.03)',
                      border: '1px solid rgba(148,163,184,0.06)',
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <AttachMoneyIcon sx={{ fontSize: 18, color: '#10b981' }} />
                        <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 500 }}>
                          Est. Replacement Cost
                        </Typography>
                      </Box>
                      <Typography variant="h4" sx={{
                        fontWeight: 700,
                        color: '#10b981',
                        WebkitTextFillColor: '#10b981',
                        background: 'none',
                      }}>
                        ${selected.estimated_cost.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Based on category average
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Reason & Suggestion */}
                <Box sx={{ mt: 2.5, display: 'flex', gap: 2 }}>
                  <Box sx={{ flex: 1, p: 2, borderRadius: 2, background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.08)' }}>
                    <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
                      Flagged Reason
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#e2e8f0', mt: 0.5, fontWeight: 500 }}>
                      {selected.reason}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, p: 2, borderRadius: 2, background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.08)' }}>
                    <Typography variant="caption" sx={{ color: '#818cf8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
                      Suggested Action
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#e2e8f0', mt: 0.5, fontWeight: 500 }}>
                      {selected.suggestion}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            ) : (
              <Paper sx={{ p: 6, textAlign: 'center' }}>
                <PsychologyIcon sx={{ fontSize: 48, color: '#475569', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#64748b' }}>
                  Select an asset from the list to view AI insights
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default PredictiveMaintenance;
