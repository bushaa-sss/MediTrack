// Form for adding a prescription to a patient.
import { useState } from 'react';

const PrescriptionForm = ({ onSubmit }) => {
  const [form, setForm] = useState({
    diagnosis: '',
    medicines: '',
    notes: '',
    followUpDate: ''
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const medicines = form.medicines
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    onSubmit({
      diagnosis: form.diagnosis,
      medicines,
      notes: form.notes,
      followUpDate: form.followUpDate || null
    });

    setForm({
      diagnosis: '',
      medicines: '',
      notes: '',
      followUpDate: ''
    });
  };

  return (
    <form className="card stack-form" onSubmit={handleSubmit}>
      <div className="section-title">New Prescription</div>
      <div className={`field ${form.diagnosis ? 'filled' : ''}`}>
        <input
          id="diagnosis"
          name="diagnosis"
          placeholder=" "
          value={form.diagnosis}
          onChange={handleChange}
          required
        />
        <label htmlFor="diagnosis">Diagnosis</label>
      </div>
      <div className={`field ${form.medicines ? 'filled' : ''}`}>
        <input
          id="medicines"
          name="medicines"
          placeholder=" "
          value={form.medicines}
          onChange={handleChange}
        />
        <label htmlFor="medicines">Medicines (comma separated)</label>
      </div>
      <div className={`field ${form.notes ? 'filled' : ''}`}>
        <textarea id="notes" name="notes" placeholder=" " value={form.notes} onChange={handleChange} />
        <label htmlFor="notes">Notes</label>
      </div>
      <div className={`field ${form.followUpDate ? 'filled' : ''}`}>
        <input
          id="followUpDate"
          name="followUpDate"
          type="date"
          placeholder=" "
          value={form.followUpDate}
          onChange={handleChange}
        />
        <label htmlFor="followUpDate">Follow-up Date</label>
      </div>
      <button type="submit">Add Prescription</button>
    </form>
  );
};

export default PrescriptionForm;
