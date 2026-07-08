import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Button, Chip, Skeleton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import AssignmentReturnedIcon from '@mui/icons-material/AssignmentReturned';
import AddIcon from '@mui/icons-material/Add';
import { getAllocations, returnAsset, getAssets, getEmployees, allocateAsset } from '../api';
import { useToast } from '../App';

const Allocations = () => {
  const [allocations, setAllocations] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [allocData, assetData, empData] = await Promise.all([
        getAllocations(),
        getAssets(),
        getEmployees(),
      ]);
      setAllocations(allocData);
      setAssets(assetData);
      setEmployees(empData);
    } catch (e) {
      showToast('Failed to load allocations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleReturn = async (id: number) => {
    try {
      await returnAsset(id);
      showToast('Asset returned successfully!', 'success');
      loadData();
    } catch (e) {
      showToast('Failed to return asset', 'error');
    }
  };

  const handleAllocate = async () => {
    try {
      await allocateAsset(Number(selectedAsset), Number(selectedEmployee));
      setOpen(false);
      setSelectedAsset('');
      setSelectedEmployee('');
      showToast('Asset allocated successfully!', 'success');
      loadData();
    } catch (e) {
      showToast('Failed to allocate asset. It may not be available.', 'error');
    }
  };

  // Build lookup maps
  const assetMap = Object.fromEntries(assets.map(a => [a.id, a.name]));
  const empMap = Object.fromEntries(employees.map(e => [e.id, e.name]));
  const availableAssets = assets.filter(a => a.status === 'AVAILABLE');

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'asset_id', headerName: 'Asset', flex: 1, minWidth: 200,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {assetMap[params.value] || `Asset #${params.value}`}
        </Typography>
      )
    },
    {
      field: 'employee_id', headerName: 'Assigned To', flex: 1, minWidth: 180,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {empMap[params.value] || `Employee #${params.value}`}
        </Typography>
      )
    },
    { field: 'assigned_date', headerName: 'Assigned', width: 130 },
    {
      field: 'returned_date', headerName: 'Status', width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Returned' : 'Active'}
          size="small"
          sx={{
            background: params.value ? 'rgba(100,116,139,0.1)' : 'rgba(16,185,129,0.12)',
            color: params.value ? '#64748b' : '#10b981',
            fontWeight: 600, fontSize: '0.73rem',
            border: `1px solid ${params.value ? '#64748b' : '#10b981'}20`,
          }}
        />
      )
    },
    {
      field: 'actions', headerName: 'Actions', width: 130, sortable: false,
      renderCell: (params) => (
        !params.row.returned_date ? (
          <Button
            variant="outlined"
            size="small"
            startIcon={<AssignmentReturnedIcon sx={{ fontSize: 16 }} />}
            onClick={() => handleReturn(params.row.id)}
            sx={{
              borderColor: 'rgba(99,102,241,0.3)',
              color: '#818cf8',
              fontSize: '0.75rem',
              py: 0.3,
              '&:hover': { borderColor: '#6366f1', background: 'rgba(99,102,241,0.08)' },
            }}
          >
            Return
          </Button>
        ) : null
      )
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Allocations
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            {allocations.filter(a => !a.returned_date).length} active allocations
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}
          sx={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', px: 3 }}
        >
          Allocate Asset
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
            rows={allocations}
            columns={columns}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            pageSizeOptions={[10, 25]}
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

      {/* Allocate Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Allocate Asset</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Asset</InputLabel>
            <Select value={selectedAsset} label="Asset" onChange={e => setSelectedAsset(e.target.value)}>
              {availableAssets.map(a => (
                <MenuItem key={a.id} value={a.id}>{a.name} ({a.serial_number})</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Employee</InputLabel>
            <Select value={selectedEmployee} label="Employee" onChange={e => setSelectedEmployee(e.target.value)}>
              {employees.map(e => (
                <MenuItem key={e.id} value={e.id}>{e.name} — {e.department}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: '#94a3b8' }}>Cancel</Button>
          <Button variant="contained" onClick={handleAllocate} disabled={!selectedAsset || !selectedEmployee}
            sx={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
          >
            Allocate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Allocations;
