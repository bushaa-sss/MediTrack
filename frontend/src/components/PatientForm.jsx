// Reusable form for patient details.
import { useState } from 'react';

const PatientForm = ({ initialData = {}, onSubmit, submitLabel = 'Save Patient' }) => {
  const [form, setForm] = useState({
    mrNumber: initialData.mrNumber || '',
    name: initialData.name || '',
    age: initialData.age || '',
    gender: initialData.gender || '',
    phone: initialData.phone || '',
    address: initialData.address || '',
    medicalHistory: initialData.medicalHistory || ''
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'phone') {
      const cleaned = value.replace(/[^0-9+]/g, '');
      setForm((prev) => ({ ...prev, [name]: cleaned }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      mrNumber: form.mrNumber.trim(),
      age: Number(form.age)
    });
  };

  return (
    <form className="card patient-form stack-form" onSubmit={handleSubmit}>
      <div className="section-title">Patient Info</div>
      <div className="grid two">
        <div className={`field ${form.mrNumber ? 'filled' : ''}`}>
          <input
            id="mrNumber"
            name="mrNumber"
            placeholder=" "
            value={form.mrNumber}
            onChange={handleChange}
            required
          />
          <label htmlFor="mrNumber">MR Number</label>
        </div>
        <div className={`field ${form.name ? 'filled' : ''}`}>
          <input id="name" name="name" placeholder=" " value={form.name} onChange={handleChange} required />
          <label htmlFor="name">Name</label>
        </div>
        <div className={`field ${form.age ? 'filled' : ''}`}>
          <input
            id="age"
            name="age"
            type="number"
            placeholder=" "
            value={form.age}
            onChange={handleChange}
            required
          />
          <label htmlFor="age">Age</label>
        </div>
        <div className={`field select-field ${form.gender ? 'filled' : ''}`}>
          <select id="gender" name="gender" value={form.gender} onChange={handleChange} required>
            <option value="" disabled>
              Select gender
            </option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
          <label htmlFor="gender"></label>
        </div>
        <div className={`field ${form.phone ? 'filled' : ''}`}>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            pattern="^(\+9665\d{8}|05\d{8})$"
            placeholder=" "
            value={form.phone}
            onChange={handleChange}
            required
          />
          <label htmlFor="phone">Phone</label>
        </div>
      </div>
      <div className={`field ${form.address ? 'filled' : ''}`}>
        <input id="address" name="address" placeholder=" " value={form.address} onChange={handleChange} />
        <label htmlFor="address">Address</label>
      </div>
      <div className={`field ${form.medicalHistory ? 'filled' : ''}`}>
        <textarea
          id="medicalHistory"
          name="medicalHistory"
          placeholder=" "
          value={form.medicalHistory}
          onChange={handleChange}
        />
        <label htmlFor="medicalHistory">Medical History</label>
      </div>
      <button type="submit">{submitLabel}</button>
    </form>
  );
};

export default PatientForm;
