// Dashboard shows patient list and quick actions.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deletePatient, getPatients } from '../services/patientService';

const Dashboard = () => {
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState('name');

  const loadPatients = async () => {
    try {
      const data = await getPatients();
      setPatients(data.patients);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load patients');
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this patient?')) return;
    await deletePatient(id);
    await loadPatients();
  };

  const normalizedTerm = searchTerm.trim().toLowerCase();
  const filteredPatients = patients.filter((patient) => {
    if (!normalizedTerm) return true;
    if (searchMode === 'name') {
      return (patient.name || '').toLowerCase().includes(normalizedTerm);
    }
    const mrn =
      patient.mrNumber ||
      patient.mrn ||
      patient.medicalRecordNumber ||
      patient._id ||
      '';
    return String(mrn).toLowerCase().includes(normalizedTerm);
  });

  const getInitials = (name = '') =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'PT';

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <div className="eyebrow">Overview</div>
          <h1>Patients</h1>
          <p>Track appointments, prescriptions, and follow-ups in one view.</p>
        </div>
        <Link to="/patients/new">
          <button>Add Patient</button>
        </Link>
      </div>
      <div className="search-bar">
        <select value={searchMode} onChange={(event) => setSearchMode(event.target.value)}>
          <option value="name">Search by name</option>
          <option value="mrn">Search by MR number</option>
        </select>
        <input
          type="text"
          placeholder={searchMode === 'name' ? 'Search patients by name' : 'Search patients by MR number'}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        {searchTerm && (
          <button type="button" className="secondary" onClick={() => setSearchTerm('')}>
            Clear
          </button>
        )}
      </div>
      <div className="card">
        <div className="section-title">Patient Overview</div>
        {error && <div className="notice">{error}</div>}
        <div className="list">
          {patients.length === 0 && <div className="notice">No patients yet.</div>}
          {patients.length > 0 && filteredPatients.length === 0 && (
            <div className="notice">No matching patients.</div>
          )}
          {filteredPatients.map((patient) => {
            const mrn =
              patient.mrNumber ||
              patient.mrn ||
              patient.medicalRecordNumber ||
              patient._id ||
              '';
            const mrnDisplay = mrn ? String(mrn).slice(-8) : 'N/A';
            return (
            <div className="list-item patient-card" key={patient._id}>
              <div className="patient-main">
                <div className="patient-avatar">{getInitials(patient.name)}</div>
                <div>
                  <div className="patient-name">{patient.name}</div>
                  <div className="patient-meta">
                    <span
                      className="badge gender"
                      data-gender={patient.gender || 'unknown'}
                    >
                      {patient.gender ? patient.gender[0].toUpperCase() + patient.gender.slice(1) : 'Unknown'}
                    </span>
                    <span>{patient.phone}</span>
                    <span className="patient-id" title={mrn ? String(mrn) : ''}>
                      MR No: {mrnDisplay}
                    </span>
                  </div>
                </div>
              </div>
              <div className="patient-actions">
                <Link to={`/patients/${patient._id}`}>
                  <button className="secondary">View</button>
                </Link>
                <button className="danger" onClick={() => handleDelete(patient._id)}>
                  Delete
                </button>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
