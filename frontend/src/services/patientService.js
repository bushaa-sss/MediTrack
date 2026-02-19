// Patient API wrappers.
import api from './api';

export const getPatients = async () => {
  const { data } = await api.get('/api/patients');
  return data;
};

export const createPatient = async (payload) => {
  const { data } = await api.post('/api/patients', payload);
  return data;
};

export const getPatientById = async (id) => {
  const { data } = await api.get(`/api/patients/${id}`);
  return data;
};

export const updatePatient = async (id, payload) => {
  const { data } = await api.put(`/api/patients/${id}`, payload);
  return data;
};

export const deletePatient = async (id) => {
  const { data } = await api.delete(`/api/patients/${id}`);
  return data;
};

export const addPrescription = async (id, payload) => {
  const { data } = await api.post(`/api/patients/${id}/prescriptions`, payload);
  return data;
};

export const updatePrescription = async (id, prescriptionId, payload) => {
  const { data } = await api.put(`/api/patients/${id}/prescriptions/${prescriptionId}`, payload);
  return data;
};

export const deletePrescription = async (id, prescriptionId) => {
  const { data } = await api.delete(`/api/patients/${id}/prescriptions/${prescriptionId}`);
  return data;
};

export const uploadReport = async (id, payload) => {
  const form =
    payload instanceof FormData
      ? payload
      : (() => {
          const nextForm = new FormData();
          nextForm.append('report', payload);
          return nextForm;
        })();
  const { data } = await api.post(`/api/patients/${id}/reports`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};

export const deleteReport = async (id, reportId) => {
  const { data } = await api.delete(`/api/patients/${id}/reports/${reportId}`);
  return data;
};

export const sendReminder = async (id, payload) => {
  const { data } = await api.post(`/api/patients/${id}/reminders`, payload);
  return data;
};

export const getReminders = async (id) => {
  const { data } = await api.get(`/api/patients/${id}/reminders`);
  return data;
};

export const addFollowUp = async (id, payload) => {
  const { data } = await api.post(`/api/patients/${id}/followups`, payload);
  return data;
};

export const getFollowUps = async (id) => {
  const { data } = await api.get(`/api/patients/${id}/followups`);
  return data;
};

export const updateFollowUp = async (id, followUpId, payload) => {
  const { data } = await api.put(`/api/patients/${id}/followups/${followUpId}`, payload);
  return data;
};

export const deleteFollowUp = async (id, followUpId) => {
  const { data } = await api.delete(`/api/patients/${id}/followups/${followUpId}`);
  return data;
};
