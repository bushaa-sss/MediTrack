// Login screen for doctors.
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);
  const demoApiAvailable = Boolean(import.meta.env.VITE_DEMO_API_BASE_URL);
  const demoEmail = import.meta.env.VITE_DEMO_LOGIN_EMAIL || 'publicdemo@clinic.com';
  const demoPassword = import.meta.env.VITE_DEMO_LOGIN_PASSWORD || 'PreviewOnly2026!';

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'identifier') {
      setForm((prev) => ({ ...prev, [name]: value.trim().toLowerCase() }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDemoLogin = async () => {
    setError('');
    setDemoLoading(true);
    try {
      await login({ email: demoEmail, password: demoPassword }, { demo: true });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Demo is temporarily unavailable');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const identifier = form.identifier;
      if (!identifier) {
        setError('Email or username is required');
        return;
      }
      if (identifier.includes('@') && !identifier.endsWith('@clinic.com')) {
        setError('Email must end with @clinic.com');
        return;
      }
      if (!identifier.includes('@') && !/^[a-zA-Z0-9._-]{3,20}$/.test(identifier)) {
        setError('Username must be 3-20 characters (letters, numbers, . _ -)');
        return;
      }

      await login({
        email: identifier.includes('@') ? identifier : undefined,
        username: !identifier.includes('@') ? identifier : undefined,
        password: form.password
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="eyebrow">MediTrack</div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to manage patients and follow-ups.</p>
        {error && <div className="notice">{error}</div>}
        <form className="form-row" onSubmit={handleSubmit}>
          <div className={`field ${form.identifier ? 'filled' : ''}`}>
            <input
              id="identifier"
              name="identifier"
              type="text"
              placeholder=" "
              value={form.identifier}
              onChange={handleChange}
              required
            />
            <label htmlFor="identifier">Email or Username</label>
          </div>
          <div className={`field ${form.password ? 'filled' : ''}`}>
            <input
              id="password"
              name="password"
              type="password"
              placeholder=" "
              value={form.password}
              onChange={handleChange}
              required
            />
            <label htmlFor="password">Password</label>
          </div>
          <button type="submit">Login</button>
        </form>
        {demoApiAvailable && (
          <div className="card" style={{ marginTop: '18px' }}>
            <div className="section-title">Public demo (sample data only)</div>
            <p>Read-only access with synthetic patient records. Do not enter real patient information.</p>
            <div>Email: <strong>{demoEmail}</strong></div>
            <div>Password: <strong>{demoPassword}</strong></div>
            <button type="button" className="secondary" onClick={handleDemoLogin} disabled={demoLoading}>
              {demoLoading ? 'Opening demo...' : 'Open read-only demo'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
