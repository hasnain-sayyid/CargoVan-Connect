
import React, { useState, useEffect } from 'react';
import Map from './components/Map';
import DriverDashboard from './components/DriverDashboard';
import axios from 'axios';
import './App.css';

// Smart default: if localhost, use 8000; otherwise assume standard Render URL format
const API_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://cargovan-backend.onrender.com');

function App() {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [vanSize, setVanSize] = useState('small');
  const [timeSlot, setTimeSlot] = useState('morning');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 5000); // update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API_URL}/bookings/`);
      setBookings(res.data);
    } catch (err) {
      console.error(err);
      // specific error handling removed to avoid spamming UI on poll
    }
  };

  const handleBook = async () => {
    setLoading(true);
    setError('');
    const bookingPayload = {
      user_id: 1, // Static or dummy user id
      van_id: 1,
      status: 'pending',
      pickup_location: pickup || '',
      dropoff_location: dropoff || '',
      scheduled_time: new Date().toISOString(),
      van_size: vanSize || 'small',
      time_slot: timeSlot || 'morning',
    };
    try {
      await axios.post(`${API_URL}/bookings/`, bookingPayload);
      setPickup('');
      setDropoff('');
      setVanSize('small');
      setTimeSlot('morning');
      fetchBookings();
    } catch (err) {
      if (err.response) {
        setError('Booking failed: ' + JSON.stringify(err.response.data));
      } else {
        setError('Booking failed: ' + err.message);
      }
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">CargoVan Connect</h1>
        <p className="app-subtitle">Premium local transport across NY, NJ, and CT.</p>
      </header>

      <section className="booking-form-card">
        <form onSubmit={e => e.preventDefault()}>
          <div className="form-row">
            <input
              className="input-field"
              type="text"
              name="pickup"
              placeholder="Pickup location"
              value={pickup}
              onChange={e => setPickup(e.target.value)}
            />
            <span style={{ color: '#94a3b8' }}>→</span>
            <input
              className="input-field"
              type="text"
              name="dropoff"
              placeholder="Drop-off location"
              value={dropoff}
              onChange={e => setDropoff(e.target.value)}
            />
            <select className="select-field" name="vanSize" value={vanSize} onChange={e => setVanSize(e.target.value)}>
              <option value="small">Small Van</option>
              <option value="medium">Medium Van</option>
              <option value="large">Large Van</option>
            </select>
            <select className="select-field" name="timeSlot" value={timeSlot} onChange={e => setTimeSlot(e.target.value)}>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
            <button className="primary-button" type="button" disabled={!pickup || !dropoff || loading} onClick={handleBook}>
              {loading ? 'Booking...' : 'Book Van'}
            </button>
          </div>
        </form>
        {error && <div className="error-message" style={{ marginTop: '20px' }}>{error}</div>}
      </section>

      <section className="map-container">
        <Map pickup={pickup} dropoff={dropoff} />
      </section>

      <div className="dashboard-section">
        {/* User's Bookings view */}
        <div className="card">
          <h2>My Bookings</h2>
          {bookings.length === 0 ? (
            <p style={{ color: '#64748b' }}>No bookings yet.</p>
          ) : (
            <ul className="booking-list">
              {bookings.map(b => (
                <li key={b.id} className="booking-item">
                  <div className="booking-route">
                    {b.pickup_location} → {b.dropoff_location}
                  </div>
                  <div className="booking-details">
                    <span>{b.van_size} van</span> •
                    <span>{b.time_slot}</span> •
                    <span className={`status-badge status-${b.status}`}>{b.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Driver Dashboard component */}
        <div className="card">
          <DriverDashboard />
        </div>
      </div>
    </div>
  );
}

export default App;
