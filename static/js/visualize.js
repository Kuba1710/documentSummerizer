/**
 * Visualization module for SciSummarize
 * Handles document insights and data visualization
 */

import { apiRequest } from './api.js';

// DOM elements cache
const elements = {};

// Chart instances
const charts = {};

// Color schemes for visualizations
const colorSchemes = {
  primary: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'],
  pastel: ['#c6dbef', '#fdd0a2', '#c7e9c0', '#fcbba1', '#dadaeb', '#e6badb'],
  sequential: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b']
};

/**
 * Initialize visualization module
 * @param {Object} options - Configuration options
 */
export function init(options = {}) {
  console.log('Initializing visualization module...');
  
  // Cache DOM elements
  cacheElements();
  
  // Set up event listeners
  setupEventListeners();
  
  // Check if we should load visualizations for a document
  checkForInitialDocument();
}

/**
 * Cache DOM elements for better performance
 */
function cacheElements() {
  // Visualization container
  elements.container = document.getElementById('visualization-container');
  
  // Tabs and content areas
  elements.tabs = document.querySelectorAll('[data-viz-tab]');
  elements.tabContents = document.querySelectorAll('[data-viz-content]');
  
  // Charts containers
  elements.keywordsChart = document.getElementById('keywords-chart');
  elements.citationsChart = document.getElementById('citations-chart');
  elements.trendsChart = document.getElementById('trends-chart');
  elements.topicsChart = document.getElementById('topics-chart');
  
  // Document info
  elements.docTitle = document.getElementById('viz-doc-title');
  elements.docAuthors = document.getElementById('viz-doc-authors');
  elements.docYear = document.getElementById('viz-doc-year');
  
  // Controls
  elements.toggleBtn = document.getElementById('toggle-visualizations');
  elements.downloadBtn = document.getElementById('download-visualization');
  elements.shareBtn = document.getElementById('share-visualization');
  
  // Loader and messages
  elements.loader = document.getElementById('viz-loader');
  elements.errorMsg = document.getElementById('viz-error');
}

/**
 * Set up event listeners for visualization functionality
 */
function setupEventListeners() {
  // Tab switching
  if (elements.tabs) {
    elements.tabs.forEach(tab => {
      tab.addEventListener('click', handleTabClick);
    });
  }
  
  // Toggle visualizations
  if (elements.toggleBtn) {
    elements.toggleBtn.addEventListener('click', toggleVisualizations);
  }
  
  // Download visualization
  if (elements.downloadBtn) {
    elements.downloadBtn.addEventListener('click', downloadVisualization);
  }
  
  // Share visualization
  if (elements.shareBtn) {
    elements.shareBtn.addEventListener('click', shareVisualization);
  }
  
  // Window resize handler for responsive charts
  window.addEventListener('resize', debounce(resizeCharts, 250));
}

/**
 * Check if there's a document ID in the URL to load visualizations
 */
function checkForInitialDocument() {
  // Try to get document ID from URL
  const urlMatch = window.location.pathname.match(/\/documents\/([^\/]+)/);
  if (urlMatch && urlMatch[1]) {
    const documentId = urlMatch[1];
    loadDocumentVisualizations(documentId);
  }
}

/**
 * Handle tab click event
 * @param {Event} event - Click event
 */
