/**
 * Upload module for SciSummarize
 * Handles document uploads and processing
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Upload.js loaded');
    
    // DOM Elements
    const fileInput = document.getElementById('fileInput');
    const dropArea = document.getElementById('dropArea');
    const fileName = document.getElementById('fileName');
    const uploadForm = document.getElementById('uploadForm');
    const uploadStatus = document.getElementById('uploadStatus');
    const progressBar = document.getElementById('progressBar');
    const statusMessage = document.getElementById('statusMessage');
    const summaryLengthSelect = document.getElementById('summaryLength');
    const customLengthContainer = document.getElementById('customLengthContainer');
    const submitButton = document.getElementById('submitButton');
    const errorContainer = document.getElementById('errorContainer');

    console.log('Elements found:', {
        fileInput: !!fileInput,
        dropArea: !!dropArea,
        fileName: !!fileName,
        uploadForm: !!uploadForm,
        submitButton: !!submitButton
    });

    // Function to show errors
    function showError(message) {
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.style.display = 'block';
            
            // Scroll to error
            errorContainer.scrollIntoView({ behavior: 'smooth' });
        } else {
            // Fallback to alert if container not found
            alert(message);
        }
        
        // Hide the loading indicator
        if (uploadStatus) {
            uploadStatus.style.display = 'none';
        }
    }
    
    // Function to hide errors
    function hideError() {
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }
    }

    // File selection handler
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            console.log('File selected');
            
            // Hide any previous errors when file is selected
            hideError();
            
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                console.log('File name:', file.name);
                
                // Display file name
                if (fileName) {
                    fileName.textContent = file.name;
                    fileName.style.display = 'block';
                }
                
                // Add 'has-file' class to drop area
                if (dropArea) {
                    dropArea.classList.add('has-file');
                }
            }
        });
    }

    // Enhanced Form submission handler
    if (uploadForm) {
        console.log('Setting up form submission handler');
        
        // Use both the form submit event and button click as a backup
        uploadForm.addEventListener('submit', handleFormSubmit);
        
        if (submitButton) {
            submitButton.addEventListener('click', function(e) {
                console.log('Submit button clicked directly');
            });
        }
    }
    
    function handleFormSubmit(e) {
        console.log('Form submission detected');
        e.preventDefault();
        console.log('Default form submission prevented');
        
        // Clear any previous errors
        hideError();
        
        if (!fileInput || fileInput.files.length === 0) {
            showError('Please select a file to upload');
            console.log('No file selected, submission stopped');
            return;
        }
        
        const file = fileInput.files[0];
        console.log('Proceeding with file:', file.name);
        
        // Check file type
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            showError('Only PDF files are currently supported');
            console.log('Invalid file type, submission stopped');
            return;
        }
        
        // Show upload status
        if (uploadStatus) {
            uploadStatus.style.display = 'block';
            console.log('Upload status display shown');
        }
        
        // Create FormData
        const formData = new FormData();
        
        // Explicitly add the file with the correct field name
        formData.append('file', file, file.name);
        console.log('File added to FormData with name:', file.name);
        
        // Debug - log contents of FormData
        console.log('FormData contents:');
        for (let [key, value] of formData.entries()) {
            if (value instanceof File) {
                console.log(`${key}: File - ${value.name} (${value.type}, ${value.size} bytes)`);
            } else {
                console.log(`${key}: ${value}`);
            }
        }
        
        // Get summary options
        const summaryLength = summaryLengthSelect ? summaryLengthSelect.value : 'medium';
        formData.append('summaryLength', summaryLength);
        console.log('Summary length set to:', summaryLength);
        
        if (summaryLength === 'custom' && document.getElementById('customLength')) {
            const customLength = document.getElementById('customLength').value;
            formData.append('customLength', customLength);
            console.log('Custom length set to:', customLength);
        }
        
        // Add focus areas if selected
        const focusAreas = document.getElementById('focusArea');
        if (focusAreas && focusAreas.selectedOptions) {
            Array.from(focusAreas.selectedOptions).forEach(option => {
                formData.append('focusAreas', option.value);
                console.log('Focus area added:', option.value);
            });
        }
        
        // Add checkbox values
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            formData.append(checkbox.name, checkbox.checked);
            console.log('Checkbox value added:', checkbox.name, checkbox.checked);
        });
        
        console.log('Sending fetch request to /upload-document');
        
        // Submit the form with proper authentication - using our new proxy endpoint
        fetch('/upload-document', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin',
            // No need for Authorization header as we're using middleware authentication
        })
        .then(response => {
            console.log('Received response:', response.status);
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Authentication required. Please log in.');
                } else if (response.status === 415) {
                    throw new Error('Only PDF files are supported.');
                } else {
                    throw new Error('Upload failed with status: ' + response.status);
                }
            }
            return response.json();
        })
        .then(data => {
            console.log('Upload successful, response data:', data);
            if (data.documentId) {
                console.log('Redirecting to document view:', data.documentId);
                window.location.href = `/documents/${data.documentId}`;
            } else {
                console.log('Redirecting to documents list');
                window.location.href = '/documents';
            }
        })
        .catch(error => {
            console.error('Upload error:', error);
            showError(error.message || 'An error occurred during upload');
            console.log('Error message displayed to user');
        });
    }

    // Summary length change handler
    if (summaryLengthSelect && customLengthContainer) {
        summaryLengthSelect.addEventListener('change', function() {
            if (this.value === 'custom') {
                customLengthContainer.style.display = 'block';
            } else {
                customLengthContainer.style.display = 'none';
            }
        });
    }

    // Setup drag and drop
    if (dropArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Highlight drop area when file is dragged over
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });

        // Remove highlight when file is dragged out or dropped
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });

        function highlight() {
            dropArea.classList.add('highlight');
        }

        function unhighlight() {
            dropArea.classList.remove('highlight');
        }

        // Handle dropped files
        dropArea.addEventListener('drop', handleDrop, false);

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length > 0) {
                fileInput.files = files;
                
                // Trigger change event
                const event = new Event('change');
                fileInput.dispatchEvent(event);
            }
        }
    }
}); 