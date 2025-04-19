/**
 * Document handler for SciSummarize
 * Manages document listing, uploading, editing, and summarization
 */

import api from './api.js';

// DOM element cache for performance
const elements = {};

// State management
let documentList = [];
let currentDocument = null;

/**
 * Initialize the documents module
 */
export function init() {
  // Cache DOM elements
  cacheElements();
  
  // Setup event listeners
  setupEventListeners();
  
  // Load documents if user is authenticated
  if (api.auth.isAuthenticated()) {
    loadDocuments();
  }
}

/**
 * Cache DOM elements for better performance
 */
function cacheElements() {
  // Document list elements
  elements.documentList = document.getElementById('document-list');
  elements.documentTemplate = document.getElementById('document-template');
  elements.emptyDocuments = document.getElementById('empty-documents');
  elements.documentLoader = document.getElementById('document-loader');
  
  // Document upload elements
  elements.uploadForm = document.getElementById('upload-form');
  elements.uploadFile = document.getElementById('upload-file');
  elements.uploadTitle = document.getElementById('upload-title');
  elements.uploadDescription = document.getElementById('upload-description');
  elements.uploadSubmit = document.getElementById('upload-submit');
  elements.uploadError = document.getElementById('upload-error');
  elements.uploadProgress = document.getElementById('upload-progress');
  
  // Document view elements
  elements.documentView = document.getElementById('document-view');
  elements.documentTitle = document.getElementById('document-title');
  elements.documentDescription = document.getElementById('document-description');
  elements.documentContent = document.getElementById('document-content');
  elements.documentDate = document.getElementById('document-date');
  elements.documentActions = document.getElementById('document-actions');
  
  // Summary elements
  elements.summaryContainer = document.getElementById('summary-container');
  elements.summaryContent = document.getElementById('summary-content');
  elements.generateSummaryBtn = document.getElementById('generate-summary-btn');
  elements.summarizeProgress = document.getElementById('summarize-progress');
  
  // Export elements
  elements.exportBtn = document.getElementById('export-btn');
  elements.exportOptions = document.getElementById('export-options');
  
  // Edit document elements
  elements.editDocumentBtn = document.getElementById('edit-document-btn');
  elements.editForm = document.getElementById('edit-document-form');
  elements.editTitle = document.getElementById('edit-title');
  elements.editDescription = document.getElementById('edit-description');
  elements.editSubmit = document.getElementById('edit-submit');
  elements.editCancel = document.getElementById('edit-cancel');
  
  // Delete document elements
  elements.deleteDocumentBtn = document.getElementById('delete-document-btn');
  elements.deleteConfirmModal = document.getElementById('delete-confirm-modal');
  elements.deleteConfirmBtn = document.getElementById('delete-confirm-btn');
  elements.deleteCancelBtn = document.getElementById('delete-cancel-btn');
}

/**
 * Setup event listeners for document handling
 */
function setupEventListeners() {
  // Document upload
  if (elements.uploadForm) {
    elements.uploadForm.addEventListener('submit', handleDocumentUpload);
  }
  
  // Document editing
  if (elements.editDocumentBtn) {
    elements.editDocumentBtn.addEventListener('click', showEditForm);
  }
  
  if (elements.editForm) {
    elements.editForm.addEventListener('submit', handleDocumentEdit);
  }
  
  if (elements.editCancel) {
    elements.editCancel.addEventListener('click', hideEditForm);
  }
  
  // Document deletion
  if (elements.deleteDocumentBtn) {
    elements.deleteDocumentBtn.addEventListener('click', showDeleteConfirmation);
  }
  
  if (elements.deleteConfirmBtn) {
    elements.deleteConfirmBtn.addEventListener('click', handleDocumentDelete);
  }
  
  if (elements.deleteCancelBtn) {
    elements.deleteCancelBtn.addEventListener('click', hideDeleteConfirmation);
  }
  
  // Summary generation
  if (elements.generateSummaryBtn) {
    elements.generateSummaryBtn.addEventListener('click', handleGenerateSummary);
  }
  
  // Export document
  if (elements.exportBtn) {
    elements.exportBtn.addEventListener('click', toggleExportOptions);
  }
  
  if (elements.exportOptions) {
    elements.exportOptions.addEventListener('click', handleExportSelection);
  }
}

