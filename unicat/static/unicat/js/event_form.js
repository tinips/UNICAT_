document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('event-form');
    
    if (form) {
        // Handle backend toast notifications
        const toastElement = document.getElementById('toast-notification');
        if (toastElement) {
            const showToast = toastElement.getAttribute('data-show-toast') === 'true';
            if (showToast) {
                const message = toastElement.getAttribute('data-message');
                const type = toastElement.getAttribute('data-type');
                window.toastSystem.showToast(message, type);
            }
        }
        
        // Get form fields
        const inscriptionUrlField = document.getElementById('inscription_url');
        const dateField = document.getElementById('event_date');
        const timeField = document.getElementById('event_time');
        
        // Function to validate URL properly
        function isValidUrl(urlString) {
            if (!urlString || urlString.trim() === '') {
                return { valid: true, isEmpty: true }; // Empty is valid (optional field)
            }
            
            try {
                const url = new URL(urlString.trim());
                const isValidProtocol = url.protocol === 'http:' || url.protocol === 'https:';
                const hasValidHost = url.hostname && url.hostname.includes('.');
                
                return { 
                    valid: isValidProtocol && hasValidHost, 
                    isEmpty: false,
                    protocol: url.protocol,
                    hostname: url.hostname 
                };
            } catch (e) {
                return { valid: false, isEmpty: false, error: 'Invalid URL format' };
            }
        }
        
        // Function to validate date and time
        function isValidDateTime(dateValue, timeValue) {
            if (!dateValue || !timeValue) {
                return { valid: false, error: 'Date and time are required' };
            }
            
            try {
                // Combine date and time
                const dateTimeString = `${dateValue}T${timeValue}`;
                const selectedDateTime = new Date(dateTimeString);
                const currentDateTime = new Date();
                
                // Check if the selected date/time is in the future
                if (selectedDateTime <= currentDateTime) {
                    return { valid: false, error: 'Event date and time must be in the future' };
                }
                
                return { valid: true };
            } catch (e) {
                return { valid: false, error: 'Invalid date or time format' };
            }
        }
        
        // Real-time date/time validation
        function validateDateTime() {
            const dateValue = dateField?.value;
            const timeValue = timeField?.value;
            
            if (dateField && timeField) {
                const validation = isValidDateTime(dateValue, timeValue);
                
                // Remove existing validation classes
                dateField.classList.remove('is-invalid', 'is-valid');
                timeField.classList.remove('is-invalid', 'is-valid');
                
                if (dateValue && timeValue) {
                    if (validation.valid) {
                        dateField.classList.add('is-valid');
                        timeField.classList.add('is-valid');
                    } else {
                        dateField.classList.add('is-invalid');
                        timeField.classList.add('is-invalid');
                    }
                }
            }
        }
        
        // Add event listeners for date/time validation
        if (dateField) {
            dateField.addEventListener('change', validateDateTime);
            dateField.addEventListener('input', validateDateTime);
        }
        
        if (timeField) {
            timeField.addEventListener('change', validateDateTime);
            timeField.addEventListener('input', validateDateTime);
        }
        
        // Real-time URL validation (visual feedback only)
        if (inscriptionUrlField) {
            inscriptionUrlField.addEventListener('input', function() {
                const urlValue = this.value.trim();
                
                // Reset classes first
                this.classList.remove('is-invalid', 'is-valid');
                
                const validation = isValidUrl(urlValue);
                
                if (validation.isEmpty) {
                    // Empty field - no visual feedback (it's optional)
                    return;
                } else if (validation.valid) {
                    // Valid URL
                    this.classList.add('is-valid');
                } else {
                    // Invalid URL
                    this.classList.add('is-invalid');
                }
            });
            
            // Auto-add https:// when user leaves the field
            inscriptionUrlField.addEventListener('blur', function() {
                const value = this.value.trim();
                if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
                    // Only auto-correct if it looks like a domain
                    if (value.includes('.') && !value.includes(' ') && value.length > 3) {
                        this.value = 'https://' + value;
                        // Trigger input validation after auto-correction
                        this.dispatchEvent(new Event('input'));
                    }
                }
            });
        }
        
        form.addEventListener('submit', function(event) {
            // Clear all previous validation states
            form.querySelectorAll('.is-invalid').forEach(field => {
                field.classList.remove('is-invalid');
            });
            
            let hasErrors = false;
            let firstErrorField = null;
            
            //Check REQUIRED fields first
            const requiredFields = form.querySelectorAll('[required]');
            let missingRequiredFields = [];
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    missingRequiredFields.push(field);
                    field.classList.add('is-invalid');
                    if (!firstErrorField) firstErrorField = field;
                }
            });
            
            if (missingRequiredFields.length > 0) {
                event.preventDefault();
                event.stopPropagation();
                hasErrors = true;
                
                // Focus on first missing required field
                if (firstErrorField) {
                    firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstErrorField.focus();
                }
                
                // Show specific message for required fields
                window.toastSystem.showToast('Please fill all required fields.', 'error');
                return; // Stop here, don't check other validations
            }
            
            //Validate date and time
            const dateValue = dateField?.value;
            const timeValue = timeField?.value;
            
            if (dateField && timeField) {
                const dateTimeValidation = isValidDateTime(dateValue, timeValue);
                
                if (!dateTimeValidation.valid) {
                    event.preventDefault();
                    event.stopPropagation();
                    hasErrors = true;
                    
                    dateField.classList.add('is-invalid');
                    timeField.classList.add('is-invalid');
                    dateField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    dateField.focus();
                    
                    window.toastSystem.showToast(dateTimeValidation.error, 'error');
                    return;
                }
            }
            
            // If required fields and date/time are OK, then check URL format (optional field)
            if (inscriptionUrlField) {
                const urlValue = inscriptionUrlField.value.trim();
                const validation = isValidUrl(urlValue);
                
                // Only show error if URL is provided but invalid
                if (!validation.isEmpty && !validation.valid) {
                    event.preventDefault();
                    event.stopPropagation();
                    hasErrors = true;
                    
                    inscriptionUrlField.classList.add('is-invalid');
                    inscriptionUrlField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    inscriptionUrlField.focus();
                    
                    // Show specific error message based on the type of URL error
                    let errorMessage = 'Please enter a valid URL format.';
                    if (validation.error) {
                        errorMessage = 'Invalid URL format.';
                    }
                    
                    window.toastSystem.showToast(errorMessage, 'error');
                    return;
                }
            }
            
            // If we reach here, all validations passed
            // Form will submit normally
            console.log('Form validation passed, submitting...');
        });
        
        // Real-time validation for required inputs (visual feedback)
        const requiredInputs = form.querySelectorAll('[required]');
        requiredInputs.forEach(input => {
            input.addEventListener('input', function() {
                const value = this.value.trim();
                
                if (value) {
                    this.classList.remove('is-invalid');
                    this.classList.add('is-valid');
                } else {
                    this.classList.remove('is-valid');
                    this.classList.add('is-invalid');
                }
            });
        });
    }
});
