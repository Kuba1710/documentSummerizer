/**
 * Search module for SciSummarize
 * Handles document searching, results display, and filtering
 */

// Create global Search object
window.Search = {};

// Cache DOM elements for better performance
const elements = {
  searchForm: null,
  searchInput: null,
  searchResults: null,
  resultsCount: null,
  filterSection: null,
  sortSelect: null,
  dateStartInput: null,
  dateEndInput: null,
  filterToggles: null,
  paginationContainer: null,
  prevPageBtn: null,
  nextPageBtn: null,
  pageInfo: null,
  clearSearchBtn: null
};

// Search state
const state = {
  query: '',
  page: 1,
  pageSize: 10,
  totalPages: 0,
  totalResults: 0,
  filters: {
    sort: 'date-desc',
    dateStart: '',
    dateEnd: '',
    includedTypes: ['pdf', 'doc', 'docx', 'txt'],
    tags: []
  }
};

/**
 * Initialize search module
 * @param {Object} options - Configuration options
 */
window.Search.init = function(options = {}) {
  console.log('Initializing search module...');
  
  // Override default page size if provided
  if (options.resultsPerPage) {
    state.pageSize = options.resultsPerPage;
  }
  
  // Cache DOM elements
  cacheElements();
  
  // Setup event listeners
  setupEventListeners();
  
  // Check for search query in URL
  const urlParams = new URLSearchParams(window.location.search);
  const queryParam = urlParams.get('q');
  
  if (queryParam) {
    // Set the search input value
    elements.searchInput.value = queryParam;
    state.query = queryParam;
    
    // Perform search
    performSearch();
  }
  
  return Promise.resolve();
};

/**
 * Cache DOM elements for better performance
 */
function cacheElements() {
  elements.searchForm = document.getElementById('search-form');
  elements.searchInput = document.getElementById('search-input');
  elements.searchResults = document.getElementById('search-results');
  elements.resultsCount = document.getElementById('results-count');
  elements.filterSection = document.getElementById('search-filters');
  elements.sortSelect = document.getElementById('sort-select');
  elements.dateStartInput = document.getElementById('date-start');
  elements.dateEndInput = document.getElementById('date-end');
  elements.filterToggles = document.querySelectorAll('.filter-toggle');
  elements.paginationContainer = document.getElementById('pagination');
  elements.prevPageBtn = document.getElementById('prev-page');
  elements.nextPageBtn = document.getElementById('next-page');
  elements.pageInfo = document.getElementById('page-info');
  elements.clearSearchBtn = document.getElementById('clear-search');
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Search form submission
  if (elements.searchForm) {
    elements.searchForm.addEventListener('submit', handleSearchSubmit);
  }
  
  // Clear search button
  if (elements.clearSearchBtn) {
    elements.clearSearchBtn.addEventListener('click', handleClearSearch);
  }
  
  // Sort change
  if (elements.sortSelect) {
    elements.sortSelect.addEventListener('change', handleSortChange);
  }
  
  // Date range
  if (elements.dateStartInput) {
    elements.dateStartInput.addEventListener('change', handleDateRangeChange);
  }
  
  if (elements.dateEndInput) {
    elements.dateEndInput.addEventListener('change', handleDateRangeChange);
  }
  
  // Filter toggles
  if (elements.filterToggles) {
    elements.filterToggles.forEach(toggle => {
      toggle.addEventListener('change', handleFilterToggle);
    });
  }
  
  // Pagination
  if (elements.prevPageBtn) {
    elements.prevPageBtn.addEventListener('click', () => handlePaginationClick(-1));
  }
  
  if (elements.nextPageBtn) {
    elements.nextPageBtn.addEventListener('click', () => handlePaginationClick(1));
  }
}

/**
 * Handle search form submission
 * @param {Event} event - Submit event
 */
function handleSearchSubmit(event) {
  event.preventDefault();
  
  state.query = elements.searchInput.value.trim();
  state.page = 1; // Reset to first page
  
  if (state.query) {
    // Update URL with search query without reloading the page
    const url = new URL(window.location);
    url.searchParams.set('q', state.query);
    window.history.pushState({}, '', url);
    
    performSearch();
  }
}

/**
 * Handle clearing the search
 */
function handleClearSearch() {
  elements.searchInput.value = '';
  state.query = '';
  state.page = 1;
  
  // Update URL without the search query
  const url = new URL(window.location);
  url.searchParams.delete('q');
  window.history.pushState({}, '', url);
  
  // Clear results
  if (elements.searchResults) {
    elements.searchResults.innerHTML = '';
  }
  
  // Hide pagination
  if (elements.paginationContainer) {
    elements.paginationContainer.classList.add('hidden');
  }
  
  // Update results count
  if (elements.resultsCount) {
    elements.resultsCount.textContent = 'No search performed';
  }
}

/**
 * Handle sort change
 * @param {Event} event - Change event
 */
function handleSortChange(event) {
  state.filters.sort = event.target.value;
  state.page = 1; // Reset to first page
  performSearch();
}

/**
 * Handle date range change
 */
function handleDateRangeChange() {
  state.filters.dateStart = elements.dateStartInput.value;
  state.filters.dateEnd = elements.dateEndInput.value;
  state.page = 1; // Reset to first page
  performSearch();
}

/**
 * Handle filter toggle
 * @param {Event} event - Change event
 */
