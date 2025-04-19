/**
 * Feedback Module - Handles user feedback submission and management for SciSummarize
 * Provides functionality to submit, track, and manage user feedback
 */

import { submitFeedback, getFeedbackHistory } from './api.js';

// DOM element cache
let feedbackForm;
let feedbackType;
let feedbackText;
let documentId;
let feedbackSubmitBtn;
let feedbackStatus;
let feedbackHistory;
let feedbackToggleBtn;

// Feedback state
const state = {
  submitting: false,
  history: [],
  historyLoaded: false,
  showHistory: false
};

/**
 * Initialize the feedback module
 */
function init() {
  cacheElements();
  setupEventListeners();
  checkForDocumentContext();
}

/**
 * Cache DOM elements for performance
 */
function cacheElements() {
  feedbackForm = document.getElementById('feedbackForm');
  feedbackType = document.getElementById('feedbackType');
  feedbackText = document.getElementById('feedbackText');
  documentId = document.getElementById('documentId');
  feedbackSubmitBtn = document.getElementById('submitFeedback');
  feedbackStatus = document.getElementById('feedbackStatus');
  feedbackHistory = document.getElementById('feedbackHistory');
  feedbackToggleBtn = document.getElementById('toggleFeedbackHistory');
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  if (feedbackForm) {
    feedbackForm.addEventListener('submit', handleFeedbackSubmit);
  }
  
  if (feedbackToggleBtn) {
    feedbackToggleBtn.addEventListener('click', toggleFeedbackHistory);
  }
  
  // Character count for feedback text
  if (feedbackText) {
    feedbackText.addEventListener('input', updateCharacterCount);
  }
}

/**
 * Check if we're in a document context and update form accordingly
 */
function checkForDocumentContext() {
  // Check if we're on a document page by looking for doc ID in URL
  const urlParams = new URLSearchParams(window.location.search);
  const docId = urlParams.get('docId') || getDocumentIdFromPath();
  
  if (docId && documentId) {
    documentId.value = docId;
  }
}

/**
 * Extract document ID from URL path (e.g., /document/123)
 */
function getDocumentIdFromPath() {
  const pathMatch = window.location.pathname.match(/\/document\/(\w+)/);
  return pathMatch ? pathMatch[1] : null;
}

/**
 * Update character count for feedback text
 */
function updateCharacterCount() {
  const charCount = document.getElementById('characterCount');
  if (!charCount || !feedbackText) return;
  
  const current = feedbackText.value.length;
  const max = feedbackText.getAttribute('maxlength') || 1000;
  
  charCount.textContent = `${current}/${max}`;
  
  // Add visual indicator when approaching limit
  if (current > max * 0.9) {
    charCount.classList.add('near-limit');
  } else {
    charCount.classList.remove('near-limit');
  }
}

/**
 * Handle feedback form submission
 * @param {Event} event - Form submit event
 */
