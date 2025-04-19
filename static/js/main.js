/**
 * Main JavaScript entry point for SciSummarize
 * Initializes modules based on the current page
 */

// Traditional module pattern
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing SciSummarize application...');
    
    try {
        // Initialize API module first (if it exists)
        if (typeof window.API !== 'undefined' && typeof window.API.init === 'function') {
            await window.API.init();
            console.log('API module initialized');
        } else {
            console.warn('API module not found or not properly initialized');
        }
        
        // Get the current page from the body's data attribute
        const currentPage = document.body.dataset.page || 'unknown';
        console.log(`Current page: ${currentPage}`);
        
        // Initialize modules based on current page
        switch (currentPage) {
            case 'home':
                // Home page - initialize search if available
                if (typeof window.Search !== 'undefined' && typeof window.Search.init === 'function') {
                    await window.Search.init();
                }
                break;
                
            case 'search':
                // Search page - initialize search if available
                if (typeof window.Search !== 'undefined' && typeof window.Search.init === 'function') {
                    await window.Search.init({ resultsPerPage: 20 });
                }
                break;
                
            case 'document':
                // Document view page - initialize feedback and visualizations if available
                if (typeof window.Feedback !== 'undefined' && typeof window.Feedback.init === 'function') {
                    await window.Feedback.init();
                }
                if (typeof window.Visualize !== 'undefined' && typeof window.Visualize.init === 'function') {
                    await window.Visualize.init();
                }
                break;
                
            case 'summary':
                // Summary view page - initialize feedback if available
                if (typeof window.Feedback !== 'undefined' && typeof window.Feedback.init === 'function') {
                    await window.Feedback.init();
                }
                break;
                
            case 'settings':
                // Settings page
                if (typeof window.Settings !== 'undefined' && typeof window.Settings.init === 'function') {
                    await window.Settings.init();
                }
                break;
                
            default:
                // Other pages - initialize basic modules
                console.log('Initializing default modules');
                break;
        }
        
        // Initialize global components
        initFeedbackHandler();
        initErrorHandler();
        
        console.log('All modules initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
    }
});

/**
 * Initialize feedback handler
 */
function initFeedbackHandler() {
  const feedbackForm = document.getElementById('feedback-form');
  if (!feedbackForm) return;
  
  feedbackForm.addEventListener('submit', (event) => {
    event.preventDefault();
    
    const feedbackText = document.getElementById('feedback-text');
    if (!feedbackText || !feedbackText.value.trim()) {
      alert('Please enter feedback before submitting.');
      return;
    }
    
    // In a real application, this would send feedback to the server
    console.log('Feedback submitted:', feedbackText.value);
    
    // Show success message
    const successMessage = document.getElementById('feedback-success');
    if (successMessage) {
      successMessage.classList.remove('hidden');
      
      // Hide after 3 seconds
      setTimeout(() => {
        successMessage.classList.add('hidden');
      }, 3000);
    }
    
    // Reset form
    feedbackForm.reset();
  });
}

/**
 * Initialize error handler
 */
function initErrorHandler() {
  // Find all error dismiss buttons
  const dismissButtons = document.querySelectorAll('.error-dismiss');
  
  dismissButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Find parent error container and hide it
      const errorContainer = button.closest('.error-container');
      if (errorContainer) {
        errorContainer.classList.add('hidden');
      }
    });
  });
  
  // Global error handler
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // Show error notification (if implemented)
    showGlobalError('An unexpected error occurred. Please try again or contact support.');
  });
}

/**
 * Show global error message
 * @param {string} message - Error message
 */
function showGlobalError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'global-error';
  errorDiv.textContent = message;
  
  // Add dismiss button
  const dismissBtn = document.createElement('button');
  dismissBtn.className = 'error-dismiss';
  dismissBtn.textContent = '×';
  dismissBtn.addEventListener('click', () => {
    document.body.removeChild(errorDiv);
  });
  
  errorDiv.appendChild(dismissBtn);
  document.body.appendChild(errorDiv);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (document.body.contains(errorDiv)) {
      errorDiv.classList.add('fade-out');
      setTimeout(() => {
        if (document.body.contains(errorDiv)) {
          document.body.removeChild(errorDiv);
        }
      }, 500);
    }
  }, 10000);
} 