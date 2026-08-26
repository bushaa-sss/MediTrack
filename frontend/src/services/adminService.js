// Admin API wrappers for staff management and clinic stats.
import api from './api';

export const listStaff = async () => {
  const { data } = await api.get('/api/admin/staff');
  return data;
};

export const createStaff = async (payload) => {
  const { data } = await api.post('/api/admin/staff', payload);
  return data;
};

export const updateStaffRole = async (id, role) => {
  const { data } = await api.patch(`/api/admin/staff/${id}/role`, { role });
  return data;
};

export const updateStaffStatus = async (id, isActive) => {
  const { data } = await api.patch(`/api/admin/staff/${id}/status`, { isActive });
  return data;
};

export const getStats = async () => {
  const { data } = await api.get('/api/admin/stats');
  return data;
};