/**
 * Load user documents from the API
 */
async function loadDocuments() {
  toggleLoader(true);
  
  try {
    // Get documents from API
    documentList = await api.documents.getDocuments();
    
    // Render the document list
    renderDocumentList();
  } catch (error) {
    console.error('Error loading documents:', error);
    showError('Failed to load documents. Please try again later.');
  } finally {
    toggleLoader(false);
  }
}

/**
 * Render the document list in the UI
 */
function renderDocumentList() {
  // Clear current list
  if (elements.documentList) {
    elements.documentList.innerHTML = '';
  }
  
  // Show empty state if no documents
  if (documentList.length === 0) {
    if (elements.emptyDocuments) {
      elements.emptyDocuments.classList.remove('hidden');
    }
    return;
  }
  
  // Hide empty state
  if (elements.emptyDocuments) {
    elements.emptyDocuments.classList.add('hidden');
  }
  
  // Sort documents by date (newest first)
  documentList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  // Render each document
  documentList.forEach(document => {
    const docElement = createDocumentElement(document);
    if (elements.documentList) {
      elements.documentList.appendChild(docElement);
    }
  });
}

/**
 * Create a document element from template
 * @param {Object} document - Document data
 * @returns {HTMLElement} The document element
 */
function createDocumentElement(document) {
  // Clone the template
  const template = elements.documentTemplate;
  if (!template) {
    const div = document.createElement('div');
    div.classList.add('document-item');
    div.textContent = document.title;
    div.dataset.id = document.id;
    div.addEventListener('click', () => loadDocument(document.id));
    return div;
  }
  
  const docElement = template.content.cloneNode(true).firstElementChild;
  
  // Set document data
  docElement.dataset.id = document.id;
  
  // Set document title
  const titleElement = docElement.querySelector('.document-title');
  if (titleElement) {
    titleElement.textContent = document.title;
  }
  
  // Set document description (truncated)
  const descElement = docElement.querySelector('.document-description');
  if (descElement && document.description) {
    descElement.textContent = truncateText(document.description, 100);
  }
  
  // Format date
  const dateElement = docElement.querySelector('.document-date');
  if (dateElement && document.created_at) {
    dateElement.textContent = formatDate(document.created_at);
  }
  
  // Set summary status
  const summaryBadge = docElement.querySelector('.summary-badge');
  if (summaryBadge) {
    if (document.has_summary) {
      summaryBadge.classList.remove('hidden');
    } else {
      summaryBadge.classList.add('hidden');
    }
  }
  
  // Add click event listener
  docElement.addEventListener('click', () => loadDocument(document.id));
  
  return docElement;
}

/**
 * Load a document by ID and display it
 * @param {string} id - Document ID
 */
async function loadDocument(id) {
  // Don't reload if already viewing this document
  if (currentDocument && currentDocument.id === id) {
    return;
  }
  
  toggleLoader(true);
  
  try {
    // Get document from API
    const document = await api.documents.getDocument(id);
    
    // Set as current document
    currentDocument = document;
    
    // Display document
    displayDocument(document);
  } catch (error) {
    console.error('Error loading document:', error);
    showError('Failed to load document. Please try again later.');
  } finally {
    toggleLoader(false);
  }
}

/**
 * Display a document in the document view
 * @param {Object} document - Document data
 */
