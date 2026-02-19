// Notification log page.
import { useEffect, useState } from 'react';
import { getNotifications } from '../services/notificationService';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getNotifications();
        setNotifications(data.notifications);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load notifications');
      }
    };

    load();
  }, []);

  return (
    <div className="container">
      <div className="card">
        <div className="section-title">Notification History</div>
        {error && <div className="notice">{error}</div>}
        <div className="list">
          {notifications.length === 0 && <div className="notice">No notifications yet.</div>}
          {notifications.map((note) => (
            <div className="list-item" key={note._id}>
              <strong>{note.title}</strong>
              <div>{note.body}</div>
              <div>{new Date(note.sentAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Notifications;