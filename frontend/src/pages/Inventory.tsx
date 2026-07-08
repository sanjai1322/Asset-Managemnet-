import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Chip, Skeleton, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, FormControl, InputLabel, InputBase
} from '@mui/material';
import { DataGrid, GridToolbarContainer, GridToolbarExport } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { getAssets, createAsset } from '../api';
import { useToast } from '../App';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  AVAILABLE: { label: 'Available', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  ALLOCATED: { label: 'Allocated', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  IN_MAINTENANCE: { label: 'Maintenance', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  RETIRED: { label: 'Retired', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
};

const Inventory = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [warrantyFilter, setWarrantyFilter] = useState('ALL');
  const [open, setOpen] = useState(false);
  const { showToast } = useToast();
  const [newAsset, setNewAsset] = useState({
    name: '', category: 'LAPTOP', serial_number: '',
    purchase_date: '', warranty_end_date: '', status: 'AVAILABLE', condition_score: 10
  });

  const loadAssets = async () => {
    setLoading(true);
    try {
      const data = await getAssets();
      setAssets(data);
    } catch (e) {
      showToast('Failed to load assets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAssets(); }, []);

  const handleCreate = async () => {
    try {
      await createAsset(newAsset);
      setOpen(false);
      setNewAsset({ name: '', category: 'LAPTOP', serial_number: '', purchase_date: '', warranty_end_date: '', status: 'AVAILABLE', condition_score: 10 });
      showToast('Asset added successfully!', 'success');
      loadAssets();
    } catch (e) {
      showToast('Failed to add asset. Check all fields.', 'error');
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
    setWarrantyFilter('ALL');
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = search === '' ||
      asset.name.toLowerCase().includes(search.toLowerCase()) ||
      asset.serial_number.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || asset.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || asset.status === statusFilter;

    let matchesWarranty = true;
    if (warrantyFilter === 'EXPIRED') {
      if (asset.warranty_end_date) {
        const warrantyDate = new Date(asset.warranty_end_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        matchesWarranty = warrantyDate < today;
      } else {
        matchesWarranty = false;
      }
    } else if (warrantyFilter === 'EXPIRING_30') {
      if (asset.warranty_end_date) {
        const warrantyDate = new Date(asset.warranty_end_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        thirtyDaysFromNow.setHours(23, 59, 59, 999);
        matchesWarranty = warrantyDate >= today && warrantyDate <= thirtyDaysFromNow;
      } else {
        matchesWarranty = false;
      }
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesWarranty;
  });

  const CustomToolbar = () => {
    return (
      <GridToolbarContainer sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
        <Box sx={{
          display: 'flex',
          gap: 1.5,
          alignItems: 'center',
          '& .MuiButton-root': {
            color: '#818cf8',
            fontSize: '0.8rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            '&:hover': {
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
            }
          }
        }}>
          <GridToolbarExport />
        </Box>
        <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.8rem', pr: 1 }}>
          Showing {filteredAssets.length} of {assets.length} assets
        </Typography>
      </GridToolbarContainer>
    );
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70, sortable: true },
    { field: 'name', headerName: 'Asset Name', flex: 1, minWidth: 200, sortable: true },
    {
      field: 'category', headerName: 'Category', width: 160, sortable: true,
      renderCell: (params) => (
        <Chip
          label={params.value?.replace('_', ' ')}
          size="small"
          sx={{ background: 'rgba(99,102,241,0.08)', color: '#818cf8', fontWeight: 500, fontSize: '0.75rem' }}
        />
      )
    },
    { field: 'serial_number', headerName: 'Serial No.', width: 160, sortable: true },
    {
      field: 'status', headerName: 'Status', width: 140, sortable: true,
      renderCell: (params) => {
        const cfg = statusConfig[params.value] || statusConfig.AVAILABLE;
        return (
          <Chip
            label={cfg.label}
            size="small"
            sx={{
              background: cfg.bg, color: cfg.color,
              fontWeight: 600, fontSize: '0.73rem',
              border: `1px solid ${cfg.color}20`,
            }}
          />
        );
      }
    },
    {
      field: 'condition_score', headerName: 'Condition', width: 120, sortable: true,
      renderCell: (params) => {
        const score = params.value;
        const color = score >= 8 ? '#10b981' : score >= 5 ? '#f59e0b' : '#ef4444';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 50, height: 6, borderRadius: 3,
              background: 'rgba(148,163,184,0.1)',
              overflow: 'hidden',
            }}>
              <Box sx={{
                width: `${score * 10}%`, height: '100%',
                borderRadius: 3, background: color,
                transition: 'width 0.3s ease',
              }} />
            </Box>
            <Typography variant="caption" sx={{ color, fontWeight: 600 }}>
              {score}/10
            </Typography>
          </Box>
        );
      }
    },
    { field: 'purchase_date', headerName: 'Purchased', width: 120, sortable: true },
    { field: 'warranty_end_date', headerName: 'Warranty Expiry', width: 140, sortable: true },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Inventory
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Manage and track corporate hardware/software assets
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}
            sx={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', px: 3 }}
          >
            Add Asset
          </Button>
        </Box>
      </Box>

      {/* Filter Controls Row */}
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
        {/* Search */}
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1,
          background: 'rgba(148, 163, 184, 0.06)', borderRadius: 2.5,
          px: 2, py: 0.5, border: '1px solid rgba(148, 163, 184, 0.08)',
          flex: '1 1 200px', minWidth: 200
        }}>
          <SearchIcon sx={{ color: '#64748b', fontSize: 18 }} />
          <InputBase
            placeholder="Search name or serial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ color: '#e2e8f0', fontSize: '0.85rem', width: '100%' }}
          />
        </Box>

        {/* Category Filter */}
        <FormControl size="small" sx={{ minWidth: 160, flex: '1 1 120px' }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            label="Category"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="ALL">All Categories</MenuItem>
            <MenuItem value="LAPTOP">Laptop</MenuItem>
            <MenuItem value="MONITOR">Monitor</MenuItem>
            <MenuItem value="PHONE">Phone</MenuItem>
            <MenuItem value="SOFTWARE_LICENSE">Software License</MenuItem>
          </Select>
        </FormControl>

        {/* Status Filter */}
        <FormControl size="small" sx={{ minWidth: 160, flex: '1 1 120px' }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="AVAILABLE">Available</MenuItem>
            <MenuItem value="ALLOCATED">Allocated</MenuItem>
            <MenuItem value="IN_MAINTENANCE">Maintenance</MenuItem>
            <MenuItem value="RETIRED">Retired</MenuItem>
          </Select>
        </FormControl>

        {/* Warranty Filter */}
        <FormControl size="small" sx={{ minWidth: 180, flex: '1 1 140px' }}>
          <InputLabel>Warranty</InputLabel>
          <Select
            value={warrantyFilter}
            label="Warranty"
            onChange={(e) => setWarrantyFilter(e.target.value)}
          >
            <MenuItem value="ALL">All Warranty Status</MenuItem>
            <MenuItem value="EXPIRED">Expired Only</MenuItem>
            <MenuItem value="EXPIRING_30">Expiring in 30 Days</MenuItem>
          </Select>
        </FormControl>

        {/* Clear Filters Button */}
        {(search !== '' || categoryFilter !== 'ALL' || statusFilter !== 'ALL' || warrantyFilter !== 'ALL') && (
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

      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 4, border: '1px solid rgba(148, 163, 184, 0.06)' }}>
        {loading ? (
          <Box sx={{ p: 3 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} height={48} sx={{ mb: 0.5, borderRadius: 1 }} />
            ))}
          </Box>
        ) : (
          <DataGrid
            rows={filteredAssets}
            columns={columns}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
              sorting: {
                sortModel: [
                  { field: 'status', sort: 'asc' },
                  { field: 'name', sort: 'asc' },
                ],
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            slots={{ toolbar: CustomToolbar }}
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

      {/* Add Asset Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Add New Asset</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="dense" label="Asset Name" value={newAsset.name} onChange={e => setNewAsset({ ...newAsset, name: e.target.value })} />
          <FormControl fullWidth margin="dense">
            <InputLabel>Category</InputLabel>
            <Select value={newAsset.category} label="Category" onChange={e => setNewAsset({ ...newAsset, category: e.target.value })}>
              <MenuItem value="LAPTOP">Laptop</MenuItem>
              <MenuItem value="MONITOR">Monitor</MenuItem>
              <MenuItem value="PHONE">Phone</MenuItem>
              <MenuItem value="SOFTWARE_LICENSE">Software License</MenuItem>
            </Select>
          </FormControl>
          <TextField fullWidth margin="dense" label="Serial Number" value={newAsset.serial_number} onChange={e => setNewAsset({ ...newAsset, serial_number: e.target.value })} />
          <TextField fullWidth margin="dense" label="Purchase Date" type="date" slotProps={{ inputLabel: { shrink: true } }} value={newAsset.purchase_date} onChange={e => setNewAsset({ ...newAsset, purchase_date: e.target.value })} />
          <TextField fullWidth margin="dense" label="Warranty End" type="date" slotProps={{ inputLabel: { shrink: true } }} value={newAsset.warranty_end_date} onChange={e => setNewAsset({ ...newAsset, warranty_end_date: e.target.value })} />
          <TextField fullWidth margin="dense" label="Condition Score (1-10)" type="number" value={newAsset.condition_score}
            onChange={e => setNewAsset({ ...newAsset, condition_score: Math.min(10, Math.max(1, Number(e.target.value))) })}
            slotProps={{ htmlInput: { min: 1, max: 10 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: '#94a3b8' }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}
            sx={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
          >
            Save Asset
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory;
