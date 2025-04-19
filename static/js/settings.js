/**
 * Settings module for SciSummarize
 * Handles user preferences and application configuration
 */

// Create global Settings object
window.Settings = {};

// Settings cache
let settings = null;
let isLoading = false;

// Default settings
const defaultSettings = {
  theme: 'light',
  fontSize: 'medium',
  summarizationPreferences: {
    length: 'medium',
    style: 'academic',
    includeKeyPoints: true,
    includeCitations: true
  },
  notificationPreferences: {
    email: true,
    browser: true,
    completionAlerts: true
  },
  displayPreferences: {
    showSidebar: true,
    compactView: false,
    showMetadata: true,
    showVisualizations: true
  },
  shortcuts: {
    enabled: true,
    custom: {}
  }
};

// DOM elements cache
const elements = {};

/**
 * Initialize settings module
 * @param {Object} options - Configuration options
 */
window.Settings.init = async function(options = {}) {
  console.log('Initializing settings module...');
  
  // Cache DOM elements
  cacheElements();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load user settings
  await loadSettings();
  
  // Apply initial settings
  applySettings(settings);
  
  // Update settings form with current values
  updateSettingsForm();
  
  return Promise.resolve();
};

/**
 * Cache DOM elements for better performance
 */
function cacheElements() {
  // Settings form and container
  elements.settingsForm = document.getElementById('settings-form');
  elements.settingsContainer = document.getElementById('settings-container');
  elements.settingsToggle = document.getElementById('settings-toggle');
  
  // Theme settings
  elements.themeSelect = document.getElementById('theme-select');
  elements.fontSizeSelect = document.getElementById('font-size-select');
  
  // Summarization preferences
  elements.summaryLengthSelect = document.getElementById('summary-length');
  elements.summaryStyleSelect = document.getElementById('summary-style');
  elements.includeKeyPointsCheck = document.getElementById('include-key-points');
  elements.includeCitationsCheck = document.getElementById('include-citations');
  
  // Notification preferences
  elements.emailNotificationsCheck = document.getElementById('email-notifications');
  elements.browserNotificationsCheck = document.getElementById('browser-notifications');
  elements.completionAlertsCheck = document.getElementById('completion-alerts');
  
  // Display preferences
  elements.showSidebarCheck = document.getElementById('show-sidebar');
  elements.compactViewCheck = document.getElementById('compact-view');
  elements.showMetadataCheck = document.getElementById('show-metadata');
  elements.showVisualizationsCheck = document.getElementById('show-visualizations');
  
  // Shortcuts
  elements.shortcutsEnabledCheck = document.getElementById('shortcuts-enabled');
  elements.shortcutsContainer = document.getElementById('shortcuts-container');
  
  // Buttons
  elements.saveSettingsBtn = document.getElementById('save-settings');
  elements.resetSettingsBtn = document.getElementById('reset-settings');
  
  // Messages
  elements.settingsMessage = document.getElementById('settings-message');
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Toggle settings panel
  if (elements.settingsToggle) {
    elements.settingsToggle.addEventListener('click', toggleSettingsPanel);
  }
  
  // Settings form submission
  if (elements.settingsForm) {
    elements.settingsForm.addEventListener('submit', handleSettingsSubmit);
  }
  
  // Reset settings button
  if (elements.resetSettingsBtn) {
    elements.resetSettingsBtn.addEventListener('click', handleSettingsReset);
  }
  
  // Theme change
  if (elements.themeSelect) {
    elements.themeSelect.addEventListener('change', event => {
      previewSetting('theme', event.target.value);
    });
  }
  
  // Font size change
  if (elements.fontSizeSelect) {
    elements.fontSizeSelect.addEventListener('change', event => {
      previewSetting('fontSize', event.target.value);
    });
  }
  
  // Shortcuts toggle
  if (elements.shortcutsEnabledCheck && elements.shortcutsContainer) {
    elements.shortcutsEnabledCheck.addEventListener('change', event => {
      elements.shortcutsContainer.classList.toggle('disabled', !event.target.checked);
    });
  }
  
  // Display preferences immediate toggles
  if (elements.showSidebarCheck) {
    elements.showSidebarCheck.addEventListener('change', event => {
      previewSetting('displayPreferences.showSidebar', event.target.checked);
    });
  }
  
  if (elements.compactViewCheck) {
    elements.compactViewCheck.addEventListener('change', event => {
      previewSetting('displayPreferences.compactView', event.target.checked);
    });
  }
}

