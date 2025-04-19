/**
 * Export Module - Handles document and summary exporting for SciSummarize
 * Manages exporting to PDF, HTML, and plain text formats
 */

import { getDocument, getSummary, exportDocument } from './api.js';

// DOM element cache
let exportForm;
let formatSelector;
let includeOptions;
let exportButton;
let exportPreview;
let exportStatus;
let customizeSection;
let downloadLink;

// Export state
const state = {
  documentId: null,
  summaryId: null,
  format: 'pdf', // 'pdf', 'html', 'txt'
  isLoading: false,
  document: null,
  summary: null,
  options: {
    includeOriginal: false,
    includeSummary: true,
    includeMetadata: true,
    includeHighlights: true,
    includeNotes: true
  },
  customStyles: {
    fontFamily: 'Arial, sans-serif',
    fontSize: '12pt',
    lineHeight: '1.5',
    margin: '1in'
  }
};

/**
 * Initialize the export module
 */
function init() {
  cacheElements();
  setupEventListeners();
  loadInitialData();
}

/**
 * Cache DOM elements for performance
 */
function cacheElements() {
  exportForm = document.getElementById('exportForm');
  formatSelector = document.getElementById('exportFormat');
  includeOptions = document.querySelectorAll('input[name^="include"]');
  exportButton = document.getElementById('exportButton');
  exportPreview = document.getElementById('exportPreview');
  exportStatus = document.getElementById('exportStatus');
  customizeSection = document.getElementById('customizeSection');
  downloadLink = document.getElementById('downloadExport');
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  if (exportForm) {
    exportForm.addEventListener('submit', handleExportSubmit);
  }
  
  if (formatSelector) {
    formatSelector.addEventListener('change', handleFormatChange);
  }
  
  if (includeOptions) {
    includeOptions.forEach(option => {
      option.addEventListener('change', handleOptionChange);
    });
  }
  
  // Custom style inputs
  const styleInputs = document.querySelectorAll('.style-input');
  if (styleInputs) {
    styleInputs.forEach(input => {
      input.addEventListener('change', handleStyleChange);
    });
  }
  
  // Handle refresh preview button
  const refreshPreviewBtn = document.getElementById('refreshPreview');
  if (refreshPreviewBtn) {
    refreshPreviewBtn.addEventListener('click', updatePreview);
  }
}

/**
 * Load initial data based on URL parameters
 */
function loadInitialData() {
  // Get document and/or summary ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const documentId = urlParams.get('documentId');
  const summaryId = urlParams.get('summaryId');
  
  if (documentId) {
    state.documentId = documentId;
    loadDocument(documentId);
  }
  
  if (summaryId) {
    state.summaryId = summaryId;
    loadSummary(summaryId);
  } else if (documentId) {
    // If we have a document ID but no summary ID, try to load its summary
    loadSummaryForDocument(documentId);
  }
  
  // Set initial format
  const format = urlParams.get('format');
  if (format && ['pdf', 'html', 'txt'].includes(format)) {
    state.format = format;
    if (formatSelector) {
      formatSelector.value = format;
    }
  }
  
  // Update UI based on format
  updateUIForFormat();
}

/**
 * Load document by ID
 * @param {string} documentId - Document ID
 */
