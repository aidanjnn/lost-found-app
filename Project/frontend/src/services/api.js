/**
 * API Service
 * Sprint 3: Item Claiming System
 * 
 * Handles all API calls to the backend.
 * Includes authentication, items, and claims endpoints.
 * 
 * Author: Team 15 (Ruhani, Sheehan, Aidan, Neng, Theni)
 * Sprint: 3
 */

import axios from 'axios'

// Use relative URLs so Vite proxy handles the routing
// This works whether backend is on same origin or proxied
const API_BASE_URL = ''

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Include cookies for session management
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor (can add auth tokens here if needed)
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on 401 - let pages handle their own auth errors
    // This prevents infinite redirect loops
    return Promise.reject(error)
  }
)

/**
 * Items API
 */
export const itemsAPI = {
  /**
   * Get all lost items (legacy - no filters)
   * @returns {Promise} Array of items
   */
  getAllItems: async () => {
    const response = await api.get('/api/items')
    return response.data
  },

  /**
   * Get items with search, filters, sorting, and pagination
   * Sprint 3: Search and Filtering
   * @param {string} queryString - Pre-built query string (e.g., "search=wallet&page=1")
   * @returns {Promise} Items and pagination data
   */
  getItems: async (queryString = '') => {
    const url = queryString ? `/api/items?${queryString}` : '/api/items'
    const response = await api.get(url)
    return response.data
  },

  /**
   * Get a single item by ID
   * @param {number} itemId - Item identifier
   * @returns {Promise} Item data
   */
  getItemById: async (itemId) => {
    const response = await api.get(`/api/items/${itemId}`)
    return response.data
  },

  /**
   * Create a new item (staff only)
   * @param {Object} itemData - Item data
   * @returns {Promise} Created item
   */
  createItem: async (itemData) => {
    const response = await api.post('/api/items', itemData)
    return response.data
  },

  /**
   * Update an existing item (staff only)
   * @param {number} itemId - Item ID
   * @param {Object} itemData - Updated item data
   * @returns {Promise} Updated item
   */
  updateItem: async (itemId, itemData) => {
    const response = await api.put(`/api/items/${itemId}`, itemData)
    return response.data
  },

  /**
   * Get archived items (staff only)
   * Sprint 3: Pickup Tracking
   * @returns {Promise} Archived items with claim details
   */
  getArchivedItems: async () => {
    const response = await api.get('/api/items/archived')
    return response.data
  },

  /**
   * Export items to CSV
   * Sprint 4: Issue #45 - Data Export
   * Staff only
   * @param {string} status - Filter by status (optional)
   * @param {string} category - Filter by category (optional)
   * @returns {Promise} CSV file blob
   */
  exportItemsCSV: async (status = null, category = null) => {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    if (category) params.append('category', category)
    
    const response = await api.get(`/api/export/items/csv?${params.toString()}`, {
      responseType: 'blob'
    })
    return response
  },

  /**
   * Delete an item (soft delete)
   * Sprint 4: Issue #44 - Delete Item
   * Staff only
   * @param {number} itemId - ID of item to delete
   * @returns {Promise} Deletion confirmation
   */
  deleteItem: async (itemId) => {
    const response = await api.delete(`/api/items/${itemId}`)
    return response.data
  },
}

/**
 * Claims API - Sprint 3
 */
