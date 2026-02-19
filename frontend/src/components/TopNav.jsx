// Top navigation for primary app sections.
import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

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

  return (
    <nav className="navbar">
      <div className="brand">MediTrack</div>
      <div className="nav-links">
        {token ? (
          <>
            <Link to="/">Patients</Link>
            <Link to="/patients/new">Add Patient</Link>
            <Link to="/notifications">Notifications</Link>
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
