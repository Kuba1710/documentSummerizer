/**
 * Dashboard Module - Centralized user dashboard for SciSummarize
 * Manages document listing, summary tracking, and user account overview
 */

import { 
  getUserDocuments, 
  getUserSummaries, 
  getUserStats, 
  deleteDocument,
  getRecentActivity
} from './api.js';

// DOM Elements cache
let documentsContainer;
let summariesContainer;
let statsContainer;
let activityFeed;
let dashboardTabs;
let filterControls;
let sortControls;

// Dashboard state
const state = {
  activeTab: 'documents', // 'documents', 'summaries', 'account'
  documents: {
    items: [],
    loading: false,
    filter: 'all', // 'all', 'recent', 'favorites'
    sort: 'date-desc', // 'date-desc', 'date-asc', 'name-asc', 'name-desc'
    page: 1,
    hasMore: false
  },
  summaries: {
    items: [],
    loading: false,
    filter: 'all', // 'all', 'completed', 'draft'
    sort: 'date-desc',
    page: 1,
    hasMore: false
  },
  stats: {
    totalDocuments: 0,
    totalSummaries: 0,
    savedReadingTime: 0,
    favoriteTopics: []
  },
  activity: {
    items: [],
    loading: false
  }
};

/**
 * Initialize dashboard module
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
  documentsContainer = document.getElementById('documentsContainer');
  summariesContainer = document.getElementById('summariesContainer');
  statsContainer = document.getElementById('statsContainer');
  activityFeed = document.getElementById('activityFeed');
  dashboardTabs = document.querySelectorAll('.dashboard-tab');
  filterControls = document.getElementById('filterControls');
  sortControls = document.getElementById('sortControls');
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Tab switching
  if (dashboardTabs) {
    dashboardTabs.forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
  }
  
  // Filter and sort controls
  if (filterControls) {
    const filterSelects = filterControls.querySelectorAll('select');
    filterSelects.forEach(select => {
      select.addEventListener('change', handleFilterChange);
    });
  }
  
  if (sortControls) {
    const sortSelects = sortControls.querySelectorAll('select');
    sortSelects.forEach(select => {
      select.addEventListener('change', handleSortChange);
    });
  }
  
  // Load more button
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadMoreItems);
  }
  
  // Document delete buttons will be handled via event delegation
  if (documentsContainer) {
    documentsContainer.addEventListener('click', handleDocumentActions);
  }
  
  // Summary actions will be handled via event delegation
  if (summariesContainer) {
    summariesContainer.addEventListener('click', handleSummaryActions);
  }
}

/**
 * Load initial dashboard data
 */
