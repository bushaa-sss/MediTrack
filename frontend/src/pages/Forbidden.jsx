// Shown when a logged-in user's role doesn't allow access to a route.
import { Link } from 'react-router-dom';

const Forbidden = () => (
  <div className="container">
    <div className="card">
      <div className="section-title">Access Denied</div>
      <div className="notice">You don't have permission to view this page.</div>
      <Link to="/">
        <button>Go to Dashboard</button>
      </Link>
    </div>
  </div>
);

export default Forbidden;
