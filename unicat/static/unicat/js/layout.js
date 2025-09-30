// Global toast notification system
    window.toastSystem = {
        /**
         * Show a toast notification
         * @param {string} message - The message to display
         * @param {string} type - The type of notification: 'success', 'error', 'warning', or 'info'
         * @param {number} delay - Auto-hide delay in milliseconds
         */
        showToast: function(message, type = 'success', delay = 5000) {
            const toastElement = document.getElementById('toast-notification');
            const toastMessage = document.getElementById('toast-message');
            const toastIcon = document.getElementById('toast-icon');
            
            if (!toastElement || !toastMessage) return;
            
            // Reset classes
            toastElement.className = 'toast align-items-center text-white border-0';
            
            // Set message
            toastMessage.textContent = message;
            
            // Configure icon and color based on type
            switch (type) {
                case 'success':
                    toastElement.classList.add('bg-success');
                    toastIcon.className = 'fas fa-check-circle me-2';
                    break;
                case 'error':
                    toastElement.classList.add('bg-danger');
                    toastIcon.className = 'fas fa-exclamation-circle me-2';
                    break;
                case 'warning':
                    toastElement.classList.add('bg-warning');
                    toastIcon.className = 'fas fa-exclamation-triangle me-2';
                    break;
                case 'info':
                    toastElement.classList.add('bg-info');
                    toastIcon.className = 'fas fa-info-circle me-2';
                    break;
            }
            
            // Show the toast
            const toast = new bootstrap.Toast(toastElement, {
                autohide: true,
                delay: delay
            });
            toast.show();
        },
        
        /**
         * Process URL parameters to show appropriate notifications
         */
        checkUrlParameters: function() {
            const urlParams = new URLSearchParams(window.location.search);
            const action = urlParams.get('action');
            const status = urlParams.get('status');
            
            if (!action || !status) return;
            
            let message = '';
            let type = status === 'success' ? 'success' : 'error';
            
            // Handle resource actions
            if (action === 'create') {
                const itemType = this.getContextFromUrl();
                message = status === 'success' 
                    ? `${itemType} successfully created!` 
                    : `Error creating ${itemType}.`;
            } 
            else if (action === 'edit') {
                const itemType = this.getContextFromUrl();
                message = status === 'success' 
                    ? `${itemType} successfully updated!` 
                    : `Error updating ${itemType}.`;
            } 
            else if (action === 'delete') {
                const itemType = this.getContextFromUrl();
                message = status === 'success' 
                    ? `${itemType} successfully deleted!` 
                    : `Error deleting ${itemType}.`;
            } 
            // Handle comment actions
            else if (action === 'add_comment') {
                const commentType = urlParams.get('type') || 'comment';
                message = status === 'success' 
                    ? `${commentType === 'reply' ? 'Reply' : 'Comment'} successfully added!` 
                    : `Error adding ${commentType === 'reply' ? 'reply' : 'comment'}.`;
            } 
            else if (action === 'edit_comment') {
                const commentType = urlParams.get('type') || 'comment';
                message = status === 'success' 
                    ? `${commentType === 'reply' ? 'Reply' : 'Comment'} successfully updated!` 
                    : `Error updating ${commentType === 'reply' ? 'reply' : 'comment'}.`;
            } 
            else if (action === 'delete_comment') {
                const commentType = urlParams.get('type') || 'comment';
                message = status === 'success' 
                    ? `${commentType === 'reply' ? 'Reply' : 'Comment'} successfully deleted!` 
                    : `Error deleting ${commentType === 'reply' ? 'reply' : 'comment'}.`;
            }
            // Handle review actions
            else if (action === 'review') {
                message = status === 'success' 
                    ? 'Your review has been submitted successfully!' 
                    : 'Error submitting review.';
            }
            else if (action === 'connect') {
                message = status === 'success' 
                    ? 'You are now connected to the Exchange Program!' 
                    : 'You are already connected to an Exchange Program.';
            }
            else if (action == "edit_profile") {
                message = status === 'success'
                    ? 'Your profile has been updated successfully!'
                    : 'Error updating profile.';
            }
            else if (action === 'register') {
                message = status === 'success' 
                    ? 'Registration successful! Welcome to Unicat!' 
                    : 'Error during registration. Please try again.';
            }
            else if (action === 'bug_report') {
                message = status === 'success' 
                    ? 'Your bug report has been submitted successfully!' 
                    : 'Error submitting bug report.';
            }
            else if (action === 'verify') {
                message = status === 'success' 
                    ? 'Your email has been verified successfully!' 
                    : 'Error verifying email.';
            }
            else if (action === 'login') {
                message = status === 'success'
                    ? 'Login successful! Welcome back to Unicat!'
                    : 'Error during login. Please check your credentials.';
            }
            else if (action === 'logout') {
                message = status === 'success'
                    ? 'You have been logged out successfully!'
                    : 'Error during logout. Please try again.';}
            if (message) {
                this.showToast(message, type);
                
                // Remove parameters from URL without reloading
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
            }
        },
        
        /**
         * Determine context (resource, event, etc.) from URL path
         */
        getContextFromUrl: function() {
            const path = window.location.pathname;
            
            if (path.includes('/resources')) {
                return 'Resource';
            } else if (path.includes('/event')) {
                return 'Event';
            } else if (path.includes('/exchanges')) {
                return 'Exchange program';
            } else {
                return 'Item';
            }
        },
        
        /**
         * Initialize the toast system
         */
        init: function() {
            // Check for server-side toast (from template context)
            const toastElement = document.getElementById('toast-notification');
            if (toastElement) {
                const showToast = toastElement.getAttribute('data-show-toast') === 'true';
                const message = toastElement.getAttribute('data-message');
                const type = toastElement.getAttribute('data-type') || 'success';
                
                if (showToast && message) {
                    this.showToast(message, type);
                }
            }
            
            // Check URL parameters for client-side toast
            this.checkUrlParameters();
        }
    };
    
    // Initialize the toast system when the DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        window.toastSystem.init();
    });

document.addEventListener('DOMContentLoaded', function() {
        const bugReportModal = document.getElementById('bugReportModal');
        
        if (bugReportModal) {
            bugReportModal.addEventListener('shown.bs.modal', function() {
                // Auto-fill current page URL
                document.getElementById('pageUrl').value = window.location.href;
                
                // Collect technical information
                const browserInfo = `${navigator.appName} ${navigator.appVersion}`;
                const screenInfo = `${screen.width}x${screen.height}`;
                const userAgent = navigator.userAgent;
                
                // Display in visible areas
                document.getElementById('browserInfo').textContent = browserInfo;
                document.getElementById('screenInfo').textContent = screenInfo;
                document.getElementById('userAgentInfo').textContent = userAgent;
                
                // Set hidden fields
                document.getElementById('hiddenBrowserInfo').value = browserInfo;
                document.getElementById('hiddenScreenInfo').value = screenInfo;
                document.getElementById('hiddenUserAgent').value = userAgent;
            });
            
            // Handle form submission
            const bugReportForm = document.getElementById('bugReportForm');
            if (bugReportForm) {
                bugReportForm.addEventListener('submit', function(e) {
                    const submitBtn = this.querySelector('button[type="submit"]');
                    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Submitting...';
                    submitBtn.disabled = true;
                });
            }
        }
    });