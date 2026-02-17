import React, { useState, useEffect } from 'react';
import Map from './components/Map';
import DriverDashboard from './components/DriverDashboard';
import axios from 'axios';
import {
  Container, AppBar, Toolbar, Typography, Paper, Grid,
  TextField, Select, MenuItem, Button, Box, Snackbar, Alert,
  createTheme, ThemeProvider, CssBaseline, List, ListItem,
  ListItemText, Chip, FormControl, InputLabel
} from '@mui/material';
import './App.css';

// Smart default: if localhost, use 8000; otherwise assume standard Render URL format
// Smart default: handle localhost, 127.0.0.1, or production
const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const API_URL = process.env.REACT_APP_API_URL || (isLocal ? 'http://localhost:8000' : 'https://cargovan-backend.onrender.com');

const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb', // Brand Blue
    },
    secondary: {
      main: '#64748b', // Slate
    },
    background: {
      default: '#f0f2f5',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 800,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 16,
        },
      },
    },
  },
});

function App() {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [vanSize, setVanSize] = useState('small');
  const [timeSlot, setTimeSlot] = useState('8:00 AM - 10:00 AM');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [toll, setToll] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 5000); // update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API_URL}/bookings/`);
      console.log('Fetched bookings:', res.data); // Added logging
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBook = async () => {
    if (!pickup || !dropoff) return;
    setLoading(true);
    setError('');
    const bookingPayload = {
      user_id: 1, // Static or dummy user id
      van_id: 1,
      status: 'pending',
      pickup_location: pickup,
      dropoff_location: dropoff,
      scheduled_time: new Date().toISOString(),
      van_size: vanSize,
      time_slot: timeSlot,
      distance: distance, // Include distance in payload
      duration_minutes: parseInt(duration) || 0,
      toll: parseFloat(toll) || 0
    };
    try {
      await axios.post(`${API_URL}/bookings/`, bookingPayload);
      setPickup('');
      setDropoff('');
      setDistance('');
      setDuration('');
      setToll('');
      setVanSize('small');
      setTimeSlot('8:00 AM - 10:00 AM');
      setSuccessMsg('Booking created successfully!');
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" color="transparent" elevation={0} sx={{ bgcolor: 'white', mb: 4 }}>
        <Toolbar>
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            CargoVan Connect
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Row 1: Booking Form (Left) & Map (Right) */}
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 4, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Book a Van</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Pickup Location"
                    variant="outlined"
                    value={pickup}
                    onChange={e => setPickup(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Drop-off Location"
                    variant="outlined"
                    value={dropoff}
                    onChange={e => setDropoff(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Van Size</InputLabel>
                    <Select
                      value={vanSize}
                      label="Van Size"
                      onChange={e => setVanSize(e.target.value)}
                    >
                      <MenuItem value="small">Small</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="large">Large</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Time Slot</InputLabel>
                    <Select
                      value={timeSlot}
                      label="Time Slot"
                      onChange={e => setTimeSlot(e.target.value)}
                    >
                      {[
                        "8:00 AM - 10:00 AM",
                        "10:00 AM - 12:00 PM",
                        "12:00 PM - 2:00 PM",
                        "2:00 PM - 4:00 PM",
                        "4:00 PM - 6:00 PM",
                        "6:00 PM - 8:00 PM",
                        "8:00 PM - 10:00 PM",
                        "10:00 PM - 12:00 AM"
                      ].map(slot => (
                        <MenuItem key={slot} value={slot}>
                          {slot}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  {/* Fare Display */}
                  {console.log("Rendering Fare Box with:", { distance, duration })}
                  {distance ? (
                    <Box sx={{ mb: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                      <Typography variant="subtitle2" color="text.secondary">Fare</Typography>
                      <Typography variant="h4" color="primary" fontWeight="700">
                        ${(20 + (2 * (parseFloat(distance) || 0)) + (0.5 * (parseFloat(duration) || 0))).toFixed(2)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Includes: Base ($20) + Distance (${(2 * (parseFloat(distance) || 0)).toFixed(2)}) + Time (${(0.5 * (parseFloat(duration) || 0)).toFixed(2)})
                      </Typography>
                    </Box>
                  ) : null}

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={!pickup || !dropoff || loading}
                    onClick={handleBook}
                    sx={{ height: '56px', mt: 1 }}
                  >
                    {loading ? 'Booking...' : 'Book Now'}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            {/* Map */}
            <Box sx={{ mb: 4, border: '4px solid white', borderRadius: 4, overflow: 'hidden', boxShadow: 1 }}>
              <Map
                pickup={pickup}
                dropoff={dropoff}
                setPickup={setPickup}
                setDropoff={setDropoff}
                setDistance={setDistance}
                setDuration={setDuration}
              />
            </Box>
          </Grid>

          {/* Row 2: User Bookings (Left) & Driver Dashboard (Right) */}
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>My Bookings</Typography>
              {bookings.length === 0 ? (
                <Typography color="text.secondary">No bookings yet.</Typography>
              ) : (
                <List>
                  {bookings.map(b => (
                    <ListItem key={b.id} divider alignItems="flex-start" sx={{ px: 0 }}>
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
                              {b.van_size} van • {b.time_slot}
                            </Typography>
                            {b.distance != null && b.distance !== "" && (
                              <Chip label={`${b.distance} miles`} size="small" variant="outlined" />
                            )}
                            {b.fare != null && (
                              <Chip label={`$${parseFloat(b.fare).toFixed(2)}`} size="small" color="primary" variant="filled" />
                            )}
                            <Chip label={b.status} color={getStatusColor(b.status)} size="small" />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <DriverDashboard />
          </Grid>
        </Grid>
      </Container>

      {/* Notifications */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      <Snackbar open={!!successMsg} autoHideDuration={6000} onClose={() => setSuccessMsg('')}>
        <Alert onClose={() => setSuccessMsg('')} severity="success" sx={{ width: '100%' }}>
          {successMsg}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;
