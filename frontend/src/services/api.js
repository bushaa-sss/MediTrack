// Axios instance with JWT injection.
import axios from 'axios';

const primaryApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const demoApiBaseUrl = import.meta.env.VITE_DEMO_API_BASE_URL || '';

const api = axios.create({
  baseURL: primaryApiBaseUrl
});

api.interceptors.request.use((config) => {
  const forcePrimaryApi = config.forcePrimaryApi === true;
  const modeWasSpecified = config.useDemoApi !== undefined || forcePrimaryApi;
  const useDemoApi = config.useDemoApi === true || (!modeWasSpecified && localStorage.getItem('apiMode') === 'demo');
  delete config.useDemoApi;
  delete config.forcePrimaryApi;
  config.baseURL = useDemoApi && !forcePrimaryApi && demoApiBaseUrl ? demoApiBaseUrl : primaryApiBaseUrl;

  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
