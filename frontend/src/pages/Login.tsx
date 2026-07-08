import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Paper, Container, Avatar, Divider, Alert } from '@mui/material';
import HexagonIcon from '@mui/icons-material/Hexagon';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { loginWithGoogle, loginMock } from '../api';

declare global {
  interface Window {
    google?: any;
  }
}

const Login = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLoginSuccess = async (response: any) => {
    setLoading(true);
    setError('');
    try {
      const data = await loginWithGoogle(response.credential);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Google Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: '218114859520-dbaogsjg65vag95fk84ktd2tosooq4vv.apps.googleusercontent.com',
          callback: handleGoogleLoginSuccess,
        });
        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInButton'),
          {
            theme: 'filled_blue',
            size: 'large',
            width: 300,
            text: 'signin_with',
            shape: 'rectangular',
          }
        );
      }
    };

    if (window.google?.accounts?.id) {
      initializeGoogleSignIn();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          initializeGoogleSignIn();
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  const handleMockLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required for Developer Login');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await loginMock(email, name || 'Developer');
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Developer login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0b0f1a 0%, #111827 50%, #0f172a 100%)',
    }}>
      <Container component="main" maxWidth="xs">
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: 2.5,
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
            }}>
              <HexagonIcon sx={{ color: '#fff', fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#f1f5f9', lineHeight: 1.1 }}>
                AssetFlow
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Management System
              </Typography>
            </Box>
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: 4.5, width: '100%', borderRadius: 4,
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(148, 163, 184, 0.08)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Avatar sx={{
                width: 48, height: 48,
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.15)',
              }}>
                <LockOutlinedIcon sx={{ color: '#818cf8' }} />
              </Avatar>
            </Box>

            <Typography variant="h5" align="center" sx={{ fontWeight: 700, color: '#f1f5f9', mb: 0.5 }}>
              Welcome Back
            </Typography>
            <Typography variant="body2" align="center" sx={{ color: '#64748b', mb: 3 }}>
              Sign in to manage your assets
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {/* Google Sign-In Button */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <div id="googleSignInButton" style={{ minHeight: '40px' }}></div>
              {loading && <Typography variant="caption" sx={{ color: '#6366f1', mt: 1 }}>Signing in...</Typography>}
            </Box>

            <Divider sx={{ my: 3, borderColor: 'rgba(148, 163, 184, 0.08)' }}>
              <Typography variant="caption" sx={{ color: '#64748b', px: 1 }}>OR DEVELOPER LOGIN</Typography>
            </Divider>

            <Box component="form" onSubmit={handleMockLogin}>
              <TextField
                margin="normal" required fullWidth
                id="email" label="Email Address" name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@acme.com"
                disabled={loading}
              />
              <TextField
                margin="normal" fullWidth
                name="name" label="Display Name (Optional)"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Developer User"
                disabled={loading}
                sx={{ mb: 2 }}
              />
              <Button
                type="submit" fullWidth variant="contained"
                disabled={loading}
                sx={{
                  mt: 1.5, py: 1.5,
                  background: 'linear-gradient(135deg, #374151, #1f2937)',
                  fontSize: '0.9rem', fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4b5563, #374151)',
                  },
                }}
              >
                Developer Sign In
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
