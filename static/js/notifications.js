/**
 * Notifications Module - Handles in-app notifications for SciSummarize
 * Manages notification display, user preferences, and notification history
 */

import { getNotifications, markNotificationRead, updateNotificationPreferences } from './api.js';

// DOM Elements cache
let notificationContainer;
let notificationToggle;
let notificationPanel;
let notificationList;
let notificationCount;
let preferencesForm;
let notificationClearAll;
let emptyStateElement;

// Notification state
const state = {
  notifications: [],
  unreadCount: 0,
  panelOpen: false,
  loading: false,
  preferences: {
    summaryCompleted: true,
    documentProcessed: true,
    systemUpdates: true,
    emailNotifications: false,
    desktopNotifications: false
  }
};

// Notification types and their display properties
const notificationTypes = {
  summaryCompleted: {
    icon: 'icon-summary',
    color: '#4caf50', // Green
    title: 'Summary Completed',
    description: 'Your document has been successfully summarized.'
  },
  documentProcessed: {
    icon: 'icon-document',
    color: '#2196f3', // Blue
    title: 'Document Processed',
    description: 'Your document has been processed and is ready to view.'
  },
  systemUpdate: {
    icon: 'icon-info',
    color: '#ff9800', // Orange
    title: 'System Update',
    description: 'SciSummarize has been updated with new features.'
  },
  feedbackResponse: {
    icon: 'icon-feedback',
    color: '#9c27b0', // Purple
    title: 'Feedback Response',
    description: 'Your feedback has received a response.'
  },
  error: {
    icon: 'icon-error',
    color: '#f44336', // Red
    title: 'Error',
    description: 'An error has occurred.'
  }
};

/**
 * Initialize the notifications module
 */
function init() {
  cacheElements();
  setupEventListeners();
  loadNotifications();
  checkBrowserPermissions();
  
  // Set up auto-refresh interval (every 2 minutes)
  setInterval(loadNotifications, 2 * 60 * 1000);
}

/**
 * Cache DOM elements for performance
 */
function cacheElements() {
  notificationContainer = document.getElementById('notificationContainer');
  notificationToggle = document.getElementById('notificationToggle');
  notificationPanel = document.getElementById('notificationPanel');
  notificationList = document.getElementById('notificationList');
  notificationCount = document.getElementById('notificationCount');
  preferencesForm = document.getElementById('notificationPreferences');
  notificationClearAll = document.getElementById('clearAllNotifications');
  emptyStateElement = document.getElementById('noNotifications');
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Toggle notification panel
  if (notificationToggle) {
    notificationToggle.addEventListener('click', toggleNotificationPanel);
  }
  
  // Close panel when clicking outside
  document.addEventListener('click', (event) => {
    if (notificationPanel && 
        state.panelOpen && 
        !notificationContainer.contains(event.target)) {
      toggleNotificationPanel();
    }
  });
  
  // Mark notification as read on click
  if (notificationList) {
    notificationList.addEventListener('click', handleNotificationClick);
  }
  
  // Clear all notifications
  if (notificationClearAll) {
    notificationClearAll.addEventListener('click', clearAllNotifications);
  }
  
  // Notification preferences form
  if (preferencesForm) {
    preferencesForm.addEventListener('submit', handlePreferencesSubmit);
    
    // Update state when preferences change
    const preferenceInputs = preferencesForm.querySelectorAll('input[type="checkbox"]');
    preferenceInputs.forEach(input => {
      input.addEventListener('change', () => {
        state.preferences[input.name] = input.checked;
      });
    });
  }
}

/**
 * Load notifications from API
 */
