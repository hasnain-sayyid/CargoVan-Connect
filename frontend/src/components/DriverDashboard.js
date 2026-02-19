import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Paper, Typography, List, ListItem, ListItemText,
  Chip, Button, Box, Alert
} from '@mui/material';

const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const API_URL = process.env.REACT_APP_API_URL || (isLocal ? 'http://localhost:8000' : 'https://cargovan-backend.onrender.com');

function DriverDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API_URL}/bookings/`);
      const statusPriority = {
        'pending': 1,
        'accepted': 2,
        'completed': 3,
        'rejected': 4
      };

      const sortedData = [...res.data].sort((a, b) => {
        const priorityA = statusPriority[a.status] || 99;
        const priorityB = statusPriority[b.status] || 99;
        if (priorityA !== priorityB) return priorityA - priorityB;
        return b.id - a.id; // Newest first within same status
      });

      setBookings(sortedData);
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
                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#16a34a', minWidth: '45px' }}>FROM:</Typography>
                      <Typography variant="subtitle2" component="span">{b.pickup_location}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#dc2626', minWidth: '45px' }}>TO:</Typography>
                      <Typography variant="subtitle2" component="span">{b.dropoff_location}</Typography>
                    </Box>
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Typography variant="body2" component="span" color="text.secondary">
                      Van: {b.van_size} • {b.time_slot}
                    </Typography>
                    {b.distance != null && b.distance !== "" && (
                      <Chip label={`${b.distance} miles`} size="small" variant="outlined" />
                    )}
                    {b.fare != null && (
                      <Chip label={`$${parseFloat(b.fare).toFixed(2)}`} size="small" color="primary" variant="filled" />
                    )}
                  </Box>
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
