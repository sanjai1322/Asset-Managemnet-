import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, FormControl, InputLabel, Select, MenuItem, TextField, Button, Skeleton
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import HistoryIcon from '@mui/icons-material/History';
import { getAuditLogs } from '../api';
import { useToast } from '../App';

const actionConfig: Record<string, { label: string; color: string; bg: string }> = {
  ASSET_CREATED: { label: 'Created', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  ASSET_UPDATED: { label: 'Updated', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  ASSET_ALLOCATED: { label: 'Allocated', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  ASSET_RETURNED: { label: 'Returned', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  MAINTENANCE_LOGGED: { label: 'Maintenance', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  ASSET_VERIFIED: { label: 'Verified', color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
  ASSET_RETIRED: { label: 'Retired', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

const ActivityLog = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const { showToast } = useToast();

  const loadLogs = async () => {
    setLoading(true);
    try {
      const page = paginationModel.page + 1;
      const limit = paginationModel.pageSize;
      const act = actionFilter === 'ALL' ? undefined : actionFilter;
      const start = startDate || undefined;
      const end = endDate || undefined;
      
      const data = await getAuditLogs(page, limit, act, start, end);
      setLogs(data.logs);
      setTotal(data.total);
    } catch (e) {
      showToast('Failed to load activity logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [paginationModel.page, paginationModel.pageSize, actionFilter, startDate, endDate]);

  const handleClearFilters = () => {
    setActionFilter('ALL');
    setStartDate('');
    setEndDate('');
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    {
      field: 'action',
      headerName: 'Action',
      width: 160,
      renderCell: (params) => {
        const cfg = actionConfig[params.value] || { label: params.value, color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' };
        return (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 1.2,
              py: 0.4,
              borderRadius: 2,
              background: cfg.bg,
              color: cfg.color,
              fontSize: '0.73rem',
              fontWeight: 600,
              border: `1px solid ${cfg.color}20`,
            }}
          >
            {cfg.label}
          </Box>
        );
      }
    },
    { field: 'user_name', headerName: 'User Name', width: 160 },
    { field: 'user_email', headerName: 'User Email', width: 220 },
    {
      field: 'asset_id',
      headerName: 'Asset ID',
      width: 100,
      renderCell: (params) => params.value ? `#${params.value}` : '-'
    },
    { field: 'details', headerName: 'Details', width: 340 },
    {
      field: 'timestamp',
      headerName: 'Timestamp',
      width: 180,
      renderCell: (params) => new Date(params.value).toLocaleString()
    }
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <HistoryIcon sx={{ fontSize: 32, color: '#6366f1' }} />
          <Typography variant="h4" sx={{ fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Activity Log
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#64748b', ml: 5.8 }}>
          Audit trail of all administrative actions and system events
        </Typography>
      </Box>

      {/* Filter Row */}
      <Box sx={{
        display: 'flex',
        gap: 2,
        mb: 3,
        p: 2.5,
        borderRadius: 4,
        background: 'rgba(15, 23, 42, 0.4)',
        border: '1px solid rgba(148, 163, 184, 0.06)',
        backdropFilter: 'blur(24px)',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* Action Type */}
        <FormControl size="small" sx={{ minWidth: 180, flex: '1 1 180px' }}>
          <InputLabel>Action Type</InputLabel>
          <Select
            value={actionFilter}
            label="Action Type"
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <MenuItem value="ALL">All Actions</MenuItem>
            {Object.keys(actionConfig).map(act => (
              <MenuItem key={act} value={act}>{actionConfig[act].label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Start Date */}
        <TextField
          size="small"
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ minWidth: 150, flex: '1 1 150px' }}
        />

        {/* End Date */}
        <TextField
          size="small"
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ minWidth: 150, flex: '1 1 150px' }}
        />

        {/* Clear filters */}
        {(actionFilter !== 'ALL' || startDate !== '' || endDate !== '') && (
          <Button
            variant="text"
            color="error"
            onClick={handleClearFilters}
            sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            Clear Filters
          </Button>
        )}
      </Box>

      {/* Logs Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 4, border: '1px solid rgba(148, 163, 184, 0.06)' }}>
        {loading && logs.length === 0 ? (
          <Box sx={{ p: 3 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} height={48} sx={{ mb: 0.5, borderRadius: 1 }} />
            ))}
          </Box>
        ) : (
          <DataGrid
            rows={logs}
            columns={columns}
            rowCount={total}
            loading={loading}
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 20, 50]}
            disableRowSelectionOnClick
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                background: 'rgba(148,163,184,0.04)',
                borderBottom: '1px solid rgba(148,163,184,0.08)',
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 600, color: '#94a3b8', fontSize: '0.8rem',
                textTransform: 'uppercase', letterSpacing: '0.04em',
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid rgba(148,163,184,0.04)',
                color: '#e2e8f0', fontSize: '0.85rem',
              },
              '& .MuiDataGrid-row:hover': {
                background: 'rgba(99,102,241,0.04)',
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: '1px solid rgba(148,163,184,0.08)',
              },
              '& .MuiTablePagination-root': {
                color: '#94a3b8',
              },
              '& .MuiDataGrid-filler': {
                display: 'none',
              },
            }}
          />
        )}
      </Paper>
    </Box>
  );
};

export default ActivityLog;