async function loadNotifications() {
  if (state.loading) return;
  
  state.loading = true;
  
  try {
    const result = await getNotifications();
    
    if (result && Array.isArray(result.notifications)) {
      state.notifications = result.notifications;
      state.unreadCount = state.notifications.filter(n => !n.read).length;
      
      // Update preferences if included in response
      if (result.preferences) {
        state.preferences = {
          ...state.preferences,
          ...result.preferences
        };
        updatePreferencesUI();
      }
      
      // Update UI
      updateNotificationCount();
      renderNotifications();
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
  } finally {
    state.loading = false;
  }
}

/**
 * Toggle notification panel visibility
 */
function toggleNotificationPanel() {
  if (!notificationPanel) return;
  
  state.panelOpen = !state.panelOpen;
  
  if (state.panelOpen) {
    notificationPanel.classList.add('open');
    notificationToggle.classList.add('active');
    
    // When opening, mark notifications as seen
    markNotificationsAsSeen();
  } else {
    notificationPanel.classList.remove('open');
    notificationToggle.classList.remove('active');
  }
}

/**
 * Mark all visible notifications as seen (not read)
 */
function markNotificationsAsSeen() {
  // Update the notification icon count
  // This doesn't mark them as read, just updates the counter
  updateNotificationCount(true);
}

/**
 * Update notification count display
 * @param {boolean} resetCount - Whether to reset the count to zero
 */
function updateNotificationCount(resetCount = false) {
  if (!notificationCount) return;
  
  if (resetCount) {
    notificationCount.textContent = '0';
    notificationCount.style.display = 'none';
  } else {
    notificationCount.textContent = state.unreadCount.toString();
    notificationCount.style.display = state.unreadCount > 0 ? 'block' : 'none';
  }
}

/**
 * Render notifications in the panel
 */
function renderNotifications() {
  if (!notificationList) return;
  
  // Clear current list
  notificationList.innerHTML = '';
  
  // Show empty state if no notifications
  if (state.notifications.length === 0) {
    if (emptyStateElement) {
      emptyStateElement.style.display = 'block';
    }
    return;
  }
  
  // Hide empty state if we have notifications
  if (emptyStateElement) {
    emptyStateElement.style.display = 'none';
  }
  
  // Render each notification
  state.notifications.forEach(notification => {
    const notificationElement = createNotificationElement(notification);
    notificationList.appendChild(notificationElement);
  });
}

/**
 * Create notification element
 * @param {Object} notification - Notification data
 * @returns {HTMLElement} Notification element
 */
function createNotificationElement(notification) {
  const element = document.createElement('div');
  element.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
  element.dataset.id = notification.id;
  
  // Get notification type config or use default
  const typeConfig = notificationTypes[notification.type] || notificationTypes.systemUpdate;
  
  // Format date
  const date = new Date(notification.timestamp);
  const formattedDate = formatNotificationDate(date);
  
  element.innerHTML = `
    <div class="notification-icon" style="background-color: ${typeConfig.color}">
      <i class="${typeConfig.icon}"></i>
    </div>
    <div class="notification-content">
      <div class="notification-header">
        <h4 class="notification-title">${notification.title || typeConfig.title}</h4>
        <span class="notification-time">${formattedDate}</span>
      </div>
      <p class="notification-message">${notification.message || typeConfig.description}</p>
      ${notification.actionUrl ? `<a href="${notification.actionUrl}" class="notification-action">View</a>` : ''}
    </div>
    <button class="notification-dismiss" title="Dismiss" data-action="dismiss">×</button>
  `;
  
  return element;
}

/**
 * Format notification date relative to current time
 * @param {Date} date - Notification date
 * @returns {string} Formatted date string
 */
function formatNotificationDate(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) {
    return 'Just now';
  } else if (diffMin < 60) {
    return `${diffMin} min ago`;
  } else if (diffHour < 24) {
    return `${diffHour} hr ago`;
  } else if (diffDay < 7) {
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Handle notification click events
 * @param {Event} event - Click event
 */
function handleNotificationClick(event) {
  const notificationItem = event.target.closest('.notification-item');
  
  if (!notificationItem) return;
  
  const notificationId = notificationItem.dataset.id;
  const dismissButton = event.target.closest('.notification-dismiss');
  
  // If dismiss button was clicked
  if (dismissButton) {
    event.preventDefault();
    event.stopPropagation();
    dismissNotification(notificationId, notificationItem);
    return;
  }
  
  // If action link was clicked, let it handle navigation naturally
  if (event.target.classList.contains('notification-action')) {
    markNotificationAsRead(notificationId);
    return;
  }
  
  // Otherwise, mark as read
  markNotificationAsRead(notificationId, notificationItem);
  
  // Handle default action if present
  const notification = state.notifications.find(n => n.id === notificationId);
  if (notification && notification.actionUrl) {
    window.location.href = notification.actionUrl;
  }
}

/**
 * Mark notification as read
 * @param {string} id - Notification ID
 * @param {HTMLElement} element - Notification element
 */
async function markNotificationAsRead(id, element) {
  try {
    // Update UI immediately
    if (element) {
      element.classList.remove('unread');
      element.classList.add('read');
    }
    
    // Update state
    const notification = state.notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      notification.read = true;
      state.unreadCount = Math.max(0, state.unreadCount - 1);
      updateNotificationCount();
    }
    
    // Call API to update server
    await markNotificationRead(id);
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

/**
 * Dismiss notification (remove from list)
 * @param {string} id - Notification ID
 * @param {HTMLElement} element - Notification element
 */
async function dismissNotification(id, element) {
  try {
    // Animate removal
    element.classList.add('removing');
    
    setTimeout(() => {
      // Remove from DOM
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
      
      // Update state
      const index = state.notifications.findIndex(n => n.id === id);
      if (index !== -1) {
        const wasUnread = !state.notifications[index].read;
        state.notifications.splice(index, 1);
        
        if (wasUnread) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
          updateNotificationCount();
        }
        
        // Show empty state if no notifications left
        if (state.notifications.length === 0 && emptyStateElement) {
          emptyStateElement.style.display = 'block';
        }
      }
    }, 300); // Match with CSS animation duration
    
    // Call API to update server
    await markNotificationRead(id, true); // true = also dismiss
  } catch (error) {
    console.error('Error dismissing notification:', error);
  }
}

/**
 * Clear all notifications
 */
async function clearAllNotifications() {
  if (!notificationList || state.notifications.length === 0) return;
  
  // Confirm with user
  if (!confirm('Are you sure you want to clear all notifications?')) {
    return;
  }
  
  try {
    // Clear UI
    notificationList.innerHTML = '';
    
    // Show empty state
    if (emptyStateElement) {
      emptyStateElement.style.display = 'block';
    }
    
    // Update state
    state.unreadCount = 0;
    state.notifications = [];
    updateNotificationCount();
    
    // Call API to update server
    await markNotificationRead('all', true); // Special 'all' ID with dismiss flag
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
}

/**
 * Update notification preferences UI
 */
function updatePreferencesUI() {
  if (!preferencesForm) return;
  
  // Update checkbox states
  Object.keys(state.preferences).forEach(key => {
    const checkbox = preferencesForm.querySelector(`input[name="${key}"]`);
    if (checkbox) {
      checkbox.checked = state.preferences[key];
    }
  });
}

/**
 * Handle preferences form submission
 * @param {Event} event - Form submit event
 */
async function handlePreferencesSubmit(event) {
  event.preventDefault();
  
  const submitButton = preferencesForm.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner"></span> Saving...';
  }
  
  try {
    // Call API to update preferences
    await updateNotificationPreferences(state.preferences);
    
    // Show success message
    showPreferencesMessage('Preferences saved successfully', 'success');
  } catch (error) {
    console.error('Error updating preferences:', error);
    showPreferencesMessage('Failed to save preferences', 'error');
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Save Preferences';
    }
  }
}

/**
 * Show preferences form message
 * @param {string} message - Message text
 * @param {string} type - Message type ('success' or 'error')
 */
function showPreferencesMessage(message, type = 'info') {
  if (!preferencesForm) return;
  
  let messageElement = preferencesForm.querySelector('.preferences-message');
  
  if (!messageElement) {
    messageElement = document.createElement('div');
    messageElement.className = 'preferences-message';
    preferencesForm.appendChild(messageElement);
  }
  
  messageElement.textContent = message;
  messageElement.className = `preferences-message ${type}`;
  messageElement.style.display = 'block';
  
  setTimeout(() => {
    messageElement.style.display = 'none';
  }, 3000);
}

/**
 * Check browser permissions for desktop notifications
 */
function checkBrowserPermissions() {
  if (!('Notification' in window)) {
    // Browser doesn't support notifications
    disableDesktopNotifications();
    return;
  }
  
  if (Notification.permission === 'denied') {
    disableDesktopNotifications();
  }
}

/**
 * Disable desktop notifications option
 */
function disableDesktopNotifications() {
  state.preferences.desktopNotifications = false;
  
  const desktopNotificationCheckbox = preferencesForm ? 
    preferencesForm.querySelector('input[name="desktopNotifications"]') : null;
    
  if (desktopNotificationCheckbox) {
    desktopNotificationCheckbox.checked = false;
    desktopNotificationCheckbox.disabled = true;
    
    // Add explanation
    const explanationEl = document.createElement('small');
    explanationEl.className = 'text-muted';
    explanationEl.textContent = 'Desktop notifications are not available in your browser.';
    desktopNotificationCheckbox.parentNode.appendChild(explanationEl);
  }
}

/**
 * Request browser notification permission
 * @returns {Promise<boolean>} Whether permission was granted
 */
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission === 'denied') {
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Show a desktop notification
 * @param {Object} notification - Notification data
 */
function showDesktopNotification(notification) {
  if (!state.preferences.desktopNotifications || 
      !('Notification' in window) ||
      Notification.permission !== 'granted') {
    return;
  }
  
  const typeConfig = notificationTypes[notification.type] || notificationTypes.systemUpdate;
  
  try {
    const desktopNotification = new Notification(notification.title || typeConfig.title, {
      body: notification.message || typeConfig.description,
      icon: '/static/images/logo-square.png'
    });
    
    desktopNotification.onclick = () => {
      window.focus();
      if (notification.actionUrl) {
        window.location.href = notification.actionUrl;
      }
      desktopNotification.close();
    };
  } catch (error) {
    console.error('Error showing desktop notification:', error);
  }
}

/**
 * Push a new notification to the notification list
 * @param {Object} notification - Notification data
 */
function pushNotification(notification) {
  if (!notification) return;
  
  // Add to state
  state.notifications.unshift(notification);
  
  if (!notification.read) {
    state.unreadCount++;
    updateNotificationCount();
  }
  
  // Re-render notifications
  renderNotifications();
  
  // Show desktop notification if enabled
  if (state.preferences.desktopNotifications) {
    showDesktopNotification(notification);
  }
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', init);

// Export public methods
export default {
  init,
  pushNotification,
  loadNotifications,
  requestNotificationPermission
}; 