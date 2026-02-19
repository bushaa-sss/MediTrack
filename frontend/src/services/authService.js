// Auth API wrappers for login and registration.
import api from './api';

export const registerDoctor = async (payload) => {
  const { data } = await api.post('/api/auth/register', payload);
  return data;
};

export const loginDoctor = async (payload) => {
  const { data } = await api.post('/api/auth/login', payload);
  return data;
};

export const fetchMe = async () => {
  const { data } = await api.get('/api/doctors/me');
  return data;
};

export const updateFcmToken = async (token, timezone) => {
  const { data } = await api.post('/api/doctors/me/fcm-token', { token, timezone });
  return data;
};

export const clearFcmToken = async () => {
  const { data } = await api.delete('/api/doctors/me/fcm-token');
  return data;
};
