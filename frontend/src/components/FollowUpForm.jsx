// Manual follow-up date form.
import { useEffect, useState } from 'react';
import api from '../services/api';

const FollowUpForm = ({ patientId }) => {
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUps, setFollowUps] = useState([]);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadFollowUps = async () => {
    if (!patientId) return;
    try {
      const { data } = await api.get(`/api/patients/${patientId}/followups`);
      setFollowUps(Array.isArray(data.followUps) ? data.followUps : []);
    } catch (err) {
      setError('Unable to load follow-ups.');
    }
  };

  useEffect(() => {
    setError('');
    loadFollowUps();
  }, [patientId]);

  const handleAddFollowUp = async (event) => {
    event.preventDefault();
    setError('');

    if (!followUpDate) {
      setError('Select a follow-up date.');
      return;
    }

    setIsSaving(true);
    try {
      // Persist the follow-up on the server and refresh the list.
      const { data } = await api.post(`/api/patients/${patientId}/followups`, {
        followUpDate
      });
      setFollowUps(Array.isArray(data.followUps) ? data.followUps : []);
      setFollowUpDate('');
    } catch (err) {
      const message = err?.response?.data?.message || 'Unable to add follow-up.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
  };

  return (
    <form className="card stack-form" onSubmit={handleAddFollowUp}>
      <div className="section-title">Follow-ups</div>
      {error && <div className="notice">{error}</div>}

      <div className={`field ${followUpDate ? 'filled' : ''}`}>
        <input
          id="followUpDate"
          name="followUpDate"
          type="date"
          placeholder=" "
          value={followUpDate}
          onChange={(event) => setFollowUpDate(event.target.value)}
          required
        />
        <label htmlFor="followUpDate">Follow-up Date</label>
      </div>
      <div className="inline-actions" style={{ marginTop: '8px' }}>
        <button type="submit" disabled={isSaving || !patientId}>
          Add Follow-up
        </button>
      </div>

      <div className="list" style={{ marginTop: '12px' }}>
        {followUps.length === 0 && <div className="notice">No follow-ups added yet.</div>}
        {followUps.map((followUp) => (
          <div className="list-item" key={followUp._id || followUp.followUpDate}>
            <strong>{formatDate(followUp.followUpDate)}</strong>
          </div>
        ))}
      </div>
    </form>
  );
};

export default FollowUpForm;
