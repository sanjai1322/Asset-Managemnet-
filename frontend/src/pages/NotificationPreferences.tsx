import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Switch, FormControlLabel, Button, CircularProgress, Divider } from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import EmailIcon from '@mui/icons-material/Email';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import PhonelinkRingIcon from '@mui/icons-material/PhonelinkRing';
import api from '../api';
import { useToast } from '../App';
import { registerFirebaseToken, unregisterFirebaseToken } from '../firebaseClient';

const NotificationPreferences = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState({
    pref_email: true,
    pref_slack: true,
    pref_push: true
  });
  const { showToast } = useToast();

  useEffect(() => {
    fetchPrefs();
  }, []);

  const fetchPrefs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/preferences');
      setPrefs({
        pref_email: res.data.pref_email,
        pref_slack: res.data.pref_slack,
        pref_push: res.data.pref_push,
      });
    } catch (err) {
      console.error(err);
      showToast('Failed to load preferences', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrefs({ ...prefs, [e.target.name]: e.target.checked });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/users/preferences', prefs);
      
      // Handle Firebase Push Subscription changes
      if (prefs.pref_push) {
        await registerFirebaseToken();
      } else {
        await unregisterFirebaseToken();
      }

      showToast('Preferences saved successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color: '#f8fafc', mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <NotificationsActiveIcon sx={{ color: '#818cf8', fontSize: 32 }} />
        Notification Preferences
      </Typography>

      <Paper sx={{ p: 4, borderRadius: 3, background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
        <Typography variant="body1" sx={{ color: '#94a3b8', mb: 4, lineHeight: 1.6 }}>
          Choose how you want to be notified about asset allocations, maintenance updates, returns, and warranty expirations.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Email */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <EmailIcon sx={{ color: '#6366f1', mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle1" sx={{ color: '#e2e8f0', fontWeight: 600 }}>Email Notifications</Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>Receive rich HTML emails for system events.</Typography>
              </Box>
            </Box>
            <Switch checked={prefs.pref_email} onChange={handleChange} name="pref_email" color="primary" />
          </Box>

          <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.08)' }} />

          {/* Slack */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <AlternateEmailIcon sx={{ color: '#10b981', mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle1" sx={{ color: '#e2e8f0', fontWeight: 600 }}>Slack Webhooks</Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>Push notifications to your configured Slack workspace.</Typography>
              </Box>
            </Box>
            <Switch checked={prefs.pref_slack} onChange={handleChange} name="pref_slack" color="success" />
          </Box>

          <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.08)' }} />

          {/* Browser Push */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <PhonelinkRingIcon sx={{ color: '#f59e0b', mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle1" sx={{ color: '#e2e8f0', fontWeight: 600 }}>Browser Push Notifications</Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>Get instant push alerts right to your desktop or mobile browser.</Typography>
              </Box>
            </Box>
            <Switch checked={prefs.pref_push} onChange={handleChange} name="pref_push" color="warning" />
          </Box>
        </Box>

        <Box sx={{ mt: 5, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            onClick={handleSave} 
            disabled={saving}
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              fontWeight: 600,
              px: 4,
              py: 1,
              borderRadius: 2,
              textTransform: 'none'
            }}
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default NotificationPreferences;
