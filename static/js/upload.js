/**
 * Upload module for SciSummarize
 * Handles document uploads and processing
 */

// Create global Upload object
window.Upload = {};

// Cache DOM elements
const elements = {
  uploadForm: null,
  fileInput: null,
  titleInput: null,
  descriptionInput: null,
  tagsInput: null,
  submitButton: null,
  cancelButton: null,
  progressBar: null,
  errorMessage: null,
  successMessage: null
};

// Upload state
const state = {
  isUploading: false,
  selectedFile: null,
  progress: 0
};

/**
 * Initialize upload module
 */
window.Upload.init = function() {
  console.log('Initializing upload module...');
  
  // Cache DOM elements
  cacheElements();
  
  // Setup event listeners
  setupEventListeners();
  
  // Setup drag and drop
  setupDragAndDrop();
  
  return Promise.resolve();
};

/**
 * Cache DOM elements for better performance
 */
function cacheElements() {
  elements.uploadForm = document.getElementById('upload-form');
  elements.fileInput = document.getElementById('file-input');
  elements.titleInput = document.getElementById('title-input');
  elements.descriptionInput = document.getElementById('description-input');
  elements.tagsInput = document.getElementById('tags-input');
  elements.submitButton = document.getElementById('submit-upload');
  elements.cancelButton = document.getElementById('cancel-upload');
  elements.progressBar = document.getElementById('upload-progress');
  elements.errorMessage = document.getElementById('upload-error');
  elements.successMessage = document.getElementById('upload-success');
  elements.dropZone = document.getElementById('drop-zone');
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // File input change
  if (elements.fileInput) {
    elements.fileInput.addEventListener('change', handleFileSelect);
  }
  
  // Form submission
  if (elements.uploadForm) {
    elements.uploadForm.addEventListener('submit', handleFormSubmit);
  }
  
  // Cancel button
  if (elements.cancelButton) {
    elements.cancelButton.addEventListener('click', handleCancel);
  }
}

/**
 * Setup drag and drop functionality
 */
function setupDragAndDrop() {
  const dropZone = elements.dropZone;
  if (!dropZone) return;
  
  // Prevent default behavior
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  // Highlight drop zone on drag
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
  });
  
  function highlight() {
    dropZone.classList.add('drag-highlight');
  }
  
  function unhighlight() {
    dropZone.classList.remove('drag-highlight');
  }
  
  // Handle dropped files
  dropZone.addEventListener('drop', handleDrop, false);
  
  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
      elements.fileInput.files = files;
      handleFileSelect({ target: elements.fileInput });
    }
  }
}

/**
 * Handle file selection
 * @param {Event} event - Change event
 */
function handleFileSelect(event) {
  const file = event.target.files[0];
  
  if (!file) return;
  
  // Check file type
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
  
  if (!allowedTypes.includes(file.type)) {
    showError('Invalid file type. Please upload a PDF, DOC, DOCX, or TXT file.');
    elements.fileInput.value = '';
    return;
  }
  
  // Check file size (10MB max)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  
  if (file.size > maxSize) {
    showError('File too large. Maximum size is 10MB.');
    elements.fileInput.value = '';
    return;
  }
  
  // Store selected file
  state.selectedFile = file;
  
  // Update file name display
  const fileNameDisplay = document.getElementById('selected-file-name');
  if (fileNameDisplay) {
    fileNameDisplay.textContent = file.name;
    fileNameDisplay.parentElement.classList.remove('hidden');
  }
  
  // Auto-fill title based on filename
  if (elements.titleInput && !elements.titleInput.value) {
    // Remove extension and replace dashes/underscores with spaces
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    elements.titleInput.value = nameWithoutExt.replace(/[-_]/g, ' ');
  }
  
  // Hide any previous errors
  hideError();
}

/**
 * Handle form submission
 * @param {Event} event - Submit event
 */
