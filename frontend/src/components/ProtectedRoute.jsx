// Protect routes that require a logged-in doctor, optionally restricted to
// specific roles (e.g. <ProtectedRoute roles={['admin']}>). This is a UX layer
// only — every sensitive backend endpoint enforces its own role check too.
import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Forbidden from '../pages/Forbidden';

const ProtectedRoute = ({ children, roles }) => {
  const { token, doctor, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="container">
        <div className="card">Loading your workspace...</div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(doctor?.role || 'doctor')) {
    return <Forbidden />;
  }

  return children;
};

export default ProtectedRoute;