async function loadDocument(documentId) {
  if (!documentId || state.isLoading) return;
  
  state.isLoading = true;
  showLoading();
  
  try {
    const document = await getDocument(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    state.document = document;
    
    // Update preview
    updatePreview();
    
  } catch (error) {
    console.error('Error loading document:', error);
    showError('Failed to load document: ' + error.message);
  } finally {
    state.isLoading = false;
    hideLoading();
  }
}

/**
 * Load summary by ID
 * @param {string} summaryId - Summary ID
 */
async function loadSummary(summaryId) {
  if (!summaryId || state.isLoading) return;
  
  state.isLoading = true;
  showLoading();
  
  try {
    const summary = await getSummary(summaryId);
    
    if (!summary) {
      throw new Error('Summary not found');
    }
    
    state.summary = summary;
    
    // If we don't have the document yet and the summary has a document ID, load the document
    if (!state.document && summary.documentId) {
      state.documentId = summary.documentId;
      await loadDocument(summary.documentId);
    } else {
      // Update preview
      updatePreview();
    }
    
  } catch (error) {
    console.error('Error loading summary:', error);
    showError('Failed to load summary: ' + error.message);
  } finally {
    state.isLoading = false;
    hideLoading();
  }
}

/**
 * Load summary for document
 * @param {string} documentId - Document ID
 */
async function loadSummaryForDocument(documentId) {
  if (!documentId || state.isLoading) return;
  
  try {
    // First check if the document has a summary
    const document = state.document || await getDocument(documentId);
    
    if (document && document.hasSummary) {
      // Load summary
      const summary = await getSummary(documentId);
      
      if (summary) {
        state.summary = summary;
        state.summaryId = summary.id;
        
        // Update preview
        updatePreview();
      }
    }
  } catch (error) {
    console.error('Error loading summary for document:', error);
    // Not showing error to user since summary is optional
  }
}

/**
 * Handle export format change
 * @param {Event} event - Change event
 */
function handleFormatChange(event) {
  state.format = event.target.value;
  updateUIForFormat();
  updatePreview();
}

/**
 * Update UI based on selected format
 */
function updateUIForFormat() {
  // Show/hide options based on format
  const pdfOptions = document.querySelectorAll('.pdf-only');
  const htmlOptions = document.querySelectorAll('.html-only');
  
  if (pdfOptions) {
    pdfOptions.forEach(option => {
      option.style.display = state.format === 'pdf' ? 'block' : 'none';
    });
  }
  
  if (htmlOptions) {
    htmlOptions.forEach(option => {
      option.style.display = state.format === 'html' ? 'block' : 'none';
    });
  }
  
  // Show/hide customize section
  if (customizeSection) {
    customizeSection.style.display = ['pdf', 'html'].includes(state.format) ? 'block' : 'none';
  }
}

/**
 * Handle export option change
 * @param {Event} event - Change event
 */
function handleOptionChange(event) {
  const option = event.target.name.replace('include', '').toLowerCase();
  state.options[`include${option.charAt(0).toUpperCase() + option.slice(1)}`] = event.target.checked;
  updatePreview();
}

/**
 * Handle style customization change
 * @param {Event} event - Change event
 */
function handleStyleChange(event) {
  const style = event.target.name.replace('style', '').toLowerCase();
  state.customStyles[style] = event.target.value;
  updatePreview();
}

/**
 * Update export preview
 */
function updatePreview() {
  if (!exportPreview) return;
  
  // If no document or summary, show message
  if (!state.document && !state.summary) {
    exportPreview.innerHTML = '<p class="no-data">Nothing to preview. Please select a document or summary to export.</p>';
    return;
  }
  
  // Generate preview HTML
  const previewHTML = generatePreviewHTML();
  
  // Update preview container
  exportPreview.innerHTML = previewHTML;
  
  // Apply custom styles to preview
  applyStylesToPreview();
}

/**
 * Generate preview HTML based on current state
 * @returns {string} Preview HTML
 */
function generatePreviewHTML() {
  let html = '';
  
  // Start with document title or summary title
  const title = (state.document && state.document.title) || 
                (state.summary && state.summary.title) || 
                'Untitled Document';
  
  html += `<h1 class="export-title">${title}</h1>`;
  
  // Add metadata if included
  if (state.options.includeMetadata && state.document) {
    html += '<div class="export-metadata">';
    
    if (state.document.authors && state.document.authors.length) {
      html += `<p><strong>Authors:</strong> ${state.document.authors.join(', ')}</p>`;
    }
    
    if (state.document.publicationDate) {
      const date = new Date(state.document.publicationDate).toLocaleDateString();
      html += `<p><strong>Publication Date:</strong> ${date}</p>`;
    }
    
    if (state.document.journal) {
      html += `<p><strong>Journal:</strong> ${state.document.journal}</p>`;
    }
    
    if (state.document.doi) {
      html += `<p><strong>DOI:</strong> ${state.document.doi}</p>`;
    }
    
    html += '</div>';
  }
  
  // Add summary if included
  if (state.options.includeSummary && state.summary) {
    html += '<div class="export-summary">';
    html += '<h2>Summary</h2>';
    html += state.summary.content;
    html += '</div>';
  }
  
  // Add original content if included
  if (state.options.includeOriginal && state.document) {
    html += '<div class="export-original">';
    
    if (state.options.includeSummary) {
      // If we're including both, add a heading for the original
      html += '<h2>Original Document</h2>';
    }
    
    html += state.document.content;
    html += '</div>';
  }
  
  // Add highlights if included
  if (state.options.includeHighlights && state.document && state.document.highlights && state.document.highlights.length) {
    html += '<div class="export-highlights">';
    html += '<h2>Highlighted Text</h2>';
    html += '<ul class="highlights-list">';
    
    state.document.highlights.forEach(highlight => {
      html += `<li class="highlight" style="border-left: 3px solid ${highlight.color || '#ffeb3b'}; padding-left: 10px;">`;
      html += `<p>${highlight.text}</p>`;
      html += '</li>';
    });
    
    html += '</ul>';
    html += '</div>';
  }
  
  // Add notes if included
  if (state.options.includeNotes && state.document && state.document.notes && state.document.notes.length) {
    html += '<div class="export-notes">';
    html += '<h2>Notes</h2>';
    html += '<ul class="notes-list">';
    
    state.document.notes.forEach(note => {
      const date = new Date(note.createdAt).toLocaleDateString();
      html += `<li class="note">`;
      html += `<p>${note.content}</p>`;
      html += `<span class="note-date">${date}</span>`;
      html += '</li>';
    });
    
    html += '</ul>';
    html += '</div>';
  }
  
  return html;
}

/**
 * Apply custom styles to preview
 */
function applyStylesToPreview() {
  // Create style element if it doesn't exist
  let styleEl = document.getElementById('previewStyles');
  
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'previewStyles';
    document.head.appendChild(styleEl);
  }
  
  // Define CSS
  const css = `
    #exportPreview {
      font-family: ${state.customStyles.fontFamily};
      font-size: ${state.customStyles.fontSize};
      line-height: ${state.customStyles.lineHeight};
      padding: 20px;
      background-color: white;
      color: black;
    }
    
    #exportPreview .export-title {
      text-align: center;
      margin-bottom: 20px;
    }
    
    #exportPreview .export-metadata {
      margin-bottom: 20px;
      border-bottom: 1px solid #eee;
      padding-bottom: 15px;
    }
    
    #exportPreview .export-summary {
      margin-bottom: 30px;
    }
    
    #exportPreview .export-original {
      margin-top: 30px;
    }
    
    #exportPreview h2 {
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
      margin: 20px 0;
    }
    
    #exportPreview .highlights-list,
    #exportPreview .notes-list {
      padding-left: 0;
      list-style-type: none;
    }
    
    #exportPreview .highlight,
    #exportPreview .note {
      margin-bottom: 15px;
      padding: 10px;
      background-color: #f9f9f9;
    }
    
    #exportPreview .note-date {
      display: block;
      font-size: 0.8em;
      color: #666;
      text-align: right;
    }
  `;
  
  styleEl.textContent = css;
}

