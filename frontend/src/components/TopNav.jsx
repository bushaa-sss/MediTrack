// Top navigation for primary app sections, role-aware.
import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const NAV_LINKS_BY_ROLE = {
  doctor: [
    { to: '/', label: 'Patients' },
    { to: '/patients/new', label: 'Add Patient' },
    { to: '/appointments', label: 'Appointments' },
    { to: '/notifications', label: 'Notifications' }
  ],
  receptionist: [
    { to: '/', label: 'Patients' },
    { to: '/patients/new', label: 'Add Patient' },
    { to: '/appointments', label: 'Appointments' },
    { to: '/notifications', label: 'Notifications' }
  ],
  admin: [
    { to: '/', label: 'Patients' },
    { to: '/appointments', label: 'Appointments' },
    { to: '/admin/staff', label: 'Users' },
    { to: '/notifications', label: 'Notifications' }
  ]
};

const TopNav = () => {
  const { token, doctor, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = doctor
    ? doctor.name || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || doctor.username
    : '';

  const navLinks = NAV_LINKS_BY_ROLE[doctor?.role] || NAV_LINKS_BY_ROLE.doctor;

  return (
    <nav className="navbar">
      <div className="brand">MediTrack</div>
      <div className="nav-links">
        {token ? (
          <>
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to}>
                {link.label}
              </Link>
            ))}
            <button onClick={handleLogout}>
              Sign out {displayName ? `(${displayName})` : ''}
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default TopNav;
