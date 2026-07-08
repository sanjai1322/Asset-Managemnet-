import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, Skeleton } from '@mui/material';
import Grid from '@mui/material/Grid';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import EmailIcon from '@mui/icons-material/Email';
import RefreshIcon from '@mui/icons-material/Refresh';
import PreviewIcon from '@mui/icons-material/Preview';
import { getSentEmails } from '../api';
import { useToast } from '../App';

interface SentEmailRow {
  id: number;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
}

const SentEmails = () => {
  const [emails, setEmails] = useState<SentEmailRow[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<SentEmailRow | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const data = await getSentEmails();
      const mapped = data.map((email: any, idx: number) => ({
        ...email,
        id: idx,
      }));
      setEmails(mapped);
      if (mapped.length > 0) {
        setSelectedEmail(mapped[0]);
      } else {
        setSelectedEmail(null);
      }
    } catch (error) {
      showToast('Failed to fetch sent emails log', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const columns: GridColDef[] = [
    { field: 'timestamp', headerName: 'Timestamp', width: 160 },
    { field: 'to', headerName: 'Recipient', flex: 1, minWidth: 160 },
    { field: 'subject', headerName: 'Subject', flex: 1.2, minWidth: 180 },
    {
      field: 'actions',
      headerName: 'Preview',
      width: 90,
      sortable: false,
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          startIcon={<PreviewIcon sx={{ fontSize: 14 }} />}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedEmail(params.row as SentEmailRow);
          }}
          sx={{
            textTransform: 'none',
            fontSize: '0.75rem',
            borderColor: 'rgba(99, 102, 241, 0.3)',
            color: '#818cf8',
            '&:hover': {
              borderColor: '#6366f1',
              background: 'rgba(99, 102, 241, 0.08)',
            }
          }}
        >
          View
        </Button>
      )
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Sent Emails Log
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Monitor and preview automated email notifications sent in real-time
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchEmails}
          sx={{
            borderColor: 'rgba(148, 163, 184, 0.2)',
            color: '#94a3b8',
            textTransform: 'none',
            borderRadius: 2,
            '&:hover': {
              borderColor: 'rgba(148, 163, 184, 0.4)',
              background: 'rgba(148, 163, 184, 0.04)',
            }
          }}
        >
          Refresh Log
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Email list column */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ width: '100%', overflow: 'hidden', height: 600, display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              <Box sx={{ p: 3, flex: 1 }}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton key={i} height={48} sx={{ mb: 0.5, borderRadius: 1 }} />
                ))}
              </Box>
            ) : (
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <DataGrid
                  rows={emails}
                  columns={columns}
                  pageSizeOptions={[10, 25, 50]}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 10 } },
                  }}
                  onRowClick={(params) => setSelectedEmail(params.row as SentEmailRow)}
                  disableRowSelectionOnClick
                  getRowClassName={(params) =>
                    selectedEmail && params.row.id === selectedEmail.id ? 'super-selected-row' : ''
                  }
                  sx={{
                    border: 'none',
                    '& .MuiDataGrid-row:hover': {
                      backgroundColor: 'rgba(148, 163, 184, 0.04)',
                      cursor: 'pointer',
                    },
                    '& .super-selected-row': {
                      backgroundColor: 'rgba(99, 102, 241, 0.15) !important',
                      borderLeft: '3px solid #6366f1',
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      background: 'rgba(15, 23, 42, 0.4)',
                      borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
                    },
                    '& .MuiDataGrid-footerContainer': {
                      borderTop: '1px solid rgba(148, 163, 184, 0.08)',
                    }
                  }}
                />
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Email Preview details column */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ height: 600, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(148, 163, 184, 0.08)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <EmailIcon sx={{ color: '#818cf8' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#f1f5f9' }}>
                HTML Preview
              </Typography>
            </Box>

            {selectedEmail ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                {/* Meta details */}
                <Box sx={{ p: 2.5, background: 'rgba(15, 23, 42, 0.2)', borderBottom: '1px solid rgba(148, 163, 184, 0.06)' }}>
                  <Box sx={{ display: 'flex', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b', width: 80 }}>To:</Typography>
                    <Typography variant="body2" sx={{ color: '#e2e8f0', fontWeight: 500 }}>{selectedEmail.to}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b', width: 80 }}>Subject:</Typography>
                    <Typography variant="body2" sx={{ color: '#f1f5f9', fontWeight: 600 }}>{selectedEmail.subject}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b', width: 80 }}>Sent At:</Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem' }}>{selectedEmail.timestamp}</Typography>
                  </Box>
                </Box>

                {/* HTML Iframe */}
                <Box sx={{ flex: 1, minHeight: 0, p: 1, background: '#090d16' }}>
                  <iframe
                    title="email-body-preview"
                    srcDoc={selectedEmail.body}
                    sandbox="allow-same-origin"
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      borderRadius: '8px',
                      background: 'transparent',
                    }}
                  />
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, p: 3 }}>
                <EmailIcon sx={{ fontSize: 48, color: 'rgba(148, 163, 184, 0.15)', mb: 2 }} />
                <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center' }}>
                  No email selected.<br />Select an email from the log to display its live HTML body.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SentEmails;