async function loadInitialData() {
  // Show loading state
  showLoading(state.activeTab);
  
  try {
    // Load data based on active tab
    switch (state.activeTab) {
      case 'documents':
        await loadDocuments();
        break;
      case 'summaries':
        await loadSummaries();
        break;
      case 'account':
        await loadUserStats();
        await loadRecentActivity();
        break;
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showError('Failed to load dashboard data. Please try again.');
  } finally {
    hideLoading(state.activeTab);
  }
}

/**
 * Switch between dashboard tabs
 * @param {string} tab - Tab to switch to
 */
function switchTab(tab) {
  if (!tab || tab === state.activeTab) return;
  
  // Update active tab state
  state.activeTab = tab;
  
  // Update tab UI
  dashboardTabs.forEach(tabEl => {
    if (tabEl.dataset.tab === tab) {
      tabEl.classList.add('active');
    } else {
      tabEl.classList.remove('active');
    }
  });
  
  // Show/hide content sections
  const contentSections = document.querySelectorAll('.dashboard-content');
  contentSections.forEach(section => {
    if (section.dataset.content === tab) {
      section.style.display = 'block';
    } else {
      section.style.display = 'none';
    }
  });
  
  // Load data for the tab if needed
  if ((tab === 'documents' && !state.documents.items.length) ||
      (tab === 'summaries' && !state.summaries.items.length) ||
      (tab === 'account' && !state.activity.items.length)) {
    loadInitialData();
  }
  
  // Update filter/sort controls based on active tab
  updateControls();
}

/**
 * Update filter and sort controls based on active tab
 */
function updateControls() {
  if (!filterControls || !sortControls) return;
  
  // Get the appropriate filter and sort selects
  const filterSelect = filterControls.querySelector(`select[data-filter="${state.activeTab}"]`);
  const sortSelect = sortControls.querySelector(`select[data-sort="${state.activeTab}"]`);
  
  // Hide all filter and sort controls
  filterControls.querySelectorAll('select').forEach(select => {
    select.style.display = 'none';
  });
  
  sortControls.querySelectorAll('select').forEach(select => {
    select.style.display = 'none';
  });
  
  // Show appropriate controls
  if (filterSelect) {
    filterSelect.style.display = 'block';
    filterSelect.value = state[state.activeTab].filter;
  }
  
  if (sortSelect) {
    sortSelect.style.display = 'block';
    sortSelect.value = state[state.activeTab].sort;
  }
}

/**
 * Handle filter change
 * @param {Event} event - Change event
 */
function handleFilterChange(event) {
  const filter = event.target.value;
  const filterType = event.target.dataset.filter;
  
  if (!filterType || !filter) return;
  
  // Update state
  state[filterType].filter = filter;
  state[filterType].page = 1;
  
  // Reload data
  if (filterType === 'documents') {
    loadDocuments();
  } else if (filterType === 'summaries') {
    loadSummaries();
  }
}

/**
 * Handle sort change
 * @param {Event} event - Change event
 */
function handleSortChange(event) {
  const sort = event.target.value;
  const sortType = event.target.dataset.sort;
  
  if (!sortType || !sort) return;
  
  // Update state
  state[sortType].sort = sort;
  state[sortType].page = 1;
  
  // Reload data
  if (sortType === 'documents') {
    loadDocuments();
  } else if (sortType === 'summaries') {
    loadSummaries();
  }
}

/**
 * Load user documents
 */
async function loadDocuments() {
  if (state.documents.loading) return;
  
  state.documents.loading = true;
  
  if (state.documents.page === 1) {
    showLoading('documents');
  }
  
  try {
    // Parse sort option
    const [sortField, sortOrder] = state.documents.sort.split('-');
    
    // Get documents from API
    const response = await getUserDocuments({
      page: state.documents.page,
      filter: state.documents.filter,
      sortBy: sortField,
      sortOrder: sortOrder
    });
    
    // Update state
    if (state.documents.page === 1) {
      state.documents.items = response.documents || [];
    } else {
      state.documents.items = [...state.documents.items, ...(response.documents || [])];
    }
    
    state.documents.hasMore = response.hasMore || false;
    
    // Render documents
    renderDocuments();
  } catch (error) {
    console.error('Error loading documents:', error);
    showError('Failed to load documents. Please try again.');
  } finally {
    state.documents.loading = false;
    hideLoading('documents');
  }
}

/**
 * Load user summaries
 */
async function loadSummaries() {
  if (state.summaries.loading) return;
  
  state.summaries.loading = true;
  
  if (state.summaries.page === 1) {
    showLoading('summaries');
  }
  
  try {
    // Parse sort option
    const [sortField, sortOrder] = state.summaries.sort.split('-');
    
    // Get summaries from API
    const response = await getUserSummaries({
      page: state.summaries.page,
      filter: state.summaries.filter,
      sortBy: sortField,
      sortOrder: sortOrder
    });
    
    // Update state
    if (state.summaries.page === 1) {
      state.summaries.items = response.summaries || [];
    } else {
      state.summaries.items = [...state.summaries.items, ...(response.summaries || [])];
    }
    
    state.summaries.hasMore = response.hasMore || false;
    
    // Render summaries
    renderSummaries();
  } catch (error) {
    console.error('Error loading summaries:', error);
    showError('Failed to load summaries. Please try again.');
  } finally {
    state.summaries.loading = false;
    hideLoading('summaries');
  }
}

/**
 * Load user stats for account overview
 */
async function loadUserStats() {
  try {
    const stats = await getUserStats();
    
    // Update state
    state.stats = stats || {
      totalDocuments: 0,
      totalSummaries: 0,
      savedReadingTime: 0,
      favoriteTopics: []
    };
    
    // Render stats
    renderUserStats();
  } catch (error) {
    console.error('Error loading user stats:', error);
    showError('Failed to load account statistics.');
  }
}

/**
 * Load recent user activity
 */
async function loadRecentActivity() {
  if (state.activity.loading) return;
  
  state.activity.loading = true;
  showLoading('activity');
  
  try {
    const activity = await getRecentActivity();
    
    // Update state
    state.activity.items = activity || [];
    
    // Render activity feed
    renderActivityFeed();
  } catch (error) {
    console.error('Error loading activity feed:', error);
    showError('Failed to load recent activity.');
  } finally {
    state.activity.loading = false;
    hideLoading('activity');
  }
}

/**
 * Load more items for current active tab
 */
function loadMoreItems() {
  if (state.activeTab === 'documents' && state.documents.hasMore) {
    state.documents.page++;
    loadDocuments();
  } else if (state.activeTab === 'summaries' && state.summaries.hasMore) {
    state.summaries.page++;
    loadSummaries();
  }
}

/**
 * Render documents list
 */
function renderDocuments() {
  if (!documentsContainer) return;
  
  // Clear container if first page
  if (state.documents.page === 1) {
    documentsContainer.innerHTML = '';
  }
  
  // Show no documents message if empty
  if (!state.documents.items.length) {
    documentsContainer.innerHTML = `
      <div class="empty-state">
        <img src="/static/images/empty-documents.svg" alt="No documents" class="empty-icon">
        <h3>No documents found</h3>
        <p>Upload your first document to get started.</p>
        <a href="/upload" class="btn btn-primary">Upload Document</a>
      </div>
    `;
    return;
  }
  
  // Create document cards
  state.documents.items.forEach(doc => {
    // Skip if already rendered
    if (documentsContainer.querySelector(`[data-document-id="${doc.id}"]`)) {
      return;
    }
    
    const card = document.createElement('div');
    card.className = 'document-card';
    card.dataset.documentId = doc.id;
    
    // Format date
    const uploadDate = new Date(doc.uploadDate).toLocaleDateString();
    
    // Get file extension for icon
    const extension = doc.filename.split('.').pop().toLowerCase();
    
    card.innerHTML = `
      <div class="document-icon ${extension}-icon"></div>
      <div class="document-info">
        <h3 class="document-title">
          <a href="/document/${doc.id}">${doc.title || doc.filename}</a>
        </h3>
        <div class="document-meta">
          <span class="document-date">Uploaded: ${uploadDate}</span>
          <span class="document-pages">${doc.pageCount || '?'} pages</span>
        </div>
        ${doc.hasSummary ? '<span class="badge summary-badge">Summarized</span>' : ''}
      </div>
      <div class="document-actions">
        <button class="btn btn-icon view-btn" data-action="view" title="View Document">
          <i class="icon-eye"></i>
        </button>
        <button class="btn btn-icon ${doc.isFavorite ? 'favorite active' : 'favorite'}" data-action="favorite" title="Add to Favorites">
          <i class="icon-star"></i>
        </button>
        <button class="btn btn-icon delete-btn" data-action="delete" title="Delete Document">
          <i class="icon-trash"></i>
        </button>
      </div>
    `;
    
    documentsContainer.appendChild(card);
  });
  
  // Update load more button visibility
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.style.display = state.documents.hasMore ? 'block' : 'none';
  }
}

