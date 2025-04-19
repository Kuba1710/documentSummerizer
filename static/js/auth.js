/**
 * Authentication module for SciSummarize
 * Handles user login, registration, and session management
 */

import { apiRequest } from './api.js';

// Current authenticated user
let currentUser = null;

// Listeners for auth state changes
const authListeners = [];

/**
 * Initialize the authentication module
 * Sets up event listeners and checks current auth state
 */
export function init() {
  // Check if user is already logged in
  checkAuthStatus();
  
  // Add event listeners for auth forms
  document.addEventListener('DOMContentLoaded', () => {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }
    
    // Registration form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', handleRegister);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Update UI based on current auth state
    updateAuthUI();
  });
}

/**
 * Check if user is currently authenticated
 * @returns {boolean} Authentication status
 */
export function isAuthenticated() {
  const token = localStorage.getItem('auth_token');
  if (!token) return false;
  
  // Check if token has expired
  const expiration = localStorage.getItem('token_expiration');
  if (expiration) {
    const expirationDate = new Date(expiration);
    if (expirationDate < new Date()) {
      // Token expired, clean up
      logout();
      return false;
    }
  }
  
  return !!currentUser;
}

/**
 * Get the current authenticated user
 * @returns {Object|null} Current user or null if not authenticated
 */
export function getCurrentUser() {
  return currentUser;
}

/**
 * Check authentication status and load user data if token exists
 */
export async function checkAuthStatus() {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    setCurrentUser(null);
    return;
  }
  
  try {
    toggleLoading(true);
    const userData = await apiRequest('/auth/me', { method: 'GET' });
    setCurrentUser(userData);
  } catch (error) {
    console.error('Failed to get user data:', error);
    // Clear invalid auth data
    logout();
  } finally {
    toggleLoading(false);
  }
}

/**
 * Handle login form submission
 * @param {Event} event - Form submit event
 */
async function handleLogin(event) {
  event.preventDefault();
  
  const form = event.target;
  const email = form.querySelector('[name="email"]').value;
  const password = form.querySelector('[name="password"]').value;
  const rememberMe = form.querySelector('[name="remember"]')?.checked || false;
  
  try {
    toggleLoading(true);
    
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe })
    });
    
    // Store auth token
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
      
      // Set token expiration if remember me is checked
      if (rememberMe) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30);
        localStorage.setItem('token_expiration', expirationDate.toISOString());
      } else {
        localStorage.removeItem('token_expiration');
      }
    }
    
    // Update current user
    setCurrentUser(data.user);
    
    // Show success message
    showAuthSuccess('Login successful!');
    
    // Redirect if needed
    const redirectUrl = form.dataset.redirectUrl || '/dashboard';
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 1000);
    
  } catch (error) {
    showAuthError(error.message || 'Login failed. Please check your credentials.');
    console.error('Login error:', error);
  } finally {
    toggleLoading(false);
  }
}

/**
 * Handle registration form submission
 * @param {Event} event - Form submit event
 */
async function handleRegister(event) {
  event.preventDefault();
  
  const form = event.target;
  const name = form.querySelector('[name="name"]').value;
  const email = form.querySelector('[name="email"]').value;
  const password = form.querySelector('[name="password"]').value;
  const passwordConfirm = form.querySelector('[name="password_confirm"]').value;
  
  // Validate password match
  if (password !== passwordConfirm) {
    showAuthError('Passwords do not match');
    return;
  }
  
  try {
    toggleLoading(true);
    
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    
    // Show success message
    showAuthSuccess('Registration successful! You can now log in.');
    
    // Auto-redirect to login if specified
    const redirectToLogin = form.dataset.redirectToLogin === 'true';
    if (redirectToLogin) {
      setTimeout(() => {
        window.location.href = form.dataset.loginUrl || '/login';
      }, 1500);
    }
    
  } catch (error) {
    showAuthError(error.message || 'Registration failed. Please try again.');
    console.error('Registration error:', error);
  } finally {
    toggleLoading(false);
  }
}