/**
 * Load user settings from API or localStorage
 * @returns {Promise<Object>} User settings
 */
async function loadSettings() {
  // Prevent multiple simultaneous loads
  if (isLoading) {
    return settings;
  }
  
  isLoading = true;
  
  try {
    // Try to get settings from API first
    try {
      const userSettings = await window.API.request('/users/settings', {
        method: 'GET'
      });
      
      settings = mergeWithDefaults(userSettings);
      saveSettingsToLocalStorage(settings);
      
      return settings;
    } catch (error) {
      console.warn('Failed to load settings from API, falling back to localStorage', error);
      
      // Fall back to localStorage
      const storedSettings = getSettingsFromLocalStorage();
      if (storedSettings) {
        settings = storedSettings;
        return settings;
      }
      
      // Use defaults if nothing is found
      settings = { ...defaultSettings };
      return settings;
    }
  } finally {
    isLoading = false;
  }
}

/**
 * Save settings to API and localStorage
 * @param {Object} newSettings - Settings to save
 * @returns {Promise<boolean>} Success status
 */
async function saveSettings(newSettings = {}) {
  // Merge with existing settings
  const updatedSettings = {
    ...settings,
    ...newSettings
  };
  
  try {
    // Save to API
    await window.API.request('/users/settings', {
      method: 'PUT',
      body: JSON.stringify(updatedSettings)
    });
    
    // Update local cache
    settings = updatedSettings;
    
    // Save to localStorage as backup
    saveSettingsToLocalStorage(settings);
    
    // Apply the new settings
    applySettings(settings);
    
    return true;
  } catch (error) {
    console.error('Failed to save settings to API', error);
    
    // Still save to localStorage as fallback
    saveSettingsToLocalStorage(updatedSettings);
    
    // Update local cache anyway
    settings = updatedSettings;
    
    // Apply the new settings despite API failure
    applySettings(settings);
    
    return false;
  }
}

/**
 * Reset settings to defaults
 * @returns {Promise<boolean>} Success status
 */
async function resetSettings() {
  return saveSettings(defaultSettings);
}

/**
 * Apply settings to the UI
 * @param {Object} settingsToApply - Settings to apply
 */
function applySettings(settingsToApply) {
  if (!settingsToApply) return;
  
  // Apply theme
  applyTheme(settingsToApply.theme);
  
  // Apply font size
  applyFontSize(settingsToApply.fontSize);
  
  // Apply display preferences
  applyDisplayPreferences(settingsToApply.displayPreferences);
  
  // Apply keyboard shortcuts
  applyShortcuts(settingsToApply.shortcuts);
  
  // Dispatch event for other modules
  window.dispatchEvent(new CustomEvent('settingsChanged', {
    detail: { settings: settingsToApply }
  }));
}

/**
 * Apply theme setting
 * @param {string} theme - Theme name
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  
  // Remove any existing theme classes
  document.body.classList.remove('theme-light', 'theme-dark', 'theme-sepia');
  
  // Add the new theme class
  document.body.classList.add(`theme-${theme}`);
}

/**
 * Apply font size setting
 * @param {string} fontSize - Font size name
 */
function applyFontSize(fontSize) {
  // Remove any existing font size classes
  document.body.classList.remove('font-small', 'font-medium', 'font-large');
  
  // Add the new font size class
  document.body.classList.add(`font-${fontSize}`);
}

/**
 * Apply display preferences
 * @param {Object} displayPrefs - Display preferences
 */
