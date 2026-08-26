// Appointments page: schedule, view, edit, and cancel appointments.
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import AppointmentForm from '../components/AppointmentForm';
import { getPatients } from '../services/patientService';
import { getDoctors } from '../services/authService';
import {
  createAppointment,
  deleteAppointment,
  getAppointments,
  updateAppointment
} from '../services/appointmentService';

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
};

const Appointments = () => {
  const { doctor } = useContext(AuthContext);
  // Hard delete is doctor/admin only server-side (Phase 8/9); cancellation via
  // status update is the normal, non-destructive path for everyone.
  const canDelete = doctor?.role === 'doctor' || doctor?.role === 'admin';
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadAppointments = async () => {
    try {
      const data = await getAppointments();
      setAppointments(data.appointments);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appointments');
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [patientData, doctorData] = await Promise.all([getPatients(), getDoctors()]);
        setPatients(patientData.patients);
        setDoctors(doctorData.doctors);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load patients/doctors');
      }
    };

    loadInitialData();
    loadAppointments();
  }, []);

  const handleCreate = async (payload) => {
    try {
      await createAppointment(payload);
      setNotice('Appointment scheduled.');
      await loadAppointments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule appointment');
    }
  };

  const handleUpdate = async (payload) => {
    try {
      await updateAppointment(editingAppointment._id, payload);
      setNotice('Appointment updated.');
      setEditingAppointment(null);
      await loadAppointments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update appointment');
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return;
    try {
      await updateAppointment(id, { status: 'cancelled' });
      setNotice('Appointment cancelled.');
      await loadAppointments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this appointment? Prefer Cancel unless this was a mistake.')) return;
    try {
      await deleteAppointment(id);
      await loadAppointments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete appointment');
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <div className="eyebrow">Scheduling</div>
          <h1>Appointments</h1>
          <p>Book, reschedule, and track appointment status.</p>
        </div>
      </div>

      {notice && <div className="notice">{notice}</div>}
      {error && <div className="notice">{error}</div>}

      <AppointmentForm
        patients={patients}
        doctors={doctors}
        initialData={editingAppointment}
        onSubmit={editingAppointment ? handleUpdate : handleCreate}
        onCancel={editingAppointment ? () => setEditingAppointment(null) : undefined}
        submitLabel={editingAppointment ? 'Update Appointment' : 'Schedule Appointment'}
      />

      <div className="card">
        <div className="section-title">Upcoming Appointments</div>
        <div className="list">
          {appointments.length === 0 && <div className="notice">No appointments scheduled.</div>}
          {appointments.map((appointment) => (
            <div className="list-item" key={appointment._id}>
              <strong>{appointment.patient?.name || 'Unknown patient'}</strong>
              <div>
                With Dr. {appointment.doctor?.name || `${appointment.doctor?.firstName || ''} ${appointment.doctor?.lastName || ''}`.trim()}
              </div>
              <div>
                {formatDate(appointment.date)} · {appointment.startTime}
                {appointment.endTime ? ` - ${appointment.endTime}` : ''}
              </div>
              {appointment.reason && <div>Reason: {appointment.reason}</div>}
              <span className="badge">{appointment.status.replace('_', ' ')}</span>
              <div className="inline-actions">
                <button className="secondary" onClick={() => setEditingAppointment(appointment)}>
                  Edit
                </button>
                {appointment.status !== 'cancelled' && (
                  <button className="secondary" onClick={() => handleCancel(appointment._id)}>
                    Cancel
                  </button>
                )}
                {canDelete && (
                  <button className="danger" onClick={() => handleDelete(appointment._id)}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Appointments;