/**
 * Handle export form submission
 * @param {Event} event - Form submit event
 */
async function handleExportSubmit(event) {
  event.preventDefault();
  
  if (state.isLoading || !state.documentId && !state.summaryId) return;
  
  state.isLoading = true;
  showLoading();
  
  try {
    // Create export request data
    const exportData = {
      documentId: state.documentId,
      summaryId: state.summaryId,
      format: state.format,
      options: state.options,
      styles: state.customStyles
    };
    
    // Call export API
    const result = await exportDocument(exportData);
    
    if (!result || !result.url) {
      throw new Error('Export failed, no download URL returned');
    }
    
    // Show success message
    showSuccess('Export successful!');
    
    // Set download link
    if (downloadLink) {
      downloadLink.href = result.url;
      downloadLink.download = result.filename || `export.${state.format}`;
      downloadLink.style.display = 'inline-block';
      
      // Auto-click download link
      setTimeout(() => {
        downloadLink.click();
      }, 1000);
    } else {
      // Fallback if no download link element
      window.location.href = result.url;
    }
    
  } catch (error) {
    console.error('Export error:', error);
    showError('Failed to generate export: ' + error.message);
  } finally {
    state.isLoading = false;
    hideLoading();
  }
}

/**
 * Show loading state
 */
function showLoading() {
  if (exportButton) {
    exportButton.disabled = true;
    exportButton.innerHTML = '<span class="spinner"></span> Processing...';
  }
  
  // Add loading overlay to preview
  if (exportPreview && !exportPreview.querySelector('.loading-overlay')) {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = '<div class="spinner"></div><p>Generating preview...</p>';
    exportPreview.appendChild(overlay);
  }
}

/**
 * Hide loading state
 */
function hideLoading() {
  if (exportButton) {
    exportButton.disabled = false;
    exportButton.textContent = 'Export Document';
  }
  
  // Remove loading overlay from preview
  if (exportPreview) {
    const overlay = exportPreview.querySelector('.loading-overlay');
    if (overlay) {
      overlay.remove();
    }
  }
}

/**
 * Show success message
 * @param {string} message - Success message
 */
function showSuccess(message) {
  if (!exportStatus) return;
  
  exportStatus.textContent = message;
  exportStatus.className = 'status-success';
  exportStatus.style.display = 'block';
  
  setTimeout(() => {
    exportStatus.style.display = 'none';
  }, 5000);
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  if (!exportStatus) return;
  
  exportStatus.textContent = message;
  exportStatus.className = 'status-error';
  exportStatus.style.display = 'block';
}

/**
 * Get current export configuration
 * @returns {Object} Export configuration
 */
function getExportConfig() {
  return {
    documentId: state.documentId,
    summaryId: state.summaryId,
    format: state.format,
    options: { ...state.options },
    styles: { ...state.customStyles }
  };
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', init);

// Export public methods
export default {
  init,
  updatePreview,
  getExportConfig,
  loadDocument,
  loadSummary
}; 