function handleFilterToggle(event) {
  const filterType = event.target.dataset.filterType;
  const filterValue = event.target.value;
  
  if (filterType === 'type') {
    if (event.target.checked) {
      // Add to included types
      if (!state.filters.includedTypes.includes(filterValue)) {
        state.filters.includedTypes.push(filterValue);
      }
    } else {
      // Remove from included types
      state.filters.includedTypes = state.filters.includedTypes.filter(type => type !== filterValue);
    }
  } else if (filterType === 'tag') {
    if (event.target.checked) {
      // Add to included tags
      if (!state.filters.tags.includes(filterValue)) {
        state.filters.tags.push(filterValue);
      }
    } else {
      // Remove from included tags
      state.filters.tags = state.filters.tags.filter(tag => tag !== filterValue);
    }
  }
  
  state.page = 1; // Reset to first page
  performSearch();
}

/**
 * Handle pagination click
 * @param {number} direction - Direction to paginate (1 for next, -1 for previous)
 */
function handlePaginationClick(direction) {
  const newPage = state.page + direction;
  
  if (newPage >= 1 && newPage <= state.totalPages) {
    state.page = newPage;
    performSearch();
    
    // Scroll to top of results
    elements.searchResults.scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * Perform search with current state
 */
async function performSearch() {
  if (!state.query) return;
  
  try {
    // Show loading state
    if (elements.searchResults) {
      elements.searchResults.innerHTML = '<div class="loading">Searching...</div>';
    }
    
    // Construct search parameters
    const searchParams = {
      q: state.query,
      page: state.page,
      pageSize: state.pageSize,
      sort: state.filters.sort,
      ...state.filters
    };
    
    // Call search API
    const results = await window.API.request('/search', {
      method: 'POST',
      body: JSON.stringify(searchParams)
    });
    
    // Update state with results
    state.totalResults = results.totalResults;
    state.totalPages = results.totalPages;
    
    // Display results
    displayResults(results);
  } catch (error) {
    console.error('Search error:', error);
    
    // Show error message
    if (elements.searchResults) {
      elements.searchResults.innerHTML = `
        <div class="error-message">
          <p>An error occurred during search: ${error.message}</p>
          <p>Please try again later.</p>
        </div>
      `;
    }
  }
}

/**
 * Display search results
 * @param {Object} results - Search results
 */
function displayResults(results) {
  if (!elements.searchResults) return;
  
  // Clear previous results
  elements.searchResults.innerHTML = '';
  
  if (results.items.length === 0) {
    // No results
    elements.searchResults.innerHTML = `
      <div class="no-results">
        <p>No documents found matching "${state.query}"</p>
        <p>Try different search terms or filters.</p>
      </div>
    `;
    
    // Update results count
    if (elements.resultsCount) {
      elements.resultsCount.textContent = 'No results found';
    }
    
    // Hide pagination
    if (elements.paginationContainer) {
      elements.paginationContainer.classList.add('hidden');
    }
    
    return;
  }
  
  // Create results list
  const resultsList = document.createElement('ul');
  resultsList.className = 'results-list';
  
  // Add result items
  results.items.forEach(item => {
    const resultItem = createResultItem(item);
    resultsList.appendChild(resultItem);
  });
  
  // Add to DOM
  elements.searchResults.appendChild(resultsList);
  
  // Update results count
  if (elements.resultsCount) {
    elements.resultsCount.textContent = `${results.totalResults} results found`;
  }
  
  // Update pagination
  updatePagination();
}

/**
 * Create a result item
 * @param {Object} item - Result item data
 * @returns {HTMLElement} Result item element
 */
function createResultItem(item) {
  const resultItem = document.createElement('li');
  resultItem.className = 'result-item';
  
  // Format date
  const date = new Date(item.createdAt);
  const formattedDate = date.toLocaleDateString();
  
  // Create result item content
  resultItem.innerHTML = `
    <div class="result-header">
      <h3 class="result-title">
        <a href="/documents/${item.id}">${item.title}</a>
      </h3>
      <span class="result-type">${item.fileType.toUpperCase()}</span>
    </div>
    <div class="result-meta">
      <span class="result-date">Added on ${formattedDate}</span>
      <span class="result-pages">${item.pageCount} pages</span>
    </div>
    <p class="result-excerpt">${item.excerpt}</p>
    <div class="result-tags">
      ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
    </div>
    <div class="result-actions">
      <a href="/documents/${item.id}" class="btn btn-primary btn-sm">View</a>
      <a href="/documents/${item.id}/summary" class="btn btn-secondary btn-sm">Summary</a>
    </div>
  `;
  
  return resultItem;
}

/**
 * Update pagination controls
 */
function updatePagination() {
  if (!elements.paginationContainer) return;
  
  if (state.totalPages <= 1) {
    // Hide pagination if only one page
    elements.paginationContainer.classList.add('hidden');
    return;
  }
  
  // Show pagination
  elements.paginationContainer.classList.remove('hidden');
  
  // Update page info
  if (elements.pageInfo) {
    elements.pageInfo.textContent = `Page ${state.page} of ${state.totalPages}`;
  }
  
  // Update previous button
  if (elements.prevPageBtn) {
    elements.prevPageBtn.disabled = state.page <= 1;
  }
  
  // Update next button
  if (elements.nextPageBtn) {
    elements.nextPageBtn.disabled = state.page >= state.totalPages;
  }
}

// Make API functions publicly accessible
window.Search.performSearch = performSearch; 