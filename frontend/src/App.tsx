import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import {
  ThemeProvider, CssBaseline, Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, IconButton, Avatar, Badge, Menu, MenuItem,
  Snackbar, Alert, InputBase, Divider, Tooltip, Slide, Paper, Button
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory2';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BuildIcon from '@mui/icons-material/Build';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SearchIcon from '@mui/icons-material/Search';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HexagonIcon from '@mui/icons-material/Hexagon';
import EmailIcon from '@mui/icons-material/Email';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import theme from './theme';
import { getSentEmails, sendChatMessage } from './api';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Allocations from './pages/Allocations';
import Maintenance from './pages/Maintenance';
import PredictiveMaintenance from './pages/PredictiveMaintenance';
import SentEmails from './pages/SentEmails';
import ActivityLog from './pages/ActivityLog';
import AssetVerification from './pages/AssetVerification';
import UtilizationReport from './pages/UtilizationReport';
import NotificationPreferences from './pages/NotificationPreferences';
import Analytics from './pages/Analytics';

import HistoryIcon from '@mui/icons-material/History';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AssessmentIcon from '@mui/icons-material/Assessment';

const drawerWidth = 260;

// ─── Toast Context ─────────────────────────────────────────────────
type ToastSeverity = 'success' | 'error' | 'warning' | 'info';
interface ToastContextType {
  showToast: (message: string, severity?: ToastSeverity) => void;
}
const ToastContext = createContext<ToastContextType>({ showToast: () => {} });
export const useToast = () => useContext(ToastContext);

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<ToastSeverity>('success');

  const showToast = useCallback((msg: string, sev: ToastSeverity = 'success') => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setOpen(false)}
          severity={severity}
          variant="filled"
          sx={{
            borderRadius: 3,
            fontWeight: 600,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};

// ─── Mock Notifications ────────────────────────────────────────────
const mockNotifications = [
  { id: 1, type: 'warning', title: 'Warranty Expiring Soon', message: 'Dell Latitude 7420 warranty expires in 12 days', time: '2h ago' },
  { id: 2, type: 'error', title: 'Asset Return Overdue', message: 'MacBook Air 15" assigned to Olivia Martinez is overdue', time: '5h ago' },
  { id: 3, type: 'success', title: 'Maintenance Completed', message: 'HP EliteBook 840 G7 repair completed successfully', time: '1d ago' },
  { id: 4, type: 'info', title: 'New Asset Registered', message: 'MacBook Pro 14" M3 added to inventory', time: '1d ago' },
  { id: 5, type: 'warning', title: 'Low Condition Score', message: 'iPhone 12 Mini condition dropped to 3/10', time: '2d ago' },
  { id: 6, type: 'success', title: 'Asset Allocated', message: 'Dell XPS 15 9530 assigned to Marcus Rivera', time: '3d ago' },
  { id: 7, type: 'info', title: 'License Renewal', message: 'Tableau Desktop license renewal in 50 days', time: '3d ago' },
];

const notifIcons: Record<string, React.ReactNode> = {
  warning: <WarningAmberIcon sx={{ color: '#f59e0b', fontSize: 20 }} />,
  error: <ErrorOutlineIcon sx={{ color: '#ef4444', fontSize: 20 }} />,
  success: <CheckCircleOutlineIcon sx={{ color: '#10b981', fontSize: 20 }} />,
  info: <InfoOutlinedIcon sx={{ color: '#6366f1', fontSize: 20 }} />,
};

// ─── Page Titles ───────────────────────────────────────────────────
const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/inventory': 'Inventory',
  '/allocations': 'Allocations',
  '/maintenance': 'Maintenance',
  '/predictive': 'AI Predictive Maintenance',
  '/sent-emails': 'Sent Emails Log',
  '/audit/logs': 'Activity Audit Log',
  '/audit/verification': 'Asset Verification Checklist',
  '/audit/utilization': 'Utilization Report',
  '/analytics': 'Enterprise Analytics',
  '/settings/notifications': 'Notification Preferences',
};

// ─── Layout ────────────────────────────────────────────────────────
const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [avatarAnchor, setAvatarAnchor] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchRealNotifications = useCallback(async () => {
    try {
      const data = await getSentEmails();
      const mapped = data.map((email: any, idx: number) => {
        let type = 'info';
        const subjectLower = email.subject.toLowerCase();
        if (subjectLower.includes('assigned') || subjectLower.includes('allocated')) {
          type = 'success';
        } else if (subjectLower.includes('return')) {
          type = 'info';
        } else if (subjectLower.includes('maintenance')) {
          type = 'warning';
        } else if (subjectLower.includes('warranty') || subjectLower.includes('expiry')) {
          type = 'error';
        }

        // Clean HTML tags and inline styles for preview snippet
        const plainText = email.body
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .replace(/AssetFlow/g, '')
          .trim();

        const cleanMessage = plainText.length > 90 ? plainText.substring(0, 90) + "..." : plainText;

        return {
          id: idx,
          type,
          title: email.subject,
          message: cleanMessage,
          time: email.timestamp
        };
      });
      mapped.reverse();
      setNotifications(mapped);
    } catch (err) {
      console.error("Failed to fetch real notifications", err);
    }
  }, []);

  React.useEffect(() => {
    fetchRealNotifications();
    const interval = setInterval(fetchRealNotifications, 8000);
    return () => clearInterval(interval);
  }, [fetchRealNotifications]);

  // ─── Chatbot States & Handlers ───
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>(() => {
    try {
      const saved = sessionStorage.getItem('chat_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem('chat_history', JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatOpen]);

  const handleSend = async (text: string) => {
    if (!text.trim() || chatLoading) return;
    const userMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setChatInput('');
    setChatLoading(true);

    try {
      const historyPayload = updatedMessages
        .slice(-7, -1)
        .map(msg => ({ role: msg.role, content: msg.content }));

      const response = await sendChatMessage(text, historyPayload);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.reply,
        source: response.source
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I ran into an error communicating with the server. Please check your connection and try again.",
        source: "rules"
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const starterPrompts = [
    "Which assets need maintenance?",
    "How many laptops are allocated?",
    "Any warranties expiring soon?",
    "Give me a utilization summary."
  ];

  // Retrieve user details from localStorage
  const user = (() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  })();

  const userDisplayName = user?.name || 'User';
  const userEmail = user?.email || 'user@example.com';
  const userPicture = user?.picture || '';
  const userRole = user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Admin';

  const userInitials = userDisplayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
    { text: 'Allocations', icon: <AssignmentIcon />, path: '/allocations' },
    { text: 'Maintenance', icon: <BuildIcon />, path: '/maintenance' },
    { text: 'AI Predictive', icon: <SmartToyIcon />, path: '/predictive' },
    { text: 'Enterprise Analytics', icon: <AssessmentIcon />, path: '/analytics' },
    { text: 'Sent Emails', icon: <EmailIcon />, path: '/sent-emails' },
  ];

  const auditMenuItems = [
    { text: 'Activity Log', icon: <HistoryIcon />, path: '/audit/logs' },
    { text: 'Asset Verification', icon: <VerifiedUserIcon />, path: '/audit/verification' },
    { text: 'Utilization Report', icon: <AssessmentIcon />, path: '/audit/utilization' },
    { text: 'Notifications', icon: <NotificationsIcon />, path: '/settings/notifications' },
  ];

  const pageTitle = pageTitles[location.pathname] || 'Asset Management';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* ── Sidebar ── */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Logo */}
        <Box sx={{ p: 2.5, pt: 3, pb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: 2,
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
          }}>
            <HexagonIcon sx={{ color: '#fff', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f1f5f9', lineHeight: 1.2, fontSize: '0.95rem' }}>
              AssetFlow
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
              Management System
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(148,163,184,0.06)', mx: 2 }} />

        {/* Navigation */}
        <Box sx={{ flex: 1, overflow: 'auto', mt: 1, px: 1.5 }}>
          <Typography variant="overline" sx={{ px: 1.5, py: 1, display: 'block', color: '#475569', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em' }}>
            Navigation
          </Typography>
          <List disablePadding>
            {menuItems.map((item) => {
              const isSelected = location.pathname === item.path;
              return (
                <ListItemButton
                  key={item.text}
                  component={Link}
                  to={item.path}
                  selected={isSelected}
                  sx={{
                    borderRadius: 2.5,
                    mb: 0.5,
                    py: 1.2,
                    px: 1.5,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                    borderLeft: isSelected ? '3px solid #6366f1' : '3px solid transparent',
                    '&:hover': {
                      backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'rgba(148, 163, 184, 0.06)',
                      transform: 'translateX(2px)',
                    },
                  }}
                >
                  <ListItemIcon sx={{
                    color: isSelected ? '#818cf8' : '#64748b',
                    minWidth: 38,
                    transition: 'color 0.2s',
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    slotProps={{
                      primary: {
                        sx: {
                          fontWeight: isSelected ? 600 : 400,
                          color: isSelected ? '#f1f5f9' : '#94a3b8',
                          fontSize: '0.875rem',
                        }
                      }
                    }}
                  />
                  {isSelected && (
                    <Box sx={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#6366f1',
                      boxShadow: '0 0 8px rgba(99,102,241,0.6)',
                    }} />
                  )}
                </ListItemButton>
              );
            })}
          </List>

          <Typography variant="overline" sx={{ px: 1.5, py: 1, display: 'block', color: '#475569', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', mt: 2 }}>
            Audit & Stats
          </Typography>
          <List disablePadding>
            {auditMenuItems.map((item) => {
              const isSelected = location.pathname === item.path;
              return (
                <ListItemButton
                  key={item.text}
                  component={Link}
                  to={item.path}
                  selected={isSelected}
                  sx={{
                    borderRadius: 2.5,
                    mb: 0.5,
                    py: 1.2,
                    px: 1.5,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                    borderLeft: isSelected ? '3px solid #6366f1' : '3px solid transparent',
                    '&:hover': {
                      backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'rgba(148, 163, 184, 0.06)',
                      transform: 'translateX(2px)',
                    },
                  }}
                >
                  <ListItemIcon sx={{
                    color: isSelected ? '#818cf8' : '#64748b',
                    minWidth: 38,
                    transition: 'color 0.2s',
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    slotProps={{
                      primary: {
                        sx: {
                          fontWeight: isSelected ? 600 : 400,
                          color: isSelected ? '#f1f5f9' : '#94a3b8',
                          fontSize: '0.875rem',
                        }
                      }
                    }}
                  />
                  {isSelected && (
                    <Box sx={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#6366f1',
                      boxShadow: '0 0 8px rgba(99,102,241,0.6)',
                    }} />
                  )}
                </ListItemButton>
              );
            })}
          </List>
        </Box>

        {/* User Profile at Bottom */}
        <Divider sx={{ borderColor: 'rgba(148,163,184,0.06)', mx: 2 }} />
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            src={userPicture}
            sx={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              fontSize: '0.85rem', fontWeight: 700,
            }}
          >
            {userInitials}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.8rem', lineHeight: 1.3 }}>
              {userDisplayName}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
              {userRole}
            </Typography>
          </Box>
        </Box>
      </Drawer>

      {/* ── Main Content ── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* ── Topbar ── */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            background: 'rgba(11, 15, 26, 0.7)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
          }}
        >
          <Toolbar sx={{ gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#f1f5f9', minWidth: 'fit-content' }}>
              {pageTitle}
            </Typography>

            {/* Search */}
            <Box sx={{
              flex: 1, maxWidth: 400, ml: 2,
              display: 'flex', alignItems: 'center', gap: 1,
              background: 'rgba(148, 163, 184, 0.06)',
              borderRadius: 2.5, px: 2, py: 0.5,
              border: '1px solid rgba(148, 163, 184, 0.08)',
              transition: 'all 0.2s',
              '&:focus-within': {
                border: '1px solid rgba(99, 102, 241, 0.3)',
                background: 'rgba(148, 163, 184, 0.08)',
              },
            }}>
              <SearchIcon sx={{ color: '#64748b', fontSize: 20 }} />
              <InputBase
                placeholder="Search assets, employees..."
                sx={{
                  flex: 1, color: '#e2e8f0', fontSize: '0.85rem',
                  '& ::placeholder': { color: '#64748b', opacity: 1 },
                }}
              />
            </Box>

            <Box sx={{ flex: 1 }} />

            {/* Notifications Bell */}
            <Tooltip title="Notifications">
              <IconButton onClick={(e) => setNotifAnchor(e.currentTarget)} sx={{ color: '#94a3b8' }}>
                <Badge badgeContent={notifications.length} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', height: 18, minWidth: 18 } }}>
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* User Avatar */}
            <Tooltip title="Account">
              <IconButton onClick={(e) => setAvatarAnchor(e.currentTarget)} sx={{ p: 0.5 }}>
                <Avatar
                  src={userPicture}
                  sx={{
                    width: 34, height: 34,
                    background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                    fontSize: '0.8rem', fontWeight: 700,
                  }}
                >
                  {userInitials}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        {/* Notifications Dropdown */}
        <Menu
          anchorEl={notifAnchor}
          open={Boolean(notifAnchor)}
          onClose={() => setNotifAnchor(null)}
          slotProps={{
            paper: {
              sx: {
                width: 380, maxHeight: 480,
                background: 'rgba(15, 23, 42, 0.97)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(148,163,184,0.1)',
                borderRadius: 3,
                mt: 1,
              }
            }
          }}
        >
          <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f1f5f9' }}>Notifications</Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>{notifications.length} new alerts</Typography>
          </Box>
          {notifications.length === 0 ? (
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 32, color: 'rgba(148, 163, 184, 0.15)', mb: 1 }} />
              <Typography variant="caption" sx={{ color: '#64748b', textAlign: 'center' }}>
                No active notifications
              </Typography>
            </Box>
          ) : (
            notifications.map((n) => (
              <MenuItem
                key={n.id}
                onClick={() => setNotifAnchor(null)}
                sx={{
                  py: 1.5, px: 2.5, gap: 1.5,
                  borderBottom: '1px solid rgba(148,163,184,0.04)',
                  '&:hover': { background: 'rgba(148,163,184,0.06)' },
                }}
              >
                <Box sx={{ mt: 0.3 }}>{notifIcons[n.type] || notifIcons.info}</Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.82rem' }}>
                    {n.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', lineHeight: 1.3 }}>
                    {n.message}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.68rem', mt: 0.3, display: 'block' }}>
                    {n.time}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          )}
        </Menu>

        {/* Avatar Dropdown */}
        <Menu
          anchorEl={avatarAnchor}
          open={Boolean(avatarAnchor)}
          onClose={() => setAvatarAnchor(null)}
          slotProps={{
            paper: {
              sx: {
                background: 'rgba(15, 23, 42, 0.97)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(148,163,184,0.1)',
                borderRadius: 2,
                minWidth: 180, mt: 1,
              }
            }
          }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#e2e8f0' }}>{userDisplayName}</Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>{userEmail}</Typography>
          </Box>
          <MenuItem onClick={() => { setAvatarAnchor(null); handleLogout(); }} sx={{ gap: 1.5, py: 1.2 }}>
            <LogoutIcon sx={{ fontSize: 18, color: '#94a3b8' }} />
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>Logout</Typography>
          </MenuItem>
        </Menu>

        {/* Page Content */}
        <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3.5 }, overflow: 'auto' }}>
          {children}
        </Box>

        {/* Floating Chat Button */}
        <Tooltip title="AI Assistant">
          <IconButton
            onClick={() => setChatOpen(!chatOpen)}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              width: 56,
              height: 56,
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
              zIndex: 1000,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.1) rotate(5deg)',
                boxShadow: '0 6px 24px rgba(99, 102, 241, 0.6)',
              }
            }}
          >
            {chatOpen ? <CloseIcon /> : <SmartToyIcon />}
          </IconButton>
        </Tooltip>

        {/* Floating Slide-in Chat Panel */}
        <Slide direction="up" in={chatOpen} mountOnEnter unmountOnExit>
          <Paper
            elevation={12}
            sx={{
              position: 'fixed',
              bottom: 96,
              right: 24,
              width: 380,
              height: 520,
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(148, 163, 184, 0.12)',
              borderRadius: 4,
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <Box sx={{
              p: 2,
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.15))',
              borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <Avatar sx={{
                  width: 32,
                  height: 32,
                  background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                }}>
                  <SmartToyIcon sx={{ fontSize: 18 }} />
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#f1f5f9' }}>
                    AssetFlow AI Advisor
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: -0.2 }}>
                    Grounded in inventory context
                  </Typography>
                </Box>
              </Box>
              <IconButton size="small" onClick={() => setChatOpen(false)} sx={{ color: '#64748b' }}>
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>

            {/* Messages Area */}
            <Box sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              scrollBehavior: 'smooth',
              '&::-webkit-scrollbar': { width: 4 },
              '&::-webkit-scrollbar-thumb': { background: 'rgba(148, 163, 184, 0.12)', borderRadius: 2 },
            }}>
              {messages.length === 0 ? (
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                  p: 2,
                }}>
                  <SmartToyIcon sx={{ fontSize: 40, color: 'rgba(99, 102, 241, 0.15)', mb: 2 }} />
                  <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', mb: 3, px: 2 }}>
                    Hello! I am your AI Asset Advisor. Ask me anything about stock, active allocations, maintenance, or warranties.
                  </Typography>
                  
                  {/* Starter Prompts */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                    {starterPrompts.map((promptText, idx) => (
                      <Button
                        key={idx}
                        variant="outlined"
                        size="small"
                        onClick={() => handleSend(promptText)}
                        sx={{
                          justifyContent: 'flex-start',
                          textAlign: 'left',
                          py: 1,
                          px: 1.5,
                          borderColor: 'rgba(148,163,184,0.1)',
                          color: '#94a3b8',
                          textTransform: 'none',
                          fontSize: '0.78rem',
                          '&:hover': {
                            borderColor: '#6366f1',
                            background: 'rgba(99,102,241,0.04)',
                            color: '#f1f5f9',
                          }
                        }}
                      >
                        {promptText}
                      </Button>
                    ))}
                  </Box>
                </Box>
              ) : (
                messages.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  return (
                    <Box
                      key={idx}
                      sx={{
                        alignSelf: isUser ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isUser ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <Box sx={{
                        p: 1.5,
                        borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        background: isUser ? '#6366f1' : 'rgba(148, 163, 184, 0.06)',
                        border: isUser ? 'none' : '1px solid rgba(148, 163, 184, 0.08)',
                        color: isUser ? '#fff' : '#e2e8f0',
                        fontSize: '0.82rem',
                        lineHeight: 1.4,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}>
                        {msg.content}
                      </Box>
                      {!isUser && msg.source && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#64748b',
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            mt: 0.4,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            background: 'rgba(148, 163, 184, 0.05)',
                            px: 0.6,
                            py: 0.2,
                            borderRadius: 1,
                          }}
                        >
                          Source: {msg.source}
                        </Typography>
                      )}
                    </Box>
                  );
                })
              )}

              {/* Loading Dots */}
              {chatLoading && (
                <Box sx={{ alignSelf: 'flex-start', display: 'flex', gap: 0.5, p: 1.5, borderRadius: 2, background: 'rgba(148, 163, 184, 0.06)', border: '1px solid rgba(148, 163, 184, 0.08)' }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#64748b', animation: 'bounce 1s infinite' }} />
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#64748b', animation: 'bounce 1s infinite 0.2s' }} />
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#64748b', animation: 'bounce 1s infinite 0.4s' }} />
                </Box>
              )}
              
              <div ref={messagesEndRef} />
            </Box>

            {/* Input Box */}
            <Box sx={{
              p: 1.5,
              borderTop: '1px solid rgba(148, 163, 184, 0.08)',
              display: 'flex',
              gap: 1,
              alignItems: 'center',
            }}>
              <InputBase
                placeholder="Ask a question..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(chatInput);
                  }
                }}
                sx={{
                  flex: 1,
                  background: 'rgba(148, 163, 184, 0.04)',
                  border: '1px solid rgba(148, 163, 184, 0.08)',
                  borderRadius: 2.5,
                  px: 1.5,
                  py: 0.8,
                  color: '#e2e8f0',
                  fontSize: '0.82rem',
                  '&:focus-within': {
                    borderColor: 'rgba(99, 102, 241, 0.4)',
                  }
                }}
              />
              <IconButton
                onClick={() => handleSend(chatInput)}
                disabled={!chatInput.trim() || chatLoading}
                sx={{
                  background: '#6366f1',
                  color: '#fff',
                  borderRadius: 2.5,
                  width: 36,
                  height: 36,
                  '&:hover': {
                    background: '#4f46e5',
                  },
                  '&:disabled': {
                    background: 'rgba(148, 163, 184, 0.08)',
                    color: 'rgba(148, 163, 184, 0.2)',
                  }
                }}
              >
                <SendIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Paper>
        </Slide>
      </Box>
    </Box>
  );
};

// ─── Auth Guard ────────────────────────────────────────────────────
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

// ─── App ───────────────────────────────────────────────────────────
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/inventory" element={<PrivateRoute><Inventory /></PrivateRoute>} />
            <Route path="/allocations" element={<PrivateRoute><Allocations /></PrivateRoute>} />
            <Route path="/maintenance" element={<PrivateRoute><Maintenance /></PrivateRoute>} />
            <Route path="/predictive" element={<PrivateRoute><PredictiveMaintenance /></PrivateRoute>} />
            <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
            <Route path="/sent-emails" element={<PrivateRoute><SentEmails /></PrivateRoute>} />
            <Route path="/audit/logs" element={<PrivateRoute><ActivityLog /></PrivateRoute>} />
            <Route path="/audit/verification" element={<PrivateRoute><AssetVerification /></PrivateRoute>} />
            <Route path="/audit/utilization" element={<PrivateRoute><UtilizationReport /></PrivateRoute>} />
            <Route path="/settings/notifications" element={<PrivateRoute><NotificationPreferences /></PrivateRoute>} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