async function handleFeedbackSubmit(event) {
  event.preventDefault();
  
  if (state.submitting || !feedbackForm) return;
  
  // Basic validation
  if (!feedbackText || !feedbackText.value.trim()) {
    showFeedbackStatus('Please enter your feedback', 'error');
    return;
  }
  
  // Prepare feedback data
  const feedbackData = {
    type: feedbackType ? feedbackType.value : 'general',
    text: feedbackText.value.trim(),
    documentId: documentId ? documentId.value : null,
    url: window.location.href,
    timestamp: new Date().toISOString()
  };
  
  // Update UI state
  state.submitting = true;
  
  if (feedbackSubmitBtn) {
    feedbackSubmitBtn.disabled = true;
    feedbackSubmitBtn.textContent = 'Submitting...';
  }
  
  try {
    // Submit feedback
    const response = await submitFeedback(feedbackData);
    
    // Success
    showFeedbackStatus('Thank you for your feedback!', 'success');
    
    // Reset form
    if (feedbackForm) {
      feedbackForm.reset();
      updateCharacterCount();
    }
    
    // If we have feedback history showing, refresh it
    if (state.showHistory && state.historyLoaded) {
      loadFeedbackHistory();
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
    showFeedbackStatus('Failed to submit feedback. Please try again.', 'error');
  } finally {
    // Reset UI state
    state.submitting = false;
    
    if (feedbackSubmitBtn) {
      feedbackSubmitBtn.disabled = false;
      feedbackSubmitBtn.textContent = 'Submit Feedback';
    }
  }
}

/**
 * Show feedback submission status
 * @param {string} message - Status message
 * @param {string} type - Status type ('success', 'error', 'info')
 */
function showFeedbackStatus(message, type = 'info') {
  if (!feedbackStatus) return;
  
  // Clear existing classes
  feedbackStatus.className = 'feedback-status';
  
  // Add type-specific class
  feedbackStatus.classList.add(`status-${type}`);
  
  // Set message
  feedbackStatus.textContent = message;
  
  // Show status
  feedbackStatus.style.display = 'block';
  
  // Hide after delay for success messages
  if (type === 'success') {
    setTimeout(() => {
      feedbackStatus.style.display = 'none';
    }, 5000);
  }
}

/**
 * Toggle feedback history visibility
 */
function toggleFeedbackHistory() {
  if (!feedbackHistory || !feedbackToggleBtn) return;
  
  state.showHistory = !state.showHistory;
  
  if (state.showHistory) {
    // Load history if not already loaded
    if (!state.historyLoaded) {
      loadFeedbackHistory();
    }
    
    feedbackHistory.style.display = 'block';
    feedbackToggleBtn.textContent = 'Hide Feedback History';
  } else {
    feedbackHistory.style.display = 'none';
    feedbackToggleBtn.textContent = 'Show Feedback History';
  }
}

/**
 * Load user feedback history
 */
async function loadFeedbackHistory() {
  if (!feedbackHistory) return;
  
  try {
    // Show loading state
    feedbackHistory.innerHTML = '<p>Loading feedback history...</p>';
    
    // Get feedback history from API
    const history = await getFeedbackHistory();
    
    // Update state
    state.history = history || [];
    state.historyLoaded = true;
    
    // Render history
    renderFeedbackHistory();
  } catch (error) {
    console.error('Error loading feedback history:', error);
    feedbackHistory.innerHTML = '<p class="error">Failed to load feedback history.</p>';
  }
}

/**
 * Render feedback history
 */
function renderFeedbackHistory() {
  if (!feedbackHistory) return;
  
  if (!state.history.length) {
    feedbackHistory.innerHTML = '<p>No feedback history found.</p>';
    return;
  }
  
  // Create history container
  const historyList = document.createElement('ul');
  historyList.className = 'feedback-history-list';
  
  // Add each feedback item
  state.history.forEach(item => {
    const listItem = document.createElement('li');
    listItem.className = 'feedback-item';
    
    // Format date
    const date = new Date(item.timestamp);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    
    // Create feedback item content
    listItem.innerHTML = `
      <div class="feedback-item-header">
        <span class="feedback-type">${item.type}</span>
        <span class="feedback-date">${formattedDate}</span>
      </div>
      <div class="feedback-text">${item.text}</div>
      ${item.documentId ? `<div class="feedback-doc">Document: <a href="/document/${item.documentId}">${item.documentId}</a></div>` : ''}
      ${item.status ? `<div class="feedback-status-label status-${item.status.toLowerCase()}">${item.status}</div>` : ''}
    `;
    
    historyList.appendChild(listItem);
  });
  
  // Clear and add new content
  feedbackHistory.innerHTML = '';
  feedbackHistory.appendChild(historyList);
}

/**
 * Prepare feedback for specific document
 * @param {string} docId - Document ID
 * @param {string} defaultType - Default feedback type
 */
function initDocumentFeedback(docId, defaultType = 'document') {
  if (!documentId || !feedbackType) return;
  
  documentId.value = docId;
  feedbackType.value = defaultType;
  
  // Focus the text area
  if (feedbackText) {
    feedbackText.focus();
  }
}

/**
 * Get current feedback state
 * @returns {Object} Current state
 */
function getFeedbackState() {
  return { ...state };
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', init);

// Export public methods
export default {
  init,
  initDocumentFeedback,
  handleFeedbackSubmit,
  getFeedbackState
}; 