function displayDocument(document) {
  // Show the document view
  if (elements.documentView) {
    elements.documentView.classList.remove('hidden');
  }
  
  // Set title
  if (elements.documentTitle) {
    elements.documentTitle.textContent = document.title;
  }
  
  // Set description
  if (elements.documentDescription) {
    elements.documentDescription.textContent = document.description || '';
  }
  
  // Set content
  if (elements.documentContent) {
    elements.documentContent.textContent = document.content || '';
  }
  
  // Set date
  if (elements.documentDate) {
    elements.documentDate.textContent = formatDate(document.created_at);
  }
  
  // Handle summary display
  if (elements.summaryContainer && elements.summaryContent) {
    if (document.summary) {
      elements.summaryContainer.classList.remove('hidden');
      elements.summaryContent.textContent = document.summary;
      
      // Hide generate button if summary exists
      if (elements.generateSummaryBtn) {
        elements.generateSummaryBtn.classList.add('hidden');
      }
    } else {
      elements.summaryContainer.classList.add('hidden');
      
      // Show generate button if no summary
      if (elements.generateSummaryBtn) {
        elements.generateSummaryBtn.classList.remove('hidden');
      }
    }
  }
}

/**
 * Handle document upload form submission
 * @param {Event} event - Form submit event
 */
async function handleDocumentUpload(event) {
  event.preventDefault();
  
  // Validate form
  if (!validateUploadForm()) {
    return;
  }
  
  // Show loading state
  toggleUploadLoading(true);
  
  try {
    const formData = new FormData();
    formData.append('file', elements.uploadFile.files[0]);
    formData.append('title', elements.uploadTitle.value.trim());
    
    if (elements.uploadDescription.value.trim()) {
      formData.append('description', elements.uploadDescription.value.trim());
    }
    
    // Upload document
    const document = await api.documents.uploadDocument(formData, updateUploadProgress);
    
    // Add document to list and render
    documentList.unshift(document);
    renderDocumentList();
    
    // Reset form
    elements.uploadForm.reset();
    
    // Show success message
    showMessage('Document uploaded successfully!');
    
    // Load the newly uploaded document
    loadDocument(document.id);
  } catch (error) {
    console.error('Upload error:', error);
    showError(elements.uploadError, error.message || 'Failed to upload document. Please try again.');
  } finally {
    toggleUploadLoading(false);
  }
}

/**
 * Update upload progress bar
 * @param {number} progress - Upload progress percentage
 */
function updateUploadProgress(progress) {
  if (elements.uploadProgress) {
    elements.uploadProgress.style.width = `${progress}%`;
  }
}

/**
 * Show edit document form
 */
function showEditForm() {
  if (!currentDocument) return;
  
  // Populate form with current document data
  if (elements.editTitle) {
    elements.editTitle.value = currentDocument.title;
  }
  
  if (elements.editDescription) {
    elements.editDescription.value = currentDocument.description || '';
  }
  
  // Show edit form
  if (elements.editForm) {
    elements.editForm.classList.remove('hidden');
  }
}

/**
 * Hide edit document form
 */
function hideEditForm() {
  if (elements.editForm) {
    elements.editForm.classList.add('hidden');
  }
}

/**
 * Handle document edit form submission
 * @param {Event} event - Form submit event
 */
async function handleDocumentEdit(event) {
  event.preventDefault();
  
  if (!currentDocument) return;
  
  // Validate form
  if (!elements.editTitle.value.trim()) {
    showError('Please enter a title for the document');
    return;
  }
  
  // Show loading state
  toggleButtonLoading(elements.editSubmit, true);
  
  try {
    const updatedData = {
      title: elements.editTitle.value.trim(),
      description: elements.editDescription.value.trim()
    };
    
    // Update document
    const updatedDocument = await api.documents.updateDocument(currentDocument.id, updatedData);
    
    // Update document in list
    const index = documentList.findIndex(doc => doc.id === currentDocument.id);
    if (index !== -1) {
      documentList[index] = updatedDocument;
    }
    
    // Update current document
    currentDocument = updatedDocument;
    
    // Update displayed document
    displayDocument(updatedDocument);
    
    // Update document list
    renderDocumentList();
    
    // Hide edit form
    hideEditForm();
    
    // Show success message
    showMessage('Document updated successfully!');
  } catch (error) {
    console.error('Edit error:', error);
    showError(error.message || 'Failed to update document. Please try again.');
  } finally {
    toggleButtonLoading(elements.editSubmit, false);
  }
}

