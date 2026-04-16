import axios from 'axios';

const DEFAULT_BACKEND_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://nexorium-p.onrender.com'
    : 'http://127.0.0.1:8001';

export const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || DEFAULT_BACKEND_URL;
export const TOKEN_KEY = 'nexorium_token';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function loginUser(data) {
  const response = await api.post('/auth/login', data);
  storeToken(response.data.token);
  return response.data;
}

export async function registerUser(data) {
  const response = await api.post('/auth/register', data);
  storeToken(response.data.token);
  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get('/auth/me');
  return response.data;
}

export async function logoutUser() {
  const response = await api.post('/auth/logout');
  clearToken();
  return response.data;
}

export async function connectWalletAddress(walletAddress) {
  const response = await api.post('/connect-wallet', { walletAddress });
  return response.data;
}

export async function uploadAsset(file, walletAddress = '') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('walletAddress', walletAddress);

  const response = await api.post('/assets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function getAssets(search = '') {
  const response = await api.get('/assets', {
    params: search ? { search } : {},
  });
  return response.data;
}

export async function getStats() {
  const response = await api.get('/stats');
  return response.data;
}

export async function getAsset(assetId) {
  const response = await api.get(`/assets/${assetId}`);
  return response.data;
}

export async function mintAsset(assetId) {
  const response = await api.patch(`/assets/${assetId}/mint`);
  return response.data;
}

export async function transferAsset(data) {
  const response = await api.post('/transfer-asset', data);
  return response.data;
}

export async function licenseAsset(data) {
  const response = await api.post('/license-asset', data);
  return response.data;
}

export async function getAuditReport(assetId) {
  const response = await api.get(`/assets/${assetId}/audit-report`);
  return response.data;
}

export async function getTransactions(assetId) {
  const response = await api.get(`/transactions/${assetId}`);
  return response.data;
}

export async function getAssetFileBlob(assetId) {
  const response = await api.get(`/assets/${assetId}/file`, {
    responseType: 'blob',
  });
  return response.data;
}

export async function downloadAssetFile(assetId) {
  const response = await api.get(`/assets/${assetId}/download`, {
    responseType: 'blob',
  });
  return response.data;
}

export async function downloadAuditReport(assetId) {
  const response = await api.get(`/assets/${assetId}/audit-report/download`, {
    responseType: 'blob',
  });
  return response.data;
}

export async function verifyAsset(hash) {
  const response = await api.post('/verify', { query: hash });
  return response.data;
}

export async function getProfile() {
  const response = await api.get('/profile');
  return response.data;
}

export default api;
