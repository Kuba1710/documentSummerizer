/**
 * Document module for SciSummarize
 * Handles document viewing and operations
 */

// Create global Document object
window.Document = {};

// Cache DOM elements
const elements = {
  viewer: null,
  summary: null,
  controls: null,
  exportBtn: null,
  shareBtn: null,
  downloadBtn: null
};

/**
 * Initialize document module
 */
window.Document.init = function() {
  console.log('Initializing document module...');
  
  // Cache DOM elements
  cacheElements();
  
  // Setup event listeners
  setupEventListeners();
  
  return Promise.resolve();
};

/**
 * Cache DOM elements for better performance
 */
function cacheElements() {
  elements.viewer = document.getElementById('document-viewer');
  elements.summary = document.getElementById('document-summary');
  elements.controls = document.getElementById('document-controls');
  elements.exportBtn = document.getElementById('export-document');
  elements.shareBtn = document.getElementById('share-document');
  elements.downloadBtn = document.getElementById('download-document');
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Export document
  if (elements.exportBtn) {
    elements.exportBtn.addEventListener('click', handleExport);
  }
  
  // Share document
  if (elements.shareBtn) {
    elements.shareBtn.addEventListener('click', handleShare);
  }
  
  // Download document
  if (elements.downloadBtn) {
    elements.downloadBtn.addEventListener('click', handleDownload);
  }
}

/**
 * Handle document export
 */
function handleExport() {
  const documentId = elements.viewer ? elements.viewer.dataset.documentId : null;
  
  if (!documentId) {
    console.error('No document ID found');
    return;
  }
  
  // Show export options modal or redirect to export page
  console.log('Export document:', documentId);
}

/**
 * Handle document sharing
 */
function handleShare() {
  const documentId = elements.viewer ? elements.viewer.dataset.documentId : null;
  
  if (!documentId) {
    console.error('No document ID found');
    return;
  }
  
  // Get document URL
  const url = window.location.origin + '/documents/' + documentId;
  
  // Show sharing options
  if (navigator.share) {
    navigator.share({
      title: 'SciSummarize Document',
      text: 'Check out this document on SciSummarize',
      url: url
    })
    .then(() => console.log('Shared successfully'))
    .catch(err => console.error('Error sharing:', err));
  } else {
    // Fallback for browsers that don't support the Web Share API
    prompt('Copy this link to share the document:', url);
  }
}

/**
 * Handle document download
 */
function handleDownload() {
  const documentId = elements.viewer ? elements.viewer.dataset.documentId : null;
  
  if (!documentId) {
    console.error('No document ID found');
    return;
  }
  
  // Download the original document
  window.location.href = `/api/documents/${documentId}/download`;
}

// Export public methods
window.Document.loadDocument = function(documentId) {
  if (!documentId) return Promise.reject('No document ID provided');
  
  return window.API.request(`/documents/${documentId}`, { method: 'GET' })
    .then(document => {
      console.log('Document loaded:', document);
      return document;
    });
}; 