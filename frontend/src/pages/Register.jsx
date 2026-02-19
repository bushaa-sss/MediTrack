// Registration screen for doctors.
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'username') {
      const cleaned = value.replace(/\s+/g, '').toLowerCase();
      setForm((prev) => ({ ...prev, [name]: cleaned }));
      return;
    }
    if (name === 'email') {
      setForm((prev) => ({ ...prev, [name]: value.toLowerCase() }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      if (!form.email.endsWith('@clinic.com')) {
        setError('Email must end with @clinic.com');
        return;
      }
      if (!/^[a-zA-Z0-9._-]{3,20}$/.test(form.username)) {
        setError('Username must be 3-20 characters (letters, numbers, . _ -)');
        return;
      }
      if (form.password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="eyebrow">MediTrack</div>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Set up your clinic profile in a few minutes.</p>
        {error && <div className="notice">{error}</div>}
        <form className="form-row" onSubmit={handleSubmit}>
          <div className={`field ${form.firstName ? 'filled' : ''}`}>
            <input
              id="firstName"
              name="firstName"
              placeholder=" "
              value={form.firstName}
              onChange={handleChange}
              required
            />
            <label htmlFor="firstName">First Name</label>
          </div>
          <div className={`field ${form.lastName ? 'filled' : ''}`}>
            <input
              id="lastName"
              name="lastName"
              placeholder=" "
              value={form.lastName}
              onChange={handleChange}
              required
            />
            <label htmlFor="lastName">Last Name</label>
          </div>
          <div className={`field ${form.username ? 'filled' : ''}`}>
            <input
              id="username"
              name="username"
              placeholder=" "
              value={form.username}
              onChange={handleChange}
              required
            />
            <label htmlFor="username">Username</label>
          </div>
          <div className={`field ${form.email ? 'filled' : ''}`}>
            <input
              id="email"
              name="email"
              type="email"
              pattern="^[^@\\s]+@clinic\\.com$"
              placeholder=" "
              value={form.email}
              onChange={handleChange}
              required
            />
            <label htmlFor="email">Email</label>
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
          <button type="submit">Create Account</button>
        </form>
      </div>
    </div>
  );
};

export default Register;