/**
 * Handle logout button click
 * @param {Event} event - Click event
 */
async function handleLogout(event) {
  event.preventDefault();
  
  try {
    toggleLoading(true);
    await logout();
    
    // Show success message
    showAuthSuccess('You have been successfully logged out.');
    
    // Redirect to home page
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
    
  } catch (error) {
    console.error('Logout error:', error);
    
    // Force logout even if API call fails
    forceLogout();
    window.location.href = '/';
  } finally {
    toggleLoading(false);
  }
}

/**
 * Log out the current user
 * @returns {Promise<void>}
 */
export async function logout() {
  try {
    // Call logout API
    await apiRequest('/auth/logout', { method: 'POST' });
  } finally {
    // Always clean up local state even if API call fails
    forceLogout();
  }
}

/**
 * Force logout without API call
 * Used for error recovery
 */
function forceLogout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('token_expiration');
  setCurrentUser(null);
}

/**
 * Register a listener for auth state changes
 * @param {Function} listener - Callback function
 */
export function onAuthStateChanged(listener) {
  if (typeof listener === 'function' && !authListeners.includes(listener)) {
    authListeners.push(listener);
  }
  
  // Execute immediately with current state
  listener(currentUser);
  
  // Return unsubscribe function
  return () => {
    const index = authListeners.indexOf(listener);
    if (index !== -1) {
      authListeners.splice(index, 1);
    }
  };
}

/**
 * Set the current user and notify listeners
 * @param {Object|null} user - User data or null
 */
function setCurrentUser(user) {
  const userChanged = JSON.stringify(user) !== JSON.stringify(currentUser);
  currentUser = user;
  
  if (userChanged) {
    // Update UI
    updateAuthUI();
    
    // Notify listeners
    authListeners.forEach(listener => {
      try {
        listener(currentUser);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }
}

/**
 * Update UI elements based on authentication state
 */
function updateAuthUI() {
  const isLoggedIn = isAuthenticated();
  
  // Update authenticated sections visibility
  document.querySelectorAll('[data-auth-show]').forEach(element => {
    const showWhen = element.dataset.authShow;
    if (showWhen === 'authenticated' && isLoggedIn) {
      element.style.display = '';
    } else if (showWhen === 'unauthenticated' && !isLoggedIn) {
      element.style.display = '';
    } else {
      element.style.display = 'none';
    }
  });
  
  // Update user info if available
  if (isLoggedIn && currentUser) {
    document.querySelectorAll('[data-user-name]').forEach(element => {
      element.textContent = currentUser.name;
    });
    
    document.querySelectorAll('[data-user-email]').forEach(element => {
      element.textContent = currentUser.email;
    });
  }
}

/**
 * Show authentication error message
 * @param {string} message - Error message
 */
function showAuthError(message) {
  const errorElements = document.querySelectorAll('.auth-error');
  errorElements.forEach(element => {
    element.textContent = message;
    element.style.display = 'block';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      element.style.display = 'none';
    }, 5000);
  });
}

/**
 * Show authentication success message
 * @param {string} message - Success message
 */
function showAuthSuccess(message) {
  const successElements = document.querySelectorAll('.auth-success');
  successElements.forEach(element => {
    element.textContent = message;
    element.style.display = 'block';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      element.style.display = 'none';
    }, 5000);
  });
}

/**
 * Toggle loading state
 * @param {boolean} isLoading - Whether loading is active
 */
function toggleLoading(isLoading) {
  document.querySelectorAll('.auth-loading').forEach(element => {
    element.style.display = isLoading ? 'block' : 'none';
  });
  
  // Disable form elements during loading
  document.querySelectorAll('.auth-form button, .auth-form input').forEach(element => {
    element.disabled = isLoading;
  });
}

// Initialize the module
init(); 