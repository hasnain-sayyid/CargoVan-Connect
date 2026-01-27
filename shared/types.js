// Shared types for CargoVan Connect
// Use TypeScript or JSDoc for type safety in both frontend and backend.

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} role // 'customer' | 'driver' | 'admin'
 */

/**
 * @typedef {Object} Booking
 * @property {string} id
 * @property {string} userId
 * @property {string} vanId
 * @property {string} status // 'pending' | 'accepted' | 'in-progress' | 'completed' | 'cancelled'
 * @property {string} pickupLocation
 * @property {string} dropoffLocation
 * @property {string} scheduledTime
 */
