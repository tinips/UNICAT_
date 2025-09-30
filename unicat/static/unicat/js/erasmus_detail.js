document.addEventListener('DOMContentLoaded', function() {
    // Initialize toggle functionality
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        const targetSelector = btn.dataset.target;
        const panel = document.querySelector(targetSelector);
        const lsKey = `toggleState:${targetSelector}`;

        // Restaurar estat guardat
        if (localStorage.getItem(lsKey) === 'true') {
            panel.classList.add('open');
            btn.setAttribute('aria-expanded', 'true');
        }

        btn.addEventListener('click', () => {
            const isOpen = panel.classList.toggle('open');
            btn.setAttribute('aria-expanded', isOpen);
            localStorage.setItem(lsKey, isOpen);
        });
    });
    
    // SINGLE star rating initialization (with half-star support)
    document.querySelectorAll('.star-rating').forEach(function(ratingElement) {
        const stars = ratingElement.querySelectorAll('.stars i');
        const hiddenInput = ratingElement.querySelector('input[type="hidden"]');
        const ratingValueDisplay = ratingElement.querySelector('.rating-value');
        
        // Store current rating value
        let currentRating = 0;
        
        // Check if this is the overall rating (integer only)
        const isOverallRating = ratingElement.hasAttribute('data-integer-only') || 
                               (hiddenInput && hiddenInput.id === "rating-input");
        const isRequired = ratingElement.hasAttribute('data-required');
        
        // Add event listeners to stars
        stars.forEach(function(star) {
            const ratingValue = parseInt(star.getAttribute('data-value'));
            
            // Mouse move event for hover effect and half-star detection
            star.addEventListener('mousemove', function(e) {
                if (isOverallRating) {
                    // Overall rating - only whole stars
                    updateStarsDisplay(stars, ratingValue, true);
                    if (ratingValueDisplay) ratingValueDisplay.textContent = ratingValue;
                } else {
                    // Other ratings - allow half stars
                    const rect = this.getBoundingClientRect();
                    const mouseX = e.clientX - rect.left;
                    const starWidth = rect.width;
                    const isLeftHalf = mouseX < (starWidth / 2);
                    
                    // ✅ Calculate half-star value correctly
                    const hoverValue = isLeftHalf ? ratingValue - 0.5 : ratingValue;
                    
                    updateStarsDisplay(stars, hoverValue, true);
                    if (ratingValueDisplay) ratingValueDisplay.textContent = hoverValue;
                }
            });
            
            // Click event for final selection
            star.addEventListener('click', function(e) {
                if (isOverallRating) {
                    // Overall rating - use whole star value
                    currentRating = ratingValue;
                } else {
                    // Other ratings - allow half stars
                    const rect = this.getBoundingClientRect();
                    const mouseX = e.clientX - rect.left;
                    const starWidth = rect.width;
                    const isLeftHalf = mouseX < (starWidth / 2);
                    
                    // ✅ Calculate half-star value correctly
                    currentRating = isLeftHalf ? ratingValue - 0.5 : ratingValue;
                }
                
                // Update the hidden input with exact value (decimal for half-stars)
                if (hiddenInput) {
                    hiddenInput.value = currentRating;
                    console.log(`${hiddenInput.name} set to: ${currentRating} (type: ${typeof currentRating})`);
                }
                
                // Update display
                updateStarsDisplay(stars, currentRating, false);
                if (ratingValueDisplay) ratingValueDisplay.textContent = currentRating;
                
                // Clear validation errors if required field
                if (isRequired && currentRating > 0) {
                    clearRatingError(ratingElement);
                }
            });
        });
        
        // Mouse leave event - restore current rating
        const starsContainer = ratingElement.querySelector('.stars');
        if (starsContainer) {
            starsContainer.addEventListener('mouseleave', function() {
                updateStarsDisplay(stars, currentRating, false);
                if (ratingValueDisplay) ratingValueDisplay.textContent = currentRating || '0';
            });
        }
        
        // Function to update stars visual display with half-star support
        function updateStarsDisplay(stars, rating, isHover = false) {
            const fullStars = Math.floor(rating);
            const hasHalfStar = (rating % 1) !== 0;
            
            stars.forEach(function(star, index) {
                const starNumber = index + 1; // 1-based indexing for data-value
                
                // Remove all classes first
                star.className = 'far fa-star';
                
                if (starNumber <= fullStars) {
                    // Full star
                    star.className = 'fas fa-star';
                } else if (starNumber === fullStars + 1 && hasHalfStar) {
                    // Half star
                    star.className = 'fas fa-star-half-alt';
                } else {
                    // Empty star
                    star.className = 'far fa-star';
                }
                
                // Add hover effect if needed
                if (isHover) {
                    star.style.transform = 'scale(1.05)';
                    star.style.transition = 'transform 0.1s ease';
                } else {
                    star.style.transform = '';
                    star.style.transition = '';
                }
            });
        }
    });

    // Star filter functionality
    const ratingRows = document.querySelectorAll('.rating-row.clickable');
    const reviewItems = document.querySelectorAll('.review-item');
    
    // Handle click on rating rows
    ratingRows.forEach(row => {
        row.addEventListener('click', function() {
            const starFilter = this.getAttribute('data-star-filter');
            
            // Clear active state from all rows
            ratingRows.forEach(r => r.classList.remove('active'));
            
            // If the same filter is clicked again, clear the filter
            if (this.classList.contains('was-active')) {
                clearFilter();
                this.classList.remove('was-active');
                return;
            }
            
            // Set active state on clicked row
            this.classList.add('active');
            this.classList.add('was-active');
            
            // Filter reviews based on overall rating only
            reviewItems.forEach(review => {
                const starsDisplay = review.querySelector('.stars-display');
                if (starsDisplay) {
                    const overallRating = parseInt(starsDisplay.getAttribute('data-rating') || '0');
                    
                    // Filter based on overall rating (1-5 stars)
                    if (overallRating == parseInt(starFilter)) {
                        review.classList.remove('filtered');
                    } else {
                        review.classList.add('filtered');
                    }
                }
            });
        });
    });
    
    function clearFilter() {
        // Reset UI
        ratingRows.forEach(r => {
            r.classList.remove('active');
            r.classList.remove('was-active');
        });
        
        // Show all reviews
        reviewItems.forEach(review => {
            review.classList.remove('filtered');
        });
        
        // Hide the "no reviews match" message if it's showing
        const noMatchMessage = document.querySelector('.no-matching-reviews');
        if (noMatchMessage) {
            noMatchMessage.remove();
        }
    }
    
    // Set data-rating attributes for existing reviews
    document.querySelectorAll('.review-item').forEach(review => {
        const starsDisplay = review.querySelector('.stars-display');
        if (starsDisplay) {
            const fullStars = starsDisplay.querySelectorAll('.fas.fa-star').length;
            starsDisplay.setAttribute('data-rating', fullStars);
            console.log(`Review overall rating set to: ${fullStars} stars`);
        }
    });
    
    // Form validation
    const form = document.getElementById('review-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            let isValid = true;
            
            // Validate required ratings
            const requiredRatings = form.querySelectorAll('.star-rating[data-required="true"]');
            
            requiredRatings.forEach(function(ratingContainer) {
                const hiddenInput = ratingContainer.querySelector('input[type="hidden"]');
                const value = parseFloat(hiddenInput.value); // Use parseFloat for decimal support
                
                if (!value || value === 0) {
                    showRatingError(ratingContainer);
                    isValid = false;
                } else {
                    clearRatingError(ratingContainer);
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                e.stopPropagation();
                
                // Scroll to first error
                const firstError = form.querySelector('.star-rating.is-invalid');
                if (firstError) {
                    firstError.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }
                
                return false;
            }
        });
    }

    // Validation error functions
    function showRatingError(ratingContainer) {
        ratingContainer.classList.add('is-invalid');
        const errorDiv = ratingContainer.querySelector('.invalid-feedback');
        if (errorDiv) {
            errorDiv.classList.remove('d-none');
        }
        
        // Add red border to stars
        const starsContainer = ratingContainer.querySelector('.stars');
        if (starsContainer) {
            starsContainer.style.border = '1px solid #dc3545';
            starsContainer.style.borderRadius = '4px';
            starsContainer.style.padding = '2px';
        }
    }
    
    function clearRatingError(ratingContainer) {
        ratingContainer.classList.remove('is-invalid');
        const errorDiv = ratingContainer.querySelector('.invalid-feedback');
        if (errorDiv) {
            errorDiv.classList.add('d-none');
        }
        
        // Remove red border
        const starsContainer = ratingContainer.querySelector('.stars');
        if (starsContainer) {
            starsContainer.style.border = '';
            starsContainer.style.borderRadius = '';
            starsContainer.style.padding = '';
        }
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Handle favorite star clicks (igual que a erasmus.js)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('favorite-icon')) {
            e.preventDefault();
            e.stopPropagation();
            
            const programId = e.target.getAttribute('data-program-id');
            const icon = e.target;
            
            // Disable the icon temporarily to prevent double clicks
            icon.style.pointerEvents = 'none';
            
            // Toggle favorite
            fetch(`/erasmus/${programId}/toggle-favorite/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update the star appearance
                    if (data.is_favorite) {
                        icon.classList.remove('far');
                        icon.classList.add('fas');
                        icon.setAttribute('title', 'Remove from favorites');
                    } else {
                        icon.classList.remove('fas');
                        icon.classList.add('far');
                        icon.setAttribute('title', 'Add to favorites');
                    }
                    
                    // Show toast notification
                    if (window.toastSystem) {
                        window.toastSystem.showToast(data.message, 'success', 3000);
                    }
                    
                    // Update tooltip
                    try {
                        const tooltip = bootstrap.Tooltip.getInstance(icon);
                        if (tooltip) {
                            tooltip.dispose();
                            new bootstrap.Tooltip(icon);
                        } else {
                            new bootstrap.Tooltip(icon);
                        }
                    } catch (tooltipError) {
                        console.warn('Tooltip update failed:', tooltipError);
                    }
                    
                } else {
                    // Show error message
                    if (window.toastSystem) {
                        window.toastSystem.showToast(data.message || 'Error updating favorites', 'error');
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
                if (window.toastSystem) {
                    window.toastSystem.showToast('Error updating favorites', 'error');
                }
            })
            .finally(() => {
                // Re-enable the icon
                icon.style.pointerEvents = 'auto';
            });
        }
    });

    // Handle disconnect modal
    const disconnectModal = document.getElementById('disconnectModal');
    const confirmDisconnectBtn = document.getElementById('confirm-disconnect-btn');
    const disconnectProgramName = document.getElementById('disconnect-program-name');
    
    let currentProgramId = null;
    
    // When disconnect button is clicked
    document.addEventListener('click', function(e) {
        if (e.target.closest('[data-bs-target="#disconnectModal"]')) {
            const button = e.target.closest('[data-bs-target="#disconnectModal"]');
            currentProgramId = button.getAttribute('data-program-id');
            const programName = button.getAttribute('data-program-name');
            
            if (disconnectProgramName) {
                disconnectProgramName.textContent = programName;
            }
        }
    });
    
    // Handle confirm disconnect
    if (confirmDisconnectBtn) {
        confirmDisconnectBtn.addEventListener('click', function() {
            if (!currentProgramId) return;
            
            // Disable button and show loading
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Disconnecting...';
            
            // Send disconnect request
            fetch(`/erasmus/${currentProgramId}/disconnect/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Show success message and reload page
                    if (window.toastSystem) {
                        window.toastSystem.showToast(data.message, 'success', 3000);
                    }
                    
                    // Close modal and reload page after short delay
                    const modal = bootstrap.Modal.getInstance(disconnectModal);
                    modal.hide();
                    
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    // Show error message
                    if (window.toastSystem) {
                        window.toastSystem.showToast(data.message || 'Error disconnecting', 'error');
                    }
                    
                    // Re-enable button
                    this.disabled = false;
                    this.innerHTML = '<i class="fas fa-unlink me-2"></i>Disconnect';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                if (window.toastSystem) {
                    window.toastSystem.showToast('Error disconnecting from program', 'error');
                }
                
                // Re-enable button
                this.disabled = false;
                this.innerHTML = '<i class="fas fa-unlink me-2"></i>Disconnect';
            });
        });
    }
    
    // CSRF token function
    function getCsrfToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]').value;
    }
});