async function handleFormSubmit(event) {
  event.preventDefault();
  
  if (state.isUploading) return;
  
  // Validate form
  if (!state.selectedFile) {
    showError('Please select a file to upload.');
    return;
  }
  
  if (elements.titleInput && !elements.titleInput.value.trim()) {
    showError('Please enter a title for the document.');
    elements.titleInput.focus();
    return;
  }
  
  // Set uploading state
  state.isUploading = true;
  state.progress = 0;
  updateProgressBar();
  
  // Disable form controls
  toggleFormControls(false);
  
  // Prepare form data
  const formData = new FormData();
  formData.append('file', state.selectedFile);
  formData.append('title', elements.titleInput.value.trim());
  
  if (elements.descriptionInput && elements.descriptionInput.value.trim()) {
    formData.append('description', elements.descriptionInput.value.trim());
  }
  
  if (elements.tagsInput && elements.tagsInput.value.trim()) {
    // Split tags by comma and trim whitespace
    const tags = elements.tagsInput.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    formData.append('tags', JSON.stringify(tags));
  }
  
  try {
    // Simulate progress updates
    const progressInterval = simulateProgress();
    
    // Upload document
    const response = await window.API.documents.upload(formData);
    
    // Clear interval
    clearInterval(progressInterval);
    
    // Set progress to 100%
    state.progress = 100;
    updateProgressBar();
    
    // Show success message
    showSuccess('Document uploaded successfully!');
    
    // Redirect to document page after a short delay
    setTimeout(() => {
      window.location.href = `/documents/${response.id}`;
    }, 1500);
  } catch (error) {
    console.error('Upload error:', error);
    showError(error.message || 'Failed to upload document. Please try again.');
    
    // Reset upload state
    state.isUploading = false;
    state.progress = 0;
    updateProgressBar();
    
    // Re-enable form controls
    toggleFormControls(true);
  }
}

/**
 * Simulate progress updates for better UX
 * @returns {number} Interval ID
 */
function simulateProgress() {
  return setInterval(() => {
    if (state.progress < 90) {
      state.progress += Math.random() * 10;
      if (state.progress > 90) state.progress = 90;
      updateProgressBar();
    }
  }, 500);
}

/**
 * Update progress bar with current progress
 */
function updateProgressBar() {
  if (!elements.progressBar) return;
  
  const progressContainer = elements.progressBar.parentElement;
  
  if (state.isUploading) {
    progressContainer.classList.remove('hidden');
    elements.progressBar.style.width = `${state.progress}%`;
    elements.progressBar.setAttribute('aria-valuenow', state.progress);
  } else {
    progressContainer.classList.add('hidden');
  }
}

/**
 * Toggle form controls enabled/disabled state
 * @param {boolean} enabled - Whether controls should be enabled
 */
function toggleFormControls(enabled) {
  const controls = [
    elements.fileInput,
    elements.titleInput,
    elements.descriptionInput,
    elements.tagsInput,
    elements.submitButton
  ];
  
  controls.forEach(control => {
    if (control) {
      control.disabled = !enabled;
    }
  });
  
  if (elements.uploadForm) {
    if (enabled) {
      elements.uploadForm.classList.remove('uploading');
    } else {
      elements.uploadForm.classList.add('uploading');
    }
  }
}

/**
 * Handle cancel button click
 */
function handleCancel() {
  // Reset form
  if (elements.uploadForm) {
    elements.uploadForm.reset();
  }
  
  // Reset state
  state.selectedFile = null;
  state.isUploading = false;
  state.progress = 0;
  
  // Update UI
  updateProgressBar();
  hideError();
  hideSuccess();
  
  // Hide filename display
  const fileNameDisplay = document.getElementById('selected-file-name');
  if (fileNameDisplay) {
    fileNameDisplay.parentElement.classList.add('hidden');
  }
  
  // Re-enable form controls
  toggleFormControls(true);
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  if (!elements.errorMessage) return;
  
  elements.errorMessage.textContent = message;
  elements.errorMessage.classList.remove('hidden');
  
  // Hide success message if visible
  hideSuccess();
}

/**
 * Hide error message
 */
function hideError() {
  if (!elements.errorMessage) return;
  
  elements.errorMessage.textContent = '';
  elements.errorMessage.classList.add('hidden');
}

/**
 * Show success message
 * @param {string} message - Success message
 */
function showSuccess(message) {
  if (!elements.successMessage) return;
  
  elements.successMessage.textContent = message;
  elements.successMessage.classList.remove('hidden');
  
  // Hide error message if visible
  hideError();
}

/**
 * Hide success message
 */
function hideSuccess() {
  if (!elements.successMessage) return;
  
  elements.successMessage.textContent = '';
  elements.successMessage.classList.add('hidden');
}

// Make upload functions available globally
window.Upload.uploadDocument = handleFormSubmit; 