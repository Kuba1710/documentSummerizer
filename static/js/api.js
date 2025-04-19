/**
 * API module for SciSummarize
 * Handles all backend API requests and responses
 */

// Create global API object
window.API = {};

// Base API URL
const BASE_URL = '/api';

// Default headers for API requests
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

/**
 * Make an API request with error handling
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Fetch API options
 * @returns {Promise<Object>} Response data
 * @throws {Error} If request fails
 */
async function apiRequest(endpoint, options = {}) {
  // Prepare request URL and options
  const url = endpoint.startsWith('/') 
    ? `${BASE_URL}${endpoint}` 
    : `${BASE_URL}/${endpoint}`;
  
  const requestOptions = {
    headers: { ...DEFAULT_HEADERS },
    credentials: 'include', // Include cookies for authentication
    ...options
  };
  
  // Add CSRF token if available
  const csrfToken = getCsrfToken();
  if (csrfToken && (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE')) {
    requestOptions.headers['X-CSRF-Token'] = csrfToken;
  }
  
  // Add authorization token if available
  const authToken = getAuthToken();
  if (authToken) {
    requestOptions.headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  try {
    // Make the request
    const response = await fetch(url, requestOptions);
    
    // Handle different response types
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Check if response was successful
    if (!response.ok) {
      const error = new Error(data.message || response.statusText || 'API request failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    
    // Trigger global error event
    triggerErrorEvent(error);
    
    // Rethrow for handling by caller
    throw error;
  }
}

/**
 * Get CSRF token from meta tag
 * @returns {string|null} CSRF token
 */
function getCsrfToken() {
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  return metaTag ? metaTag.getAttribute('content') : null;
}

/**
 * Get auth token from local storage
 * @returns {string|null} Auth token
 */
function getAuthToken() {
  return localStorage.getItem('auth_token');
}

/**
 * Trigger a global error event
 * @param {Error} error - Error object
 */
function triggerErrorEvent(error) {
  const event = new CustomEvent('api:error', {
    detail: {
      message: error.message,
      status: error.status,
      data: error.data
    }
  });
  
  document.dispatchEvent(event);
}

// Initialize API module
window.API.init = function() {
  console.log('API module initialized');
  return Promise.resolve();
};

// Make apiRequest available globally
window.API.request = apiRequest;

// Document API endpoints
window.API.documents = {
  /**
   * Get all documents for the current user
   * @returns {Promise<Object>} Documents data
   */
  getAll: () => apiRequest('/documents', { method: 'GET' }),
  
  /**
   * Get a single document by ID
   * @param {string} id - Document ID
   * @returns {Promise<Object>} Document data
   */
  getById: (id) => apiRequest(`/documents/${id}`, { method: 'GET' }),
  
  /**
   * Upload a new document
   * @param {FormData} formData - Form data with document file
   * @returns {Promise<Object>} Created document
   */
  upload: (formData) => {
    // Don't set Content-Type header as it's set automatically for FormData
    return apiRequest('/documents/upload', {
      method: 'POST',
      headers: {
        'Accept': 'application/json'
      },
      body: formData,
      credentials: 'include'
    });
  },
  
  /**
   * Delete a document
   * @param {string} id - Document ID
   * @returns {Promise<Object>} Response data
   */
  delete: (id) => apiRequest(`/documents/${id}`, { method: 'DELETE' }),
  
  /**
   * Generate summary for a document
   * @param {string} id - Document ID
   * @param {Object} options - Summary options
   * @returns {Promise<Object>} Summary data
   */
  generateSummary: (id, options) => apiRequest(`/documents/${id}/summarize`, {
    method: 'POST',
    body: JSON.stringify(options)
  }),
  
  /**
   * Export document to different format
   * @param {string} id - Document ID
   * @param {string} format - Export format (pdf, docx, etc.)
   * @returns {Promise<Blob>} Document blob
   */
  export: async (id, format) => {
    const response = await fetch(`${BASE_URL}/documents/${id}/export/${format}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = new Error('Export failed');
      error.status = response.status;
      throw error;
    }
    
    return response.blob();
  }
};

// User API endpoints
window.API.users = {
  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile
   */
  getProfile: () => apiRequest('/users/profile', { method: 'GET' }),
  
  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated profile
   */
  updateProfile: (profileData) => apiRequest('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData)
  }),
  
  /**
   * Change user password
   * @param {Object} passwordData - Password data
   * @returns {Promise<Object>} Response data
   */
  changePassword: (passwordData) => apiRequest('/users/password', {
    method: 'PUT',
    body: JSON.stringify(passwordData)
  })
};

// Feedback API endpoints
window.API.feedback = {
  /**
   * Submit user feedback
   * @param {Object} feedbackData - Feedback data
   * @returns {Promise<Object>} Response data
   */
  submit: (feedbackData) => apiRequest('/feedback', {
    method: 'POST',
    body: JSON.stringify(feedbackData)
  })
};

// Settings API endpoints
window.API.settings = {
  /**
   * Get user settings
   * @returns {Promise<Object>} Settings data
   */
  get: () => apiRequest('/settings', { method: 'GET' }),
  
  /**
   * Update user settings
   * @param {Object} settingsData - Settings data
   * @returns {Promise<Object>} Updated settings
   */
  update: (settingsData) => apiRequest('/settings', {
    method: 'PUT',
    body: JSON.stringify(settingsData)
  })
}; 