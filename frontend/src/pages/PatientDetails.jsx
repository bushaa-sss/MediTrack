// Patient detail page with prescriptions, reports, and reminders.
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PatientForm from '../components/PatientForm';
import PrescriptionForm from '../components/PrescriptionForm';
import ReportUpload from '../components/ReportUpload';
import FollowUpForm from '../components/FollowUpForm';
import api from '../services/api';
import {
  addPrescription,
  getPatientById,
  getReminders,
  sendReminder,
  updatePatient,
  uploadReport,
  deleteReport,
  deletePrescription
} from '../services/patientService';

const PatientDetails = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [notice, setNotice] = useState('');

  const loadPatient = async () => {
    const data = await getPatientById(id);
    setPatient(data.patient);
  };

  const loadReminders = async () => {
    const data = await getReminders(id);
    setReminders(data.reminders);
  };

  useEffect(() => {
    loadPatient();
    loadReminders();
  }, [id]);

  const handleUpdate = async (payload) => {
    const data = await updatePatient(id, payload);
    setPatient(data.patient);
    setNotice('Patient updated.');
  };

  const handlePrescription = async (payload) => {
    const data = await addPrescription(id, payload);
    setPatient(data.patient);
    setNotice('Prescription added.');
  };

  const handleDeletePrescription = async (prescriptionId) => {
    if (!confirm('Delete this prescription?')) return;
    const data = await deletePrescription(id, prescriptionId);
    setPatient(data.patient);
  };

  const handleUpload = async (payload) => {
    const data = await uploadReport(id, payload);
    setPatient(data.patient);
    setNotice('Report uploaded.');
  };

  const handleDeleteReport = async (reportId) => {
    if (!confirm('Delete this report?')) return;
    const data = await deleteReport(id, reportId);
    setPatient(data.patient);
    setNotice('Report deleted.');
  };

  const handleSendReminder = async () => {
    await sendReminder(id, { channel: 'push', message: `Reminder for ${patient.name}` });
    await loadReminders();
    setNotice('Reminder sent.');
  };


  const handleDownloadReport = async (reportId, name) => {
    const response = await api.get(`/api/patients/${id}/reports/${reportId}`, {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', name);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (!patient) {
    return (
      <div className="container">
        <div className="card">Loading patient...</div>
      </div>
    );
  }

  return (
    <div className="container">
      {notice && <div className="notice">{notice}</div>}
      <PatientForm initialData={patient} onSubmit={handleUpdate} submitLabel="Update Patient" />
      <PrescriptionForm onSubmit={handlePrescription} />
      <FollowUpForm patientId={patient._id} />
      <ReportUpload onUpload={handleUpload} />

      <div className="card">
        <div className="section-title">Prescriptions</div>
        <div className="list">
          {patient.prescriptions.length === 0 && <div className="notice">No prescriptions yet.</div>}
          {patient.prescriptions.map((prescription) => (
            <div className="list-item" key={prescription._id}>
              <strong>{prescription.diagnosis}</strong>
              <div>Medicines: {prescription.medicines?.join(', ') || 'None'}</div>
              <div>Notes: {prescription.notes || 'No notes'}</div>
              <div>
                Follow-up:{' '}
                {prescription.followUpDate
                  ? new Date(prescription.followUpDate).toLocaleDateString()
                  : 'Not scheduled'}
              </div>
              <div className="inline-actions">
                <button className="secondary" onClick={() => handleDeletePrescription(prescription._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="section-title">Reports</div>
        <div className="list">
          {patient.reports.length === 0 && <div className="notice">No reports uploaded.</div>}
          {patient.reports.map((report) => (
            <div className="list-item" key={report._id}>
              <strong>{report.originalName}</strong>
              <div>Uploaded {new Date(report.uploadedAt).toLocaleString()}</div>
              <div className="inline-actions">
                <button className="secondary" onClick={() => handleDownloadReport(report._id, report.originalName)}>
                  Download
                </button>
                <button className="danger" onClick={() => handleDeleteReport(report._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="section-title">Patient Reminders</div>
        <button onClick={handleSendReminder}>Send Reminder</button>
        <div className="list" style={{ marginTop: '12px' }}>
          {reminders.length === 0 && <div className="notice">No reminders yet.</div>}
          {reminders.map((reminder) => (
            <div className="list-item" key={reminder._id}>
              <strong>{reminder.channel.toUpperCase()}</strong>
              <div>{reminder.message}</div>
              <div>Status: {reminder.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PatientDetails;