function handleTabClick(event) {
  const tabId = event.currentTarget.getAttribute('data-viz-tab');
  
  // Update active tab
  elements.tabs.forEach(tab => {
    if (tab.getAttribute('data-viz-tab') === tabId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
  
  // Show appropriate content
  elements.tabContents.forEach(content => {
    if (content.getAttribute('data-viz-content') === tabId) {
      content.classList.remove('hidden');
    } else {
      content.classList.add('hidden');
    }
  });
  
  // Trigger resize for the newly visible chart
  resizeCharts();
}

/**
 * Load visualizations for a specific document
 * @param {string} documentId - ID of the document
 * @returns {Promise<boolean>} - Success status
 */
export async function loadDocumentVisualizations(documentId) {
  if (!documentId) {
    console.error('No document ID provided for visualizations');
    return false;
  }
  
  // Show loading state
  showLoader(true);
  
  try {
    // Fetch document insights data
    const insightsData = await fetchDocumentInsights(documentId);
    
    // Update document info
    updateDocumentInfo(insightsData.document);
    
    // Render visualizations
    renderVisualizations(insightsData);
    
    // Show visualization container
    if (elements.container) {
      elements.container.classList.remove('hidden');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to load document visualizations:', error);
    showError('Could not load document insights. Please try again later.');
    return false;
  } finally {
    showLoader(false);
  }
}

/**
 * Fetch document insights data from API
 * @param {string} documentId - ID of the document
 * @returns {Promise<Object>} - Document insights data
 */
async function fetchDocumentInsights(documentId) {
  return apiRequest(`/documents/${documentId}/insights`, {
    method: 'GET'
  });
}

/**
 * Update document info display
 * @param {Object} documentData - Document metadata
 */
function updateDocumentInfo(documentData) {
  if (!documentData) return;
  
  if (elements.docTitle && documentData.title) {
    elements.docTitle.textContent = documentData.title;
  }
  
  if (elements.docAuthors && documentData.authors) {
    elements.docAuthors.textContent = Array.isArray(documentData.authors) 
      ? documentData.authors.join(', ') 
      : documentData.authors;
  }
  
  if (elements.docYear && documentData.year) {
    elements.docYear.textContent = documentData.year;
  }
}

/**
 * Render all visualizations
 * @param {Object} data - Document insights data
 */
function renderVisualizations(data) {
  // Destroy existing charts
  Object.values(charts).forEach(chart => {
    if (chart && typeof chart.destroy === 'function') {
      chart.destroy();
    }
  });
  
  // Clear charts object
  Object.keys(charts).forEach(key => delete charts[key]);
  
  // Render each chart if data is available
  if (data.keywords && elements.keywordsChart) {
    renderKeywordsChart(data.keywords);
  }
  
  if (data.citations && elements.citationsChart) {
    renderCitationsChart(data.citations);
  }
  
  if (data.trends && elements.trendsChart) {
    renderTrendsChart(data.trends);
  }
  
  if (data.topics && elements.topicsChart) {
    renderTopicsChart(data.topics);
  }
  
  // Make first tab active by default
  if (elements.tabs && elements.tabs.length > 0) {
    elements.tabs[0].click();
  }
}

/**
 * Render keywords chart
 * @param {Array} keywords - Keywords data
 */
function renderKeywordsChart(keywords) {
  if (!elements.keywordsChart || !window.Chart) return;

  // Sort keywords by frequency
  const sortedKeywords = [...keywords].sort((a, b) => b.frequency - a.frequency).slice(0, 10);
  
  // Prepare data for chart
  const labels = sortedKeywords.map(k => k.term);
  const data = sortedKeywords.map(k => k.frequency);
  
  // Create chart
  charts.keywords = new window.Chart(elements.keywordsChart.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Keyword Frequency',
        data,
        backgroundColor: colorSchemes.primary,
        borderColor: colorSchemes.primary.map(color => adjustColorBrightness(color, -0.2)),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Frequency: ${context.raw}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Frequency'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Keywords'
          }
        }
      }
    }
  });
}

/**
 * Render citations chart
 * @param {Array} citations - Citations data
 */
function renderCitationsChart(citations) {
  if (!elements.citationsChart || !window.Chart) return;
  
  // Group citations by year
  const citationsByYear = {};
  
  citations.forEach(citation => {
    const year = citation.year || 'Unknown';
    if (!citationsByYear[year]) {
      citationsByYear[year] = 0;
    }
    citationsByYear[year]++;
  });
  
  // Sort by year
  const sortedYears = Object.keys(citationsByYear)
    .filter(year => year !== 'Unknown')
    .sort((a, b) => parseInt(a) - parseInt(b));
  
  // Add unknown at the end if it exists
  if (citationsByYear['Unknown']) {
    sortedYears.push('Unknown');
  }
  
  // Prepare data for chart
  const labels = sortedYears;
  const data = sortedYears.map(year => citationsByYear[year]);
  
  // Create chart
  charts.citations = new window.Chart(elements.citationsChart.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Citations per Year',
        data,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        tension: 0.1,
        fill: true,
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Citations: ${context.raw}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Citations'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Year'
          }
        }
      }
    }
  });
}

/**
 * Render trends chart
 * @param {Array} trends - Trends data
 */
function renderTrendsChart(trends) {
  if (!elements.trendsChart || !window.Chart) return;
  
  // Prepare datasets
  const datasets = trends.map((trend, index) => {
    const color = colorSchemes.primary[index % colorSchemes.primary.length];
    
    return {
      label: trend.name,
      data: trend.data.map(point => point.value),
      borderColor: color,
      backgroundColor: adjustColorOpacity(color, 0.1),
      borderWidth: 2,
      tension: 0.4,
      fill: false
    };
  });
  
  // Use the timestamps from the first trend (assuming all trends have same timestamps)
  const labels = trends.length > 0 ? trends[0].data.map(point => {
    // Format date as needed
    const date = new Date(point.timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }) : [];
  
  // Create chart
  charts.trends = new window.Chart(elements.trendsChart.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        y: {
          title: {
            display: true,
            text: 'Relevance'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Time Period'
          }
        }
      }
    }
  });
}

/**
 * Render topics chart
 * @param {Array} topics - Topics data
 */