function applyDisplayPreferences(displayPrefs) {
  if (!displayPrefs) return;
  
  // Apply sidebar visibility
  const sidebarElement = document.getElementById('sidebar');
  if (sidebarElement) {
    sidebarElement.classList.toggle('hidden', !displayPrefs.showSidebar);
  }
  
  // Apply compact view
  document.body.classList.toggle('compact-view', displayPrefs.compactView);
  
  // Apply metadata visibility
  const metadataElements = document.querySelectorAll('.document-metadata');
  metadataElements.forEach(el => {
    el.classList.toggle('hidden', !displayPrefs.showMetadata);
  });
  
  // Apply visualizations visibility
  const vizElements = document.querySelectorAll('.visualization-container');
  vizElements.forEach(el => {
    el.classList.toggle('hidden', !displayPrefs.showVisualizations);
  });
}

/**
 * Apply keyboard shortcuts
 * @param {Object} shortcuts - Shortcuts configuration
 */
function applyShortcuts(shortcuts) {
  // Remove existing keyboard shortcut handlers
  document.removeEventListener('keydown', handleKeyboardShortcut);
  
  // If shortcuts are disabled, don't add new handlers
  if (!shortcuts || !shortcuts.enabled) {
    return;
  }
  
  // Add new keyboard shortcut handler
  document.addEventListener('keydown', handleKeyboardShortcut);
}

/**
 * Handle keyboard shortcuts
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleKeyboardShortcut(event) {
  // Skip if user is typing in an input
  if (event.target.tagName === 'INPUT' || 
      event.target.tagName === 'TEXTAREA' || 
      event.target.isContentEditable) {
    return;
  }
  
  // Get current shortcuts
  const { custom } = settings.shortcuts;
  
  // Handle default shortcuts
  switch (event.key) {
    case 's':
      if (event.ctrlKey || event.metaKey) {
        // Ctrl/Cmd + S: Save document
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('saveDocument'));
      }
      break;
      
    case '/':
      if (event.ctrlKey || event.metaKey) {
        // Ctrl/Cmd + /: Toggle settings
        event.preventDefault();
        toggleSettingsPanel();
      }
      break;
      
    case 'Escape':
      // Escape: Close modal or panel
      const openModal = document.querySelector('.modal:not(.hidden)');
      if (openModal) {
        event.preventDefault();
        openModal.classList.add('hidden');
      } else if (elements.settingsContainer && 
                !elements.settingsContainer.classList.contains('hidden')) {
        event.preventDefault();
        toggleSettingsPanel();
      }
      break;
  }
  
  // Handle custom shortcuts
  Object.entries(custom).forEach(([action, keys]) => {
    const keyCombo = keys.split('+');
    const modifier = keyCombo.length > 1 ? keyCombo[0].trim().toLowerCase() : null;
    const key = keyCombo.length > 1 ? keyCombo[1].trim().toLowerCase() : keyCombo[0].trim().toLowerCase();
    
    if (event.key.toLowerCase() === key) {
      if (!modifier || 
          (modifier === 'ctrl' && event.ctrlKey) ||
          (modifier === 'alt' && event.altKey) ||
          (modifier === 'shift' && event.shiftKey) ||
          (modifier === 'meta' && event.metaKey)) {
        
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('customAction', { detail: { action } }));
      }
    }
  });
}

/**
 * Toggle settings panel visibility
 */
function toggleSettingsPanel() {
  if (!elements.settingsContainer) return;
  
  const isHidden = elements.settingsContainer.classList.contains('hidden');
  
  if (isHidden) {
    // Update form before showing
    updateSettingsForm();
    elements.settingsContainer.classList.remove('hidden');
  } else {
    elements.settingsContainer.classList.add('hidden');
  }
}

/**
 * Update settings form with current values
 */