/**
 * Render summaries list
 */
function renderSummaries() {
  if (!summariesContainer) return;
  
  // Clear container if first page
  if (state.summaries.page === 1) {
    summariesContainer.innerHTML = '';
  }
  
  // Show no summaries message if empty
  if (!state.summaries.items.length) {
    summariesContainer.innerHTML = `
      <div class="empty-state">
        <img src="/static/images/empty-summaries.svg" alt="No summaries" class="empty-icon">
        <h3>No summaries found</h3>
        <p>Create your first summary by uploading and processing a document.</p>
        <a href="/upload" class="btn btn-primary">Upload Document</a>
      </div>
    `;
    return;
  }
  
  // Create summary cards
  state.summaries.items.forEach(summary => {
    // Skip if already rendered
    if (summariesContainer.querySelector(`[data-summary-id="${summary.id}"]`)) {
      return;
    }
    
    const card = document.createElement('div');
    card.className = 'summary-card';
    card.dataset.summaryId = summary.id;
    
    // Format dates
    const createDate = new Date(summary.createdAt).toLocaleDateString();
    const updateDate = summary.updatedAt ? new Date(summary.updatedAt).toLocaleDateString() : null;
    
    card.innerHTML = `
      <div class="summary-info">
        <h3 class="summary-title">
          <a href="/summary/${summary.id}">${summary.title}</a>
        </h3>
        <div class="summary-meta">
          <span class="summary-date">Created: ${createDate}</span>
          ${updateDate ? `<span class="summary-date">Updated: ${updateDate}</span>` : ''}
          <span class="summary-length">${summary.wordCount || 0} words</span>
        </div>
        <p class="summary-excerpt">${summary.excerpt || 'No preview available'}</p>
      </div>
      <div class="summary-actions">
        <button class="btn btn-icon view-btn" data-action="view" title="View Summary">
          <i class="icon-eye"></i>
        </button>
        <button class="btn btn-icon edit-btn" data-action="edit" title="Edit Summary">
          <i class="icon-edit"></i>
        </button>
        <button class="btn btn-icon export-btn" data-action="export" title="Export Summary">
          <i class="icon-download"></i>
        </button>
      </div>
    `;
    
    summariesContainer.appendChild(card);
  });
  
  // Update load more button visibility
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.style.display = state.summaries.hasMore ? 'block' : 'none';
  }
}