function renderTopicsChart(topics) {
  if (!elements.topicsChart || !window.Chart) return;
  
  // Prepare data for pie chart
  const labels = topics.map(topic => topic.name);
  const data = topics.map(topic => topic.weight);
  
  // Create chart
  charts.topics = new window.Chart(elements.topicsChart.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colorSchemes.primary,
        borderColor: '#ffffff',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${context.label}: ${percentage}%`;
            }
          }
        }
      }
    }
  });
}

/**
 * Toggle visualizations panel
 * @param {Event} event - Click event
 */
function toggleVisualizations(event) {
  if (!elements.container) return;
  
  elements.container.classList.toggle('collapsed');
  
  if (elements.toggleBtn) {
    const isCollapsed = elements.container.classList.contains('collapsed');
    elements.toggleBtn.innerHTML = isCollapsed 
      ? '<i class="fas fa-expand"></i> Expand' 
      : '<i class="fas fa-compress"></i> Collapse';
  }
  
  // Resize charts after toggling
  setTimeout(resizeCharts, 300);
}

/**
 * Resize all charts
 */
function resizeCharts() {
  Object.values(charts).forEach(chart => {
    if (chart && typeof chart.resize === 'function') {
      chart.resize();
    }
  });
}

/**
 * Download current visualization as image
 * @param {Event} event - Click event
 */
function downloadVisualization(event) {
  // Find active tab
  const activeTabId = Array.from(elements.tabs).find(tab => 
    tab.classList.contains('active')
  )?.getAttribute('data-viz-tab');
  
  if (!activeTabId || !charts[activeTabId]) {
    showError('No visualization to download');
    return;
  }
  
  try {
    // Get chart canvas
    const chart = charts[activeTabId];
    const canvas = chart.canvas;
    
    // Create a temporary link
    const link = document.createElement('a');
    link.download = `scisummarize-${activeTabId}-chart.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error('Failed to download visualization:', error);
    showError('Failed to download. Please try again.');
  }
}

/**
 * Share visualization
 * @param {Event} event - Click event
 */
function shareVisualization(event) {
  // Get current URL
  const url = window.location.href;
  
  // Check if Navigator Share API is available
  if (navigator.share) {
    navigator.share({
      title: 'SciSummarize Document Insights',
      text: 'Check out these document insights from SciSummarize',
      url: url
    })
      .then(() => console.log('Shared successfully'))
      .catch(error => {
        console.error('Error sharing:', error);
        fallbackShare(url);
      });
  } else {
    fallbackShare(url);
  }
}

/**
 * Fallback share method (copy to clipboard)
 * @param {string} url - URL to share
 */
function fallbackShare(url) {
  try {
    // Copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
      // Show success message
      const originalText = elements.shareBtn.textContent;
      elements.shareBtn.textContent = 'Copied to clipboard!';
      
      setTimeout(() => {
        elements.shareBtn.textContent = originalText;
      }, 2000);
    });
  } catch (error) {
    console.error('Failed to copy URL:', error);
    showError('Failed to copy URL to clipboard');
  }
}

/**
 * Show/hide loader
 * @param {boolean} show - Whether to show or hide the loader
 */
function showLoader(show) {
  if (!elements.loader) return;
  
  if (show) {
    elements.loader.classList.remove('hidden');
  } else {
    elements.loader.classList.add('hidden');
  }
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
  if (!elements.errorMsg) return;
  
  elements.errorMsg.textContent = message;
  elements.errorMsg.classList.remove('hidden');
  
  // Auto-hide after timeout
  setTimeout(() => {
    if (elements.errorMsg) {
      elements.errorMsg.classList.add('hidden');
    }
  }, 5000);
}

/**
 * Utility function to adjust color brightness
 * @param {string} color - Hex color string
 * @param {number} amount - Amount to adjust (-1 to 1)
 * @returns {string} - Adjusted color
 */
function adjustColorBrightness(color, amount) {
  let usePound = false;

  if (color[0] === "#") {
    color = color.slice(1);
    usePound = true;
  }

  const num = parseInt(color, 16);
  let r = (num >> 16) + amount * 255;
  let g = ((num >> 8) & 0x00FF) + amount * 255;
  let b = (num & 0x0000FF) + amount * 255;

  r = Math.min(255, Math.max(0, Math.round(r)));
  g = Math.min(255, Math.max(0, Math.round(g)));
  b = Math.min(255, Math.max(0, Math.round(b)));

  return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
}

/**
 * Utility function to adjust color opacity
 * @param {string} color - Color string (hex or rgb)
 * @param {number} opacity - Opacity value (0 to 1)
 * @returns {string} - Color with opacity
 */
function adjustColorOpacity(color, opacity) {
  // Handle hex colors
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  // Handle rgb colors
  if (color.startsWith('rgb(')) {
    return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
  }
  
  // Handle rgba colors
  if (color.startsWith('rgba(')) {
    return color.replace(/[\d\.]+\)$/, `${opacity})`);
  }
  
  return color;
}

/**
 * Utility function to debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
} 