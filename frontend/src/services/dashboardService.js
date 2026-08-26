// Dashboard summary API wrapper (doctor/receptionist).
import api from './api';

export const getDashboardSummary = async () => {
  const { data } = await api.get('/api/dashboard/summary');
  return data;
};