function updateSettingsForm() {
  if (!settings) return;
  
  // Theme
  if (elements.themeSelect) {
    elements.themeSelect.value = settings.theme;
  }
  
  // Font size
  if (elements.fontSizeSelect) {
    elements.fontSizeSelect.value = settings.fontSize;
  }
  
  // Summarization preferences
  if (elements.summaryLengthSelect) {
    elements.summaryLengthSelect.value = settings.summarizationPreferences.length;
  }
  
  if (elements.summaryStyleSelect) {
    elements.summaryStyleSelect.value = settings.summarizationPreferences.style;
  }
  
  if (elements.includeKeyPointsCheck) {
    elements.includeKeyPointsCheck.checked = settings.summarizationPreferences.includeKeyPoints;
  }
  
  if (elements.includeCitationsCheck) {
    elements.includeCitationsCheck.checked = settings.summarizationPreferences.includeCitations;
  }
  
  // Notification preferences
  if (elements.emailNotificationsCheck) {
    elements.emailNotificationsCheck.checked = settings.notificationPreferences.email;
  }
  
  if (elements.browserNotificationsCheck) {
    elements.browserNotificationsCheck.checked = settings.notificationPreferences.browser;
  }
  
  if (elements.completionAlertsCheck) {
    elements.completionAlertsCheck.checked = settings.notificationPreferences.completionAlerts;
  }
  
  // Display preferences
  if (elements.showSidebarCheck) {
    elements.showSidebarCheck.checked = settings.displayPreferences.showSidebar;
  }
  
  if (elements.compactViewCheck) {
    elements.compactViewCheck.checked = settings.displayPreferences.compactView;
  }
  
  if (elements.showMetadataCheck) {
    elements.showMetadataCheck.checked = settings.displayPreferences.showMetadata;
  }
  
  if (elements.showVisualizationsCheck) {
    elements.showVisualizationsCheck.checked = settings.displayPreferences.showVisualizations;
  }
  
  // Shortcuts
  if (elements.shortcutsEnabledCheck) {
    elements.shortcutsEnabledCheck.checked = settings.shortcuts.enabled;
  }
  
  if (elements.shortcutsContainer) {
    elements.shortcutsContainer.classList.toggle('disabled', !settings.shortcuts.enabled);
    
    // Update custom shortcuts
    // Implementation depends on how custom shortcuts are displayed in the UI
  }
}

/**
 * Handle settings form submission
 * @param {Event} event - Form submit event
 */
async function handleSettingsSubmit(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const newSettings = {
    theme: formData.get('theme'),
    fontSize: formData.get('font-size'),
    summarizationPreferences: {
      length: formData.get('summary-length'),
      style: formData.get('summary-style'),
      includeKeyPoints: formData.has('include-key-points'),
      includeCitations: formData.has('include-citations')
    },
    notificationPreferences: {
      email: formData.has('email-notifications'),
      browser: formData.has('browser-notifications'),
      completionAlerts: formData.has('completion-alerts')
    },
    displayPreferences: {
      showSidebar: formData.has('show-sidebar'),
      compactView: formData.has('compact-view'),
      showMetadata: formData.has('show-metadata'),
      showVisualizations: formData.has('show-visualizations')
    },
    shortcuts: {
      enabled: formData.has('shortcuts-enabled'),
      custom: settings.shortcuts.custom // Keep existing custom shortcuts
    }
  };
  
  // Show saving indicator
  showSettingsMessage('Saving settings...', 'info');
  
  // Save settings
  const success = await saveSettings(newSettings);
  
  // Show result message
  if (success) {
    showSettingsMessage('Settings saved successfully!', 'success');
  } else {
    showSettingsMessage('Settings saved locally. Couldn\'t sync with server.', 'warning');
  }
}

/**
 * Handle settings reset
 * @param {Event} event - Click event
 */
async function handleSettingsReset(event) {
  event.preventDefault();
  
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    // Show saving indicator
    showSettingsMessage('Resetting settings...', 'info');
    
    // Reset settings
    const success = await resetSettings();
    
    // Update form with new values
    updateSettingsForm();
    
    // Show result message
    if (success) {
      showSettingsMessage('Settings reset successfully!', 'success');
    } else {
      showSettingsMessage('Settings reset locally. Couldn\'t sync with server.', 'warning');
    }
  }
}

/**
 * Preview a setting without saving
 * @param {string} path - Setting path (dot notation)
 * @param {any} value - Setting value
 */
function previewSetting(path, value) {
  // Create a temporary settings object for preview
  const previewSettings = { ...settings };
  
  // Set the value at the specified path
  setNestedProperty(previewSettings, path, value);
  
  // Apply only the specific setting
  if (path === 'theme' || path.startsWith('theme.')) {
    applyTheme(previewSettings.theme);
  } else if (path === 'fontSize') {
    applyFontSize(previewSettings.fontSize);
  } else if (path.startsWith('displayPreferences.')) {
    applyDisplayPreferences(previewSettings.displayPreferences);
  }
}

