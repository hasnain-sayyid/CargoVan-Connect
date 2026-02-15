import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Paper, Typography, List, ListItem, ListItemText,
  Chip, Button, Box, Alert
} from '@mui/material';

const API_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://cargovan-backend.onrender.com');

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'primary';
      case 'completed': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  return (
    <Paper elevation={1} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Driver Dashboard</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <List>
        {bookings.map(b => (
          <ListItem key={b.id} divider alignItems="flex-start" sx={{ px: 0, flexDirection: 'column', alignItems: 'stretch' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <ListItemText
                primary={
                  <Typography variant="subtitle1" fontWeight="600">
                    {b.pickup_location} → {b.dropoff_location}
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" component="span" color="text.secondary">
                    Van: {b.van_size} • {b.time_slot}
                    {b.fare && ` • $${b.fare}`}
                  </Typography>
                }
              />
              <Chip label={b.status} color={getStatusColor(b.status)} size="small" />
            </Box>

            {b.status === 'pending' && (
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button variant="contained" size="small" disabled={loading} onClick={() => updateStatus(b.id, 'accepted')}>Top-up/Accept</Button>
                <Button variant="outlined" color="error" size="small" disabled={loading} onClick={() => updateStatus(b.id, 'rejected')}>Reject</Button>
              </Box>
            )}
            {b.status === 'accepted' && (
              <Box sx={{ mt: 1 }}>
                <Button variant="contained" color="success" size="small" disabled={loading} onClick={() => updateStatus(b.id, 'completed')}>Complete Trip</Button>
              </Box>
            )}
          </ListItem>
        ))}
        {bookings.length === 0 && <Typography color="text.secondary">No bookings to manage.</Typography>}
      </List>
    </Paper>
  );
}

export default DriverDashboard;
