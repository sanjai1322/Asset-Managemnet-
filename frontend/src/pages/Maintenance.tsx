import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Button, Skeleton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import { getMaintenance, logMaintenance, getAssets } from '../api';
import { useToast } from '../App';

const Maintenance = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ asset_id: '', description: '', cost: '' });
  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [mData, aData] = await Promise.all([getMaintenance(), getAssets()]);
      setRecords(mData);
      setAssets(aData);
    } catch (e) {
      showToast('Failed to load maintenance records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async () => {
    try {
      await logMaintenance(Number(form.asset_id), form.description, Number(form.cost));
      setOpen(false);
      setForm({ asset_id: '', description: '', cost: '' });
      showToast('Maintenance record logged successfully!', 'success');
      loadData();
    } catch (e) {
      showToast('Failed to log maintenance', 'error');
    }
  };

  const assetMap = Object.fromEntries(assets.map(a => [a.id, a.name]));

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'asset_id', headerName: 'Asset', flex: 1, minWidth: 220,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {assetMap[params.value] || `Asset #${params.value}`}
        </Typography>
      )
    },
    { field: 'service_date', headerName: 'Service Date', width: 130 },
    { field: 'description', headerName: 'Description', flex: 1.5, minWidth: 250 },
    {
      field: 'cost', headerName: 'Cost', width: 120, align: 'right', headerAlign: 'right',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#f59e0b' }}>
          ${params.value?.toFixed(2)}
        </Typography>
      )
    },
  ];

  // Calculate total cost
  const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Maintenance Records
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            {records.length} records — Total cost: <span style={{ color: '#f59e0b', fontWeight: 600 }}>${totalCost.toFixed(2)}</span>
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}
          sx={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', px: 3 }}
        >
          Log Service
        </Button>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 3 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} height={48} sx={{ mb: 0.5, borderRadius: 1 }} />
            ))}
          </Box>
        ) : (
          <DataGrid
            rows={records}
            columns={columns}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': { background: 'rgba(148,163,184,0.04)', borderBottom: '1px solid rgba(148,163,184,0.08)' },
              '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 600, color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
              '& .MuiDataGrid-cell': { borderBottom: '1px solid rgba(148,163,184,0.04)', color: '#e2e8f0', fontSize: '0.85rem' },
              '& .MuiDataGrid-row:hover': { background: 'rgba(99,102,241,0.04)' },
              '& .MuiDataGrid-footerContainer': { borderTop: '1px solid rgba(148,163,184,0.08)' },
              '& .MuiTablePagination-root': { color: '#94a3b8' },
              '& .MuiDataGrid-filler': { display: 'none' },
            }}
          />
        )}
      </Paper>

      {/* Log Maintenance Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Log Maintenance Service</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Asset</InputLabel>
            <Select value={form.asset_id} label="Asset" onChange={e => setForm({ ...form, asset_id: e.target.value })}>
              {assets.filter(a => a.status !== 'RETIRED').map(a => (
                <MenuItem key={a.id} value={a.id}>{a.name} ({a.serial_number})</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField fullWidth margin="dense" label="Description" multiline rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <TextField fullWidth margin="dense" label="Cost ($)" type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: '#94a3b8' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={!form.asset_id || !form.description}
            sx={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
          >
            Log Service
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Maintenance;