/**
 * Show delete confirmation modal
 */
function showDeleteConfirmation() {
  if (!currentDocument) return;
  
  if (elements.deleteConfirmModal) {
    elements.deleteConfirmModal.classList.remove('hidden');
  }
}

/**
 * Hide delete confirmation modal
 */
function hideDeleteConfirmation() {
  if (elements.deleteConfirmModal) {
    elements.deleteConfirmModal.classList.add('hidden');
  }
}

/**
 * Handle document deletion
 */
async function handleDocumentDelete() {
  if (!currentDocument) return;
  
  // Show loading state
  toggleButtonLoading(elements.deleteConfirmBtn, true);
  
  try {
    // Delete document
    await api.documents.deleteDocument(currentDocument.id);
    
    // Remove document from list
    documentList = documentList.filter(doc => doc.id !== currentDocument.id);
    
    // Hide delete confirmation
    hideDeleteConfirmation();
    
    // Clear current document
    currentDocument = null;
    
    // Hide document view
    if (elements.documentView) {
      elements.documentView.classList.add('hidden');
    }
    
    // Update document list
    renderDocumentList();
    
    // Show success message
    showMessage('Document deleted successfully!');
  } catch (error) {
    console.error('Delete error:', error);
    showError(error.message || 'Failed to delete document. Please try again.');
  } finally {
    toggleButtonLoading(elements.deleteConfirmBtn, false);
  }
}

/**
 * Handle summary generation
 */
async function handleGenerateSummary() {
  if (!currentDocument) return;
  
  // Show loading state
  toggleButtonLoading(elements.generateSummaryBtn, true);
  
  if (elements.summarizeProgress) {
    elements.summarizeProgress.classList.remove('hidden');
  }
  
  try {
    // Generate summary
    const updatedDocument = await api.documents.generateSummary(currentDocument.id);
    
    // Update document in list
    const index = documentList.findIndex(doc => doc.id === currentDocument.id);
    if (index !== -1) {
      documentList[index] = updatedDocument;
    }
    
    // Update current document
    currentDocument = updatedDocument;
    
    // Update displayed document
    displayDocument(updatedDocument);
    
    // Show success message
    showMessage('Summary generated successfully!');
  } catch (error) {
    console.error('Summary error:', error);
    showError(error.message || 'Failed to generate summary. Please try again.');
  } finally {
    toggleButtonLoading(elements.generateSummaryBtn, false);
    
    if (elements.summarizeProgress) {
      elements.summarizeProgress.classList.add('hidden');
    }
  }
}

/**
 * Toggle export options visibility
 */
function toggleExportOptions() {
  if (elements.exportOptions) {
    elements.exportOptions.classList.toggle('hidden');
  }
}

/**
 * Handle export format selection
 * @param {Event} event - Click event
 */
async function handleExportSelection(event) {
  if (!event.target.matches('.export-option')) return;
  if (!currentDocument) return;
  
  const format = event.target.dataset.format;
  if (!format) return;
  
  // Hide export options
  if (elements.exportOptions) {
    elements.exportOptions.classList.add('hidden');
  }
  
  // Show loading state
  toggleButtonLoading(elements.exportBtn, true);
  
  try {
    // Export document
    const exportedUrl = await api.documents.exportDocument(currentDocument.id, format);
    
    // Create download link
    const link = document.createElement('a');
    link.href = exportedUrl;
    link.download = `${currentDocument.title}.${format}`;
    link.click();
    
    // Show success message
    showMessage(`Document exported as ${format.toUpperCase()} successfully!`);
  } catch (error) {
    console.error('Export error:', error);
    showError(error.message || `Failed to export document as ${format.toUpperCase()}. Please try again.`);
  } finally {
    toggleButtonLoading(elements.exportBtn, false);
  }
}

