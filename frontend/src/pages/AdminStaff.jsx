// Admin-only staff management: list staff and create/change roles.
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { createStaff, listStaff, updateStaffRole, updateStaffStatus } from '../services/adminService';

const ROLE_OPTIONS = ['doctor', 'receptionist', 'admin'];

const emptyForm = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  role: 'receptionist'
};

const AdminStaff = () => {
  const { doctor: currentAdmin } = useContext(AuthContext);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadStaff = async () => {
    try {
      const data = await listStaff();
      setStaff(data.staff);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load staff');
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await createStaff(form);
      setNotice('Staff account created.');
      setForm(emptyForm);
      await loadStaff();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create staff account');
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await updateStaffRole(id, role);
      setNotice('Role updated.');
      await loadStaff();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleStatusToggle = async (id, isActive) => {
    try {
      await updateStaffStatus(id, isActive);
      setNotice(isActive ? 'Account activated.' : 'Account deactivated.');
      await loadStaff();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update account status');
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <div className="eyebrow">Administration</div>
          <h1>Staff & Roles</h1>
          <p>Create staff accounts and manage their roles.</p>
        </div>
      </div>

      {notice && <div className="notice">{notice}</div>}
      {error && <div className="notice">{error}</div>}

      <form className="card stack-form" onSubmit={handleCreate}>
        <div className="section-title">New Staff Account</div>
        <div className="form-row">
          <div className={`field ${form.firstName ? 'filled' : ''}`}>
            <input id="firstName" name="firstName" placeholder=" " value={form.firstName} onChange={handleChange} required />
            <label htmlFor="firstName">First Name</label>
          </div>
          <div className={`field ${form.lastName ? 'filled' : ''}`}>
            <input id="lastName" name="lastName" placeholder=" " value={form.lastName} onChange={handleChange} required />
            <label htmlFor="lastName">Last Name</label>
          </div>
        </div>
        <div className={`field ${form.username ? 'filled' : ''}`}>
          <input id="username" name="username" placeholder=" " value={form.username} onChange={handleChange} required />
          <label htmlFor="username">Username</label>
        </div>
        <div className={`field ${form.email ? 'filled' : ''}`}>
          <input id="email" name="email" type="email" placeholder=" " value={form.email} onChange={handleChange} required />
          <label htmlFor="email">Email (@clinic.com)</label>
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
        <div className="form-row">
          <select name="role" value={form.role} onChange={handleChange}>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
        <button type="submit">Create Staff Account</button>
      </form>

      <div className="card">
        <div className="section-title">Staff</div>
        <div className="list">
          {staff.length === 0 && <div className="notice">No staff accounts yet.</div>}
          {staff.map((member) => {
            const isSelf = member._id === currentAdmin?.id;
            return (
              <div className="list-item" key={member._id}>
                <strong>{member.name || `${member.firstName} ${member.lastName}`}</strong>
                <div>{member.email}</div>
                <span className="badge" data-gender={member.isActive === false ? 'other' : 'female'}>
                  {member.isActive === false ? 'Inactive' : 'Active'}
                </span>
                <div className="inline-actions">
                  <select
                    value={member.role}
                    disabled={isSelf}
                    onChange={(event) => handleRoleChange(member._id, event.target.value)}
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  {!isSelf && (
                    <button
                      className="secondary"
                      onClick={() => handleStatusToggle(member._id, member.isActive === false)}
                    >
                      {member.isActive === false ? 'Activate' : 'Deactivate'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminStaff;