/**
 * Render user stats
 */
function renderUserStats() {
  if (!statsContainer) return;
  
  statsContainer.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="icon-document"></i>
        </div>
        <div class="stat-info">
          <h3 class="stat-value">${state.stats.totalDocuments}</h3>
          <p class="stat-label">Documents</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="icon-summary"></i>
        </div>
        <div class="stat-info">
          <h3 class="stat-value">${state.stats.totalSummaries}</h3>
          <p class="stat-label">Summaries</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="icon-clock"></i>
        </div>
        <div class="stat-info">
          <h3 class="stat-value">${formatReadingTime(state.stats.savedReadingTime)}</h3>
          <p class="stat-label">Reading Time Saved</p>
        </div>
      </div>
    </div>
    
    <div class="favorite-topics">
      <h3>Favorite Topics</h3>
      <div class="topic-tags">
        ${state.stats.favoriteTopics.length ? 
          state.stats.favoriteTopics.map(topic => 
            `<span class="topic-tag">${topic.name} (${topic.count})</span>`
          ).join('') : 
          '<p>No favorite topics yet</p>'
        }
      </div>
    </div>
  `;
}

/**
 * Render activity feed
 */
function renderActivityFeed() {
  if (!activityFeed) return;
  
  // Clear container
  activityFeed.innerHTML = '';
  
  // Show no activity message if empty
  if (!state.activity.items.length) {
    activityFeed.innerHTML = `
      <div class="empty-activity">
        <p>No recent activity</p>
      </div>
    `;
    return;
  }
  
  // Create activity timeline
  const timeline = document.createElement('div');
  timeline.className = 'activity-timeline';
  
  state.activity.items.forEach(activity => {
    const item = document.createElement('div');
    item.className = 'activity-item';
    
    // Format date
    const activityDate = new Date(activity.timestamp).toLocaleString();
    
    // Set icon based on activity type
    let icon = '';
    switch (activity.type) {
      case 'upload':
        icon = 'icon-upload';
        break;
      case 'summary':
        icon = 'icon-summary';
        break;
      case 'edit':
        icon = 'icon-edit';
        break;
      case 'export':
        icon = 'icon-download';
        break;
      default:
        icon = 'icon-activity';
    }
    
    item.innerHTML = `
      <div class="activity-icon">
        <i class="${icon}"></i>
      </div>
      <div class="activity-content">
        <p class="activity-text">${activity.description}</p>
        <span class="activity-date">${activityDate}</span>
      </div>
    `;
    
    timeline.appendChild(item);
  });
  
  activityFeed.appendChild(timeline);
}

/**
 * Handle document actions (view, favorite, delete)
 * @param {Event} event - Click event
 */
function handleDocumentActions(event) {
  const actionBtn = event.target.closest('[data-action]');
  
  if (!actionBtn) return;
  
  const action = actionBtn.dataset.action;
  const docCard = actionBtn.closest('.document-card');
  
  if (!docCard) return;
  
  const docId = docCard.dataset.documentId;
  
  switch (action) {
    case 'view':
      // Navigate to document
      window.location.href = `/document/${docId}`;
      break;
      
    case 'favorite':
      // Toggle favorite
      toggleFavoriteDocument(docId, actionBtn);
      break;
      
    case 'delete':
      // Confirm and delete document
      confirmDeleteDocument(docId, docCard);
      break;
  }
}

/**
 * Handle summary actions (view, edit, export)
 * @param {Event} event - Click event
 */
function handleSummaryActions(event) {
  const actionBtn = event.target.closest('[data-action]');
  
  if (!actionBtn) return;
  
  const action = actionBtn.dataset.action;
  const summaryCard = actionBtn.closest('.summary-card');
  
  if (!summaryCard) return;
  
  const summaryId = summaryCard.dataset.summaryId;
  
  switch (action) {
    case 'view':
      // Navigate to summary
      window.location.href = `/summary/${summaryId}`;
      break;
      
    case 'edit':
      // Navigate to summary editor
      window.location.href = `/summary/${summaryId}/edit`;
      break;
      
    case 'export':
      // Export summary
      exportSummary(summaryId);
      break;
  }
}

/**
 * Toggle document as favorite
 * @param {string} docId - Document ID
 * @param {HTMLElement} btn - Favorite button
 */
async function toggleFavoriteDocument(docId, btn) {
  try {
    // Toggle favorite via API
    // await api.toggleFavoriteDocument(docId);
    
    // Toggle button state
    btn.classList.toggle('active');
    
    // Update document in state
    const docIndex = state.documents.items.findIndex(doc => doc.id === docId);
    if (docIndex !== -1) {
      state.documents.items[docIndex].isFavorite = !state.documents.items[docIndex].isFavorite;
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    showError('Failed to update favorite status.');
  }
}

/**
 * Confirm and delete document
 * @param {string} docId - Document ID
 * @param {HTMLElement} card - Document card element
 */
function confirmDeleteDocument(docId, card) {
  // Show confirmation dialog
  const confirmed = confirm('Are you sure you want to delete this document? This cannot be undone.');
  
  if (confirmed) {
    deleteDocumentById(docId, card);
  }
}

/**
 * Delete document by ID
 * @param {string} docId - Document ID
 * @param {HTMLElement} card - Document card element
 */
async function deleteDocumentById(docId, card) {
  try {
    // Delete document via API
    await deleteDocument(docId);
    
    // Remove card from UI with animation
    card.classList.add('deleting');
    
    setTimeout(() => {
      card.remove();
      
      // Remove document from state
      state.documents.items = state.documents.items.filter(doc => doc.id !== docId);
      
      // Show empty state if no documents left
      if (!state.documents.items.length && documentsContainer) {
        renderDocuments();
      }
      
      // Update user stats
      if (state.stats.totalDocuments > 0) {
        state.stats.totalDocuments--;
        renderUserStats();
      }
    }, 300);
  } catch (error) {
    console.error('Error deleting document:', error);
    showError('Failed to delete document.');
  }
}

/**
 * Export summary to PDF
 * @param {string} summaryId - Summary ID
 */
function exportSummary(summaryId) {
  // Open export page in new tab
  window.open(`/summary/${summaryId}/export`, '_blank');
}

/**
 * Format reading time minutes into readable string
 * @param {number} minutes - Reading time in minutes
 * @returns {string} Formatted reading time
 */
function formatReadingTime(minutes) {
  if (!minutes) return '0 min';
  
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  
  return `${hours} hr ${remainingMinutes} min`;
}

/**
 * Show loading state for a section
 * @param {string} section - Section to show loading for
 */
function showLoading(section) {
  const container = getContainerBySection(section);
  
  if (!container) return;
  
  // Add loading overlay if not exists
  if (!container.querySelector('.loading-overlay')) {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = `
      <div class="loading-spinner"></div>
      <p>Loading...</p>
    `;
    
    container.appendChild(loadingOverlay);
  }
}

/**
 * Hide loading state for a section
 * @param {string} section - Section to hide loading for
 */
function hideLoading(section) {
  const container = getContainerBySection(section);
  
  if (!container) return;
  
  // Remove loading overlay if exists
  const loadingOverlay = container.querySelector('.loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.remove();
  }
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  const errorContainer = document.getElementById('errorContainer');
  
  if (!errorContainer) return;
  
  errorContainer.textContent = message;
  errorContainer.style.display = 'block';
  
  // Auto-hide after delay
  setTimeout(() => {
    errorContainer.style.display = 'none';
  }, 5000);
}

/**
 * Get container element by section
 * @param {string} section - Section name
 * @returns {HTMLElement} Container element
 */
function getContainerBySection(section) {
  switch (section) {
    case 'documents':
      return documentsContainer;
    case 'summaries':
      return summariesContainer;
    case 'account':
      return statsContainer;
    case 'activity':
      return activityFeed;
    default:
      return null;
  }
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', init);

// Export public methods
export default {
  init,
  switchTab,
  loadDocuments,
  loadSummaries,
  loadUserStats
}; 