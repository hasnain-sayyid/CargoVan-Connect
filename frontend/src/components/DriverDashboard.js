import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function DriverDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API_URL}/bookings/`);
      setBookings(res.data);
    } catch (err) {
      setError('Could not fetch bookings');
    }
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id, status) => {
    setLoading(true);
    setError('');
    try {
      await axios.patch(`${API_URL}/bookings/${id}/status?status=${status}`);
      fetchBookings();
    } catch (err) {
      setError('Failed to update booking');
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Driver Dashboard</h2>
      {error && <div className="error-message">{error}</div>}
      <ul className="booking-list">
        {bookings.map(b => (
          <li key={b.id} className="booking-item">
            <div className="booking-route">
              {b.pickup_location} → {b.dropoff_location}
            </div>
            <div className="booking-details">
              <span>Van: {b.van_size}</span> •
              <span>{b.time_slot}</span> •
              <span className={`status-badge status-${b.status}`}>{b.status}</span>
            </div>
            {b.status === 'pending' && (
              <div className="action-buttons">
                <button className="btn-small btn-accept" disabled={loading} onClick={() => updateStatus(b.id, 'accepted')}>Accept</button>
                <button className="btn-small btn-reject" disabled={loading} onClick={() => updateStatus(b.id, 'rejected')}>Reject</button>
              </div>
            )}
            {b.status === 'accepted' && (
              <div className="action-buttons">
                <button className="btn-small btn-complete" disabled={loading} onClick={() => updateStatus(b.id, 'completed')}>Complete Trip</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DriverDashboard;
