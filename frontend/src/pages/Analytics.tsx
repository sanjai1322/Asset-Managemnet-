import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Paper, Alert } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import api from '../api';
import { useToast } from '../App';

const Analytics = () => {
  const [iframeUrl, setIframeUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const dashboardId = 2;

  useEffect(() => {
    fetchMetabaseUrl();
  }, []);

  const fetchMetabaseUrl = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/analytics/metabase-url/${dashboardId}`);
      if (res.data.url) {
        setIframeUrl(res.data.url);
      } else {
        setError('No URL returned from server.');
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 500) {
        setError("Metabase is not configured yet. Please provide the METABASE_SECRET_KEY in the backend .env file.");
      } else {
        setError("Failed to load Analytics Dashboard.");
      }
      showToast('Failed to load Enterprise Analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '80vh' }}>
      <Typography variant="h5" sx={{ fontWeight: 800, color: '#f8fafc', mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <AssessmentIcon sx={{ color: '#0ea5e9', fontSize: 28 }} />
        Enterprise Analytics
      </Typography>

      <Paper 
        sx={{ 
          flex: 1,
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: 3, 
          overflow: 'hidden',
          background: 'rgba(15, 23, 42, 0.4)', 
          border: '1px solid rgba(148, 163, 184, 0.1)',
          position: 'relative'
        }}
      >
        {loading && (
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Box sx={{ p: 4 }}>
            <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>{error}</Alert>
          </Box>
        )}

        {iframeUrl && !error && (
          <iframe
            src={iframeUrl}
            frameBorder={0}
            width="100%"
            height="100%"
            allowTransparency
            style={{ flex: 1, minHeight: 600, visibility: loading ? 'hidden' : 'visible' }}
            title="Enterprise Analytics"
          />
        )}
      </Paper>
    </Box>
  );
};

export default Analytics;
