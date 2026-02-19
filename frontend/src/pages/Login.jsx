// Login screen for doctors.
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'identifier') {
      setForm((prev) => ({ ...prev, [name]: value.trim().toLowerCase() }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
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
      </div>
    </div>
  );
};

export default Login;
