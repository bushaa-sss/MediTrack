// Form for scheduling or editing an appointment.
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

const STATUS_OPTIONS = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'];

const emptyForm = {
  patient: '',
  doctor: '',
  date: '',
  startTime: '',
  endTime: '',
  status: 'scheduled',
  reason: '',
  notes: ''
};

const toDateInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const AppointmentForm = ({ patients, doctors, initialData, onSubmit, onCancel, submitLabel = 'Schedule Appointment' }) => {
  const { doctor: currentUser } = useContext(AuthContext);
  // A doctor can only ever book/manage their own appointments (enforced server-side
  // too), so lock the doctor field to themselves instead of offering a picker.
  const isDoctorRole = currentUser?.role === 'doctor';
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!initialData) {
      setForm({ ...emptyForm, doctor: isDoctorRole ? currentUser.id : '' });
      return;
    }

    setForm({
      patient: initialData.patient?._id || initialData.patient || '',
      doctor: initialData.doctor?._id || initialData.doctor || (isDoctorRole ? currentUser.id : ''),
      date: toDateInputValue(initialData.date),
      startTime: initialData.startTime || '',
      endTime: initialData.endTime || '',
      status: initialData.status || 'scheduled',
      reason: initialData.reason || '',
      notes: initialData.notes || ''
    });
  }, [initialData, isDoctorRole, currentUser?.id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
    if (!initialData) {
      setForm(emptyForm);
    }
  };

  return (
    <form className="card stack-form" onSubmit={handleSubmit}>
      <div className="section-title">{initialData ? 'Edit Appointment' : 'New Appointment'}</div>

      <div className="form-row">
        <select name="patient" value={form.patient} onChange={handleChange} required>
          <option value="">Select patient</option>
          {patients.map((patient) => (
            <option key={patient._id} value={patient._id}>
              {patient.name}
            </option>
          ))}
        </select>
        {isDoctorRole ? (
          <div className="field filled">
            <input value={currentUser.name || 'You'} placeholder=" " disabled />
            <label>Doctor</label>
          </div>
        ) : (
          <select name="doctor" value={form.doctor} onChange={handleChange} required>
            <option value="">Select doctor</option>
            {doctors.map((doc) => (
              <option key={doc._id} value={doc._id}>
                {doc.name || `${doc.firstName || ''} ${doc.lastName || ''}`.trim()}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className={`field ${form.date ? 'filled' : ''}`}>
        <input id="date" name="date" type="date" placeholder=" " value={form.date} onChange={handleChange} required />
        <label htmlFor="date">Date</label>
      </div>

      <div className="form-row">
        <div className={`field ${form.startTime ? 'filled' : ''}`}>
          <input
            id="startTime"
            name="startTime"
            type="time"
            placeholder=" "
            value={form.startTime}
            onChange={handleChange}
            required
          />
          <label htmlFor="startTime">Start Time</label>
        </div>
        <div className={`field ${form.endTime ? 'filled' : ''}`}>
          <input id="endTime" name="endTime" type="time" placeholder=" " value={form.endTime} onChange={handleChange} />
          <label htmlFor="endTime">End Time</label>
        </div>
      </div>

      {initialData && (
        <div className="form-row">
          <select name="status" value={form.status} onChange={handleChange}>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={`field ${form.reason ? 'filled' : ''}`}>
        <input id="reason" name="reason" placeholder=" " value={form.reason} onChange={handleChange} />
        <label htmlFor="reason">Reason</label>
      </div>

      <div className={`field ${form.notes ? 'filled' : ''}`}>
        <textarea id="notes" name="notes" placeholder=" " value={form.notes} onChange={handleChange} />
        <label htmlFor="notes">Notes</label>
      </div>

      <div className="inline-actions">
        <button type="submit">{submitLabel}</button>
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default AppointmentForm;
