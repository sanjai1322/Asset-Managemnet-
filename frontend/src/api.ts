import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor to attach Authorization header automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Authentication APIs
export const loginWithGoogle = async (credential: string) => {
  const response = await api.post('/auth/google', { credential });
  return response.data;
};

export const loginMock = async (email: string, name?: string) => {
  const response = await api.post('/auth/mock', { email, name, role: 'admin' });
  return response.data;
};

export const fetchHello = async () => {
  const response = await api.get('/hello');
  return response.data;
};

// Assets
export const getAssets = async (category?: string, status?: string) => {
  const params: any = {};
  if (category) params.category = category;
  if (status) params.status = status;
  const response = await api.get('/assets', { params });
  return response.data;
};

export const createAsset = async (assetData: any) => {
  const response = await api.post('/assets', assetData);
  return response.data;
};

export const updateAsset = async (id: number, assetData: any) => {
  const response = await api.put(`/assets/${id}`, assetData);
  return response.data;
};

// Employees
export const getEmployees = async () => {
  const response = await api.get('/employees');
  return response.data;
};

// Allocations
export const getAllocations = async () => {
  const response = await api.get('/allocations');
  return response.data;
};

export const allocateAsset = async (assetId: number, employeeId: number) => {
  const response = await api.post('/allocations/allocate', {
    asset_id: assetId,
    employee_id: employeeId
  });
  return response.data;
};

export const returnAsset = async (allocationId: number) => {
  const response = await api.post(`/allocations/return/${allocationId}`);
  return response.data;
};

// Maintenance
export const getMaintenance = async (assetId?: number) => {
  const params: any = {};
  if (assetId) params.asset_id = assetId;
  const response = await api.get('/maintenance', { params });
  return response.data;
};

export const logMaintenance = async (assetId: number, description: string, cost: number) => {
  const response = await api.post('/maintenance', {
    asset_id: assetId,
    description,
    cost
  });
  return response.data;
};

// Dashboard Stats
export const getStats = async () => {
  const response = await api.get('/stats');
  return response.data;
};

// AI Predictive Maintenance
export const getPredictiveMaintenance = async () => {
  const response = await api.get('/predictive-maintenance');
  return response.data;
};

// Notifications / Emails
export const runWarrantyCheck = async () => {
  const response = await api.post('/notifications/warranty-check');
  return response.data;
};

export const getSentEmails = async () => {
  const response = await api.get('/notifications/sent');
  return response.data;
};

export const sendChatMessage = async (message: string, history: any[]) => {
  const response = await api.post('/ai/chat', { message, history });
  return response.data;
};

// Audit logs & Verification
export const getAuditLogs = async (
  page = 1,
  limit = 50,
  action?: string,
  startDate?: string,
  endDate?: string,
  assetId?: number
) => {
  const params: any = { page, limit };
  if (action) params.action = action;
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  if (assetId) params.asset_id = assetId;

  const response = await api.get('/audit/logs', { params });
  return response.data;
};

export const verifyAsset = async (assetId: number, status: string, notes?: string) => {
  const response = await api.post('/audit/verify', {
    asset_id: assetId,
    status,
    notes
  });
  return response.data;
};

export const getVerificationStatus = async () => {
  const response = await api.get('/audit/verification-status');
  return response.data;
};

export const getUtilizationReport = async () => {
  const response = await api.get('/audit/utilization');
  return response.data;
};

