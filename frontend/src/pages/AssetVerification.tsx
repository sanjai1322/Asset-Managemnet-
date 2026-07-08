import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Chip, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, FormControl, FormLabel,
  RadioGroup, FormControlLabel, Radio, Skeleton, Avatar, Card, CardContent, Divider
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import HelpIcon from '@mui/icons-material/Help';
import { getVerificationStatus, verifyAsset } from '../api';
import { useToast } from '../App';

const statusColors: Record<string, { color: string; bg: string }> = {
  CONFIRMED: { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  MISSING: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  DAMAGED: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  NEEDS_REVIEW: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
};

const AssetVerification = () => {
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [verifyStatus, setVerifyStatus] = useState('CONFIRMED');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await getVerificationStatus();
      setStatuses(data);
    } catch (e) {
      showToast('Failed to load asset verification status', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleOpenVerify = (asset: any) => {
    setSelectedAsset(asset);
    setVerifyStatus('CONFIRMED');
    setNotes('');
    setDialogOpen(true);
  };

  const handleVerifySubmit = async () => {
    if (!selectedAsset) return;
    setSubmitting(true);
    try {
      await verifyAsset(selectedAsset.asset_id, verifyStatus, notes);
      showToast('Asset verified successfully!', 'success');
      setDialogOpen(false);
      loadStatus();
    } catch (e) {
      showToast('Failed to verify asset', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Stat calculations
  const totalCount = statuses.length;
  const overdueCount = statuses.filter(s => s.is_overdue).length;
  const missingCount = statuses.filter(s => s.status === 'MISSING').length;
  const damagedCount = statuses.filter(s => s.status === 'DAMAGED').length;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Avatar sx={{ width: 36, height: 36, background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
            <VerifiedUserIcon sx={{ fontSize: 20 }} />
          </Avatar>
          <Typography variant="h4" sx={{ fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Asset Verification
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#64748b', ml: 6.5 }}>
          Verify physical asset existence, audits, and health conditions (90-day recurring requirement)
        </Typography>
      </Box>

      {/* Stats row */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2.5, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(20px)', border: '1px solid rgba(148,163,184,0.08)' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>TOTAL TRACKED ASSETS</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#f1f5f9', mt: 0.5 }}>{totalCount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2.5, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(20px)', border: '1px solid rgba(239,68,68,0.15)', boxShadow: overdueCount > 0 ? '0 0 16px rgba(239,68,68,0.05)' : 'none' }}>
            <Typography variant="caption" sx={{ color: overdueCount > 0 ? '#ef4444' : '#64748b', fontWeight: 600 }}>OVERDUE AUDITS (&gt;90d)</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: overdueCount > 0 ? '#ef4444' : '#f1f5f9', mt: 0.5 }}>{overdueCount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2.5, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(20px)', border: '1px solid rgba(245,158,11,0.08)' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>DAMAGED ASSETS</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b', mt: 0.5 }}>{damagedCount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2.5, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(20px)', border: '1px solid rgba(239,68,68,0.08)' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>MISSING ASSETS</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#ef4444', mt: 0.5 }}>{missingCount}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Checklist View */}
      {loading ? (
        <Grid container spacing={2.5}>
          {Array.from({ length: 6 }).map((_, idx) => (
            <Grid item xs={12} md={6} key={idx}>
              <Skeleton height={140} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2.5}>
          {statuses.map((asset) => {
            const hasStatus = !!asset.status;
            const statusConfig = asset.status ? statusColors[asset.status] : null;
            const isOverdue = asset.is_overdue;

            return (
              <Grid item xs={12} md={6} key={asset.asset_id}>
                <Card sx={{
                  background: 'rgba(15, 23, 42, 0.45)',
                  backdropFilter: 'blur(20px)',
                  border: isOverdue
                    ? '1px solid rgba(239, 68, 68, 0.25)'
                    : '1px solid rgba(148, 163, 184, 0.08)',
                  boxShadow: isOverdue ? 'inset 0 0 16px rgba(239,68,68,0.02)' : 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    borderColor: isOverdue ? 'rgba(239, 68, 68, 0.4)' : 'rgba(99, 102, 241, 0.3)',
                  }
                }}>
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f1f5f9' }}>
                          {asset.asset_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                          Serial: {asset.serial_number} • ID: #{asset.asset_id}
                        </Typography>
                      </Box>
                      {isOverdue && (
                        <Chip
                          label="OVERDUE AUDIT"
                          size="small"
                          color="error"
                          sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                        />
                      )}
                    </Box>

                    <Divider sx={{ my: 1.5, borderColor: 'rgba(148,163,184,0.08)' }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Last Verified:
                        </Typography>
                        {hasStatus && statusConfig ? (
                          <Chip
                            label={`${asset.status} (${new Date(asset.last_verified_at).toLocaleDateString()})`}
                            size="small"
                            sx={{
                              background: statusConfig.bg,
                              color: statusConfig.color,
                              fontWeight: 600,
                              fontSize: '0.73rem',
                            }}
                          />
                        ) : (
                          <Chip
                            label="Never Verified"
                            size="small"
                            sx={{
                              background: 'rgba(148,163,184,0.08)',
                              color: '#94a3b8',
                              fontWeight: 600,
                              fontSize: '0.73rem',
                            }}
                          />
                        )}
                      </Box>

                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleOpenVerify(asset)}
                        sx={{
                          borderColor: isOverdue ? 'rgba(239, 68, 68, 0.4)' : 'rgba(99, 102, 241, 0.4)',
                          color: isOverdue ? '#ef4444' : '#818cf8',
                          fontSize: '0.75rem',
                          textTransform: 'none',
                          fontWeight: 600,
                          px: 2,
                          '&:hover': {
                            background: isOverdue ? 'rgba(239, 68, 68, 0.05)' : 'rgba(99, 102, 241, 0.05)',
                            borderColor: isOverdue ? '#ef4444' : '#6366f1',
                          }
                        }}
                      >
                        Verify Asset
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Verify Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => !submitting && setDialogOpen(false)}
        slotProps={{
          paper: {
            sx: {
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(148,163,184,0.1)',
              borderRadius: 3,
              width: '100%',
              maxWidth: 450,
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#f1f5f9' }}>
          Verify Asset: {selectedAsset?.asset_name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <FormControl>
              <FormLabel sx={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.85rem', mb: 1 }}>Verification Status</FormLabel>
              <RadioGroup
                value={verifyStatus}
                onChange={(e) => setVerifyStatus(e.target.value)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1
                }}
              >
                <FormControlLabel
                  value="CONFIRMED"
                  control={<Radio sx={{ color: '#10b981', '&.Mui-checked': { color: '#10b981' } }} />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleOutlineIcon sx={{ color: '#10b981', fontSize: 18 }} />
                      <Typography variant="body2" sx={{ color: '#e2e8f0' }}>Confirmed (Found, matching records)</Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="NEEDS_REVIEW"
                  control={<Radio sx={{ color: '#3b82f6', '&.Mui-checked': { color: '#3b82f6' } }} />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <HelpIcon sx={{ color: '#3b82f6', fontSize: 18 }} />
                      <Typography variant="body2" sx={{ color: '#e2e8f0' }}>Needs Review (Requires clarification)</Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="DAMAGED"
                  control={<Radio sx={{ color: '#f59e0b', '&.Mui-checked': { color: '#f59e0b' } }} />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarningAmberIcon sx={{ color: '#f59e0b', fontSize: 18 }} />
                      <Typography variant="body2" sx={{ color: '#e2e8f0' }}>Damaged (Needs repair, auto-flags asset)</Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="MISSING"
                  control={<Radio sx={{ color: '#ef4444', '&.Mui-checked': { color: '#ef4444' } }} />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ErrorOutlineIcon sx={{ color: '#ef4444', fontSize: 18 }} />
                      <Typography variant="body2" sx={{ color: '#e2e8f0' }}>Missing (Cannot find, auto-flags asset)</Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>

            <TextField
              label="Audit Verification Notes"
              placeholder="Provide comments regarding condition, location, or user confirmation..."
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(148,163,184,0.08)' }}>
          <Button
            variant="text"
            onClick={() => setDialogOpen(false)}
            disabled={submitting}
            sx={{ color: '#94a3b8' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleVerifySubmit}
            disabled={submitting}
            sx={{
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              px: 3
            }}
          >
            Submit Audit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssetVerification;