export const claimsAPI = {
  /**
   * Create a new claim for an item
   * @param {Object} claimData - Claim data (item_id, verification_text, phone)
   * @returns {Promise} Created claim
   */
  createClaim: async (claimData) => {
    const response = await api.post('/api/claims', claimData)
    return response.data
  },

  /**
   * Get all claims for current user (or all claims if staff)
   * @param {Object} filters - Optional filters (status, item_id)
   * @returns {Promise} Array of claims
   */
  getClaims: async (filters = {}) => {
    const params = new URLSearchParams(filters)
    const response = await api.get(`/api/claims?${params}`)
    return response.data
  },

  /**
   * Get details of a specific claim
   * @param {number} claimId - Claim ID
   * @returns {Promise} Claim details
   */
  getClaimById: async (claimId) => {
    const response = await api.get(`/api/claims/${claimId}`)
    return response.data
  },

  /**
   * Update claim status (staff only)
   * @param {number} claimId - Claim ID
   * @param {Object} updateData - Update data (status, staff_notes)
   * @returns {Promise} Updated claim
   */
  updateClaimStatus: async (claimId, updateData) => {
    const response = await api.patch(`/api/claims/${claimId}`, updateData)
    return response.data
  },

  /**
   * Export claims to CSV
   * Sprint 4: Issue #45 - Data Export
   * Staff only
   * @param {string} status - Filter by status (optional)
   * @returns {Promise} CSV file blob
   */
  exportClaimsCSV: async (status = null) => {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    
    const response = await api.get(`/api/export/claims/csv?${params.toString()}`, {
      responseType: 'blob'
    })
    return response
  },
}

// Session cache to prevent repeated verify-session calls
let sessionCache = {
  data: null,
  timestamp: 0,
  ttl: 5000 // Cache for 5 seconds
};

/**
 * Authentication API
 */
export const authAPI = {
  /**
   * Login with email and password
   * @param {string} email - User email (@uwaterloo.ca)
   * @param {string} password - User password
   * @returns {Promise} User information and session
   */
  login: async (email, password) => {
    // Clear cache on login
    sessionCache = { data: null, timestamp: 0, ttl: 5000 };
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },

  /**
   * Register a new user
   * @param {Object} userData - Registration data
   * @returns {Promise} User information
   */
  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  /**
   * Logout current user
   * @returns {Promise} Logout confirmation
   */
  logout: async () => {
    // Clear session cache on logout
    sessionCache = { data: null, timestamp: 0, ttl: 5000 };
    const response = await api.post('/auth/logout')
    return response.data
  },

  /**
   * Verify current session (with caching to prevent spam)
   * @returns {Promise} User information if authenticated
   */
  verifySession: async () => {
    // Check cache first
    const now = Date.now();
    if (sessionCache.data && (now - sessionCache.timestamp) < sessionCache.ttl) {
      return sessionCache.data;
    }

    try {
      const response = await api.get('/auth/verify-session')
      // Cache successful response
      sessionCache.data = response.data;
      sessionCache.timestamp = now;
      return response.data
    } catch (error) {
      // Cache failed response too (for 2 seconds) to prevent spam
      sessionCache.data = { valid: false };
      sessionCache.timestamp = now;
      sessionCache.ttl = 2000; // Shorter TTL for failed checks
      throw error;
    }
  },

  /**
   * Get current user
   * @returns {Promise} Current user information
   */
  getCurrentUser: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },
}

/**
 * Analytics API
 * Sprint 4: Analytics Dashboard
 */
export const analyticsAPI = {
  /**
   * Get comprehensive analytics dashboard data
   * Staff only
   * @returns {Promise} Analytics data including counts, charts, and recent activity
   */
  getDashboardAnalytics: async () => {
    const response = await api.get('/api/analytics/dashboard')
    return response.data
  },
}

/**
 * Notifications API
 */
export const notificationsAPI = {
  /**
   * Get notifications for the current user
   * @param {Object} filters - Optional filters (status, limit)
   * @returns {Promise} Notifications list
   */
  getNotifications: async (filters = {}) => {
    const params = new URLSearchParams(filters)
    const queryString = params.toString()
    const response = await api.get(queryString ? `/api/notifications?${queryString}` : '/api/notifications')
    return response.data
  },

  /**
   * Mark a notification as read
   * @param {number} notificationId - Notification identifier
   * @returns {Promise} Confirmation message
   */
  markAsRead: async (notificationId) => {
    const response = await api.patch(`/api/notifications/${notificationId}/read`)
    return response.data
  }
}

export default api

