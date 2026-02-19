// Notification logs API wrapper.
import api from './api';

export const getNotifications = async () => {
  const { data } = await api.get('/api/notifications');
  return data;
};