/**
 * Show settings message
 * @param {string} message - Message to show
 * @param {string} type - Message type (success, error, warning, info)
 */
function showSettingsMessage(message, type = 'info') {
  if (!elements.settingsMessage) return;
  
  // Set message
  elements.settingsMessage.textContent = message;
  
  // Set appropriate class
  elements.settingsMessage.className = `settings-message ${type}`;
  
  // Show message
  elements.settingsMessage.classList.remove('hidden');
  
  // Auto-hide after timeout (except for errors)
  if (type !== 'error') {
    setTimeout(() => {
      if (elements.settingsMessage) {
        elements.settingsMessage.classList.add('hidden');
      }
    }, 3000);
  }
}

/**
 * Get settings from localStorage
 * @returns {Object|null} Settings object or null
 */
function getSettingsFromLocalStorage() {
  try {
    const storedSettings = localStorage.getItem('scisummarize_settings');
    if (storedSettings) {
      return JSON.parse(storedSettings);
    }
    return null;
  } catch (error) {
    console.error('Error reading settings from localStorage', error);
    return null;
  }
}

/**
 * Save settings to localStorage
 * @param {Object} settingsToSave - Settings to save
 */
function saveSettingsToLocalStorage(settingsToSave) {
  try {
    localStorage.setItem('scisummarize_settings', JSON.stringify(settingsToSave));
  } catch (error) {
    console.error('Error saving settings to localStorage', error);
  }
}

/**
 * Merge user settings with defaults
 * @param {Object} userSettings - User settings
 * @returns {Object} Merged settings
 */
function mergeWithDefaults(userSettings) {
  return {
    theme: userSettings.theme || defaultSettings.theme,
    fontSize: userSettings.fontSize || defaultSettings.fontSize,
    summarizationPreferences: {
      ...defaultSettings.summarizationPreferences,
      ...userSettings.summarizationPreferences
    },
    notificationPreferences: {
      ...defaultSettings.notificationPreferences,
      ...userSettings.notificationPreferences
    },
    displayPreferences: {
      ...defaultSettings.displayPreferences,
      ...userSettings.displayPreferences
    },
    shortcuts: {
      enabled: userSettings.shortcuts?.enabled ?? defaultSettings.shortcuts.enabled,
      custom: {
        ...defaultSettings.shortcuts.custom,
        ...userSettings.shortcuts?.custom
      }
    }
  };
}

/**
 * Set a nested property using dot notation
 * @param {Object} obj - Object to modify
 * @param {string} path - Property path in dot notation
 * @param {any} value - Value to set
 */
function setNestedProperty(obj, path, value) {
  const parts = path.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part]) {
      current[part] = {};
    }
    current = current[part];
  }
  
  current[parts[parts.length - 1]] = value;
}

/**
 * Get a nested property using dot notation
 * @param {Object} obj - Object to get property from
 * @param {string} path - Property path in dot notation
 * @returns {any} Property value
 */
function getNestedProperty(obj, path) {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

/**
 * Export settings as JSON file
 * @returns {boolean} Success status
 */
export function exportSettings() {
  try {
    const settingsJson = JSON.stringify(settings, null, 2);
    const blob = new Blob([settingsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'scisummarize_settings.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error exporting settings', error);
    return false;
  }
}

/**
 * Import settings from JSON file
 * @param {File} file - JSON file to import
 * @returns {Promise<boolean>} Success status
 */
export async function importSettings(file) {
  try {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async event => {
        try {
          const importedSettings = JSON.parse(event.target.result);
          const success = await saveSettings(importedSettings);
          resolve(success);
        } catch (error) {
          console.error('Error parsing imported settings', error);
          reject(error);
        }
      };
      
      reader.onerror = error => {
        console.error('Error reading imported settings file', error);
        reject(error);
      };
      
      reader.readAsText(file);
    });
  } catch (error) {
    console.error('Error importing settings', error);
    return false;
  }
}

// Export public functions
window.Settings.loadSettings = loadSettings;
window.Settings.saveSettings = saveSettings; 