/**
 * Validate upload form
 * @returns {boolean} True if form is valid
 */
function validateUploadForm() {
  // Check if file is selected
  if (!elements.uploadFile.files.length) {
    showError(elements.uploadError, 'Please select a file to upload');
    return false;
  }
  
  // Check file type
  const file = elements.uploadFile.files[0];
  const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  if (!allowedTypes.includes(file.type)) {
    showError(elements.uploadError, 'Invalid file type. Please upload a PDF, TXT or DOC file');
    return false;
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    showError(elements.uploadError, 'File size too large. Maximum file size is 10MB');
    return false;
  }
  
  // Check if title is provided
  if (!elements.uploadTitle.value.trim()) {
    showError(elements.uploadError, 'Please enter a title for the document');
    return false;
  }
  
  // Hide error if exists
  hideError(elements.uploadError);
  
  return true;
}

// Utility functions

/**
 * Show error message
 * @param {HTMLElement|string} elementOrMessage - Error element or message
 * @param {string} [message] - Error message if element provided
 */
function showError(elementOrMessage, message) {
  if (typeof elementOrMessage === 'string') {
    // Create a temporary message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = elementOrMessage;
    document.body.appendChild(errorDiv);
    
    // Remove after timeout
    setTimeout(() => {
      errorDiv.classList.add('fade-out');
      setTimeout(() => {
        document.body.removeChild(errorDiv);
      }, 500);
    }, 3000);
  } else if (elementOrMessage) {
    elementOrMessage.textContent = message;
    elementOrMessage.classList.remove('hidden');
  }
}

/**
 * Hide error message
 * @param {HTMLElement} element - Error element
 */
function hideError(element) {
  if (element) {
    element.textContent = '';
    element.classList.add('hidden');
  }
}

/**
 * Show success message
 * @param {string} message - Success message
 */
function showMessage(message) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'success-message';
  messageDiv.textContent = message;
  document.body.appendChild(messageDiv);
  
  // Remove after timeout
  setTimeout(() => {
    messageDiv.classList.add('fade-out');
    setTimeout(() => {
      document.body.removeChild(messageDiv);
    }, 500);
  }, 3000);
}

/**
 * Toggle loading state for a button
 * @param {HTMLButtonElement} button - Button element
 * @param {boolean} isLoading - Whether to show loading state
 */
function toggleButtonLoading(button, isLoading) {
  if (button) {
    if (isLoading) {
      button.setAttribute('disabled', 'disabled');
      button.dataset.originalText = button.textContent;
      button.textContent = 'Loading...';
    } else {
      button.removeAttribute('disabled');
      button.textContent = button.dataset.originalText || 'Submit';
    }
  }
}

/**
 * Toggle loader visibility
 * @param {boolean} show - Whether to show the loader
 */
function toggleLoader(show) {
  if (elements.documentLoader) {
    if (show) {
      elements.documentLoader.classList.remove('hidden');
    } else {
      elements.documentLoader.classList.add('hidden');
    }
  }
}

/**
 * Toggle upload loading state
 * @param {boolean} isLoading - Whether loading is in progress
 */
function toggleUploadLoading(isLoading) {
  // Toggle button loading state
  toggleButtonLoading(elements.uploadSubmit, isLoading);
  
  // Reset progress bar
  if (elements.uploadProgress) {
    elements.uploadProgress.style.width = isLoading ? '0%' : '100%';
    elements.uploadProgress.classList.toggle('hidden', !isLoading);
  }
}

/**
 * Format date as a readable string
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Truncate text to a specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + '...';
} 