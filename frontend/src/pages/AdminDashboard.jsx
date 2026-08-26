// Admin dashboard: clinic-level stats and a link to staff management.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStats } from '../services/adminService';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getStats();
        setStats(data.stats);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load stats');
      }
    };

    loadStats();
  }, []);

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <div className="eyebrow">Overview</div>
          <h1>Clinic Administration</h1>
          <p>System-level statistics and staff management.</p>
        </div>
        <Link to="/admin/staff">
          <button>Manage Users</button>
        </Link>
      </div>
      {error && <div className="notice">{error}</div>}
      {stats && (
        <div className="grid two" style={{ marginBottom: '18px' }}>
          <div className="card" style={{ minHeight: '180px' }}>
            <div className="section-title">Patients</div>
            <div>Total patients: {stats.totalPatients}</div>
          </div>
          <div className="card" style={{ minHeight: '180px' }}>
            <div className="section-title">Staff</div>
            <div>Doctors: {stats.staff.doctor}</div>
            <div>Receptionists: {stats.staff.receptionist}</div>
            <div>Admins: {stats.staff.admin}</div>
          </div>
          <div className="card" style={{ minHeight: '180px' }}>
            <div className="section-title">Appointments</div>
            <div>Total appointments: {stats.totalAppointments}</div>
            <div>Upcoming appointments: {stats.upcomingAppointments}</div>
          </div>
          <div className="card" style={{ minHeight: '180px' }}>
            <div className="section-title">Appointment Status Breakdown</div>
            <div>Scheduled: {stats.appointmentsByStatus.scheduled}</div>
            <div>Confirmed: {stats.appointmentsByStatus.confirmed}</div>
            <div>Completed: {stats.appointmentsByStatus.completed}</div>
            <div>Cancelled: {stats.appointmentsByStatus.cancelled}</div>
            <div>No-show: {stats.appointmentsByStatus.no_show}</div>
          </div>
        </div>
      )}
      {stats && (
        <div className="grid two">
          <div className="card">
            <div className="section-title">Recently Added Staff</div>
            <div className="list">
              {stats.recentStaff.length === 0 && <div className="notice">No staff yet.</div>}
              {stats.recentStaff.map((member) => (
                <div className="list-item" key={member._id}>
                  <strong>{member.name}</strong>
                  <div>{member.role}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
