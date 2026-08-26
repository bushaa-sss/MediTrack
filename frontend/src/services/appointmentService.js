// Appointment API wrappers.
import api from './api';

export const getAppointments = async (params) => {
  const { data } = await api.get('/api/appointments', { params });
  return data;
};

export const createAppointment = async (payload) => {
  const { data } = await api.post('/api/appointments', payload);
  return data;
};

export const getAppointmentById = async (id) => {
  const { data } = await api.get(`/api/appointments/${id}`);
  return data;
};

export const updateAppointment = async (id, payload) => {
  const { data } = await api.put(`/api/appointments/${id}`, payload);
  return data;
};

export const deleteAppointment = async (id) => {
  const { data } = await api.delete(`/api/appointments/${id}`);
  return data;
};
