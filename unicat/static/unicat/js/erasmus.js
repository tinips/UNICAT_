// Complete rewrite of the filtering system using API

// Global variables to track state
let currentPage = 1;
let totalPages = 1;
let isLoading = false;

// Multi-select country filter variables
let selectedCountries = [];
let countryDropdownOpen = false;
let countries = [];

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Get countries from the backend data passed via template
    countries = window.countriesData || [];
    console.log('Countries loaded:', countries);
    
    // Set up event listeners for real-time filtering
    document.getElementById('universitySearch').addEventListener('input', debounce(applyFilters, 300));
    // Remove the old countryFilter listener since we're using multi-select
    document.getElementById('favoritesFilter').addEventListener('change', applyFilters); 
    document.getElementById('sortFilter').addEventListener('change', applyFilters);
    
    // Initialize multi-select country filter
    initializeCountryMultiSelect();
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!document.getElementById('countrySelect').contains(e.target)) {
            closeCountryDropdown();
        }
    });
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

// Initialize country multi-select
function initializeCountryMultiSelect() {
    generateCountryOptions();
    updateCountryDisplay();
}

// Generate country options using backend data
function generateCountryOptions() {
    const optionsList = document.getElementById('countryOptionsList');
    if (!optionsList) {
        console.error('countryOptionsList not found');
        return;
    }
    
    optionsList.innerHTML = '';
    
    // Sort countries alphabetically by name
    const sortedCountries = [...countries].sort((a, b) => a.name.localeCompare(b.name));
    
    sortedCountries.forEach(country => {
        const option = document.createElement('div');
        option.className = 'option-item';
        option.setAttribute('data-value', country.name);
        option.innerHTML = `
            <input type="checkbox" 
                   id="country_cb_${country.code}" 
                   onchange="toggleCountrySelection('${country.name.replace(/'/g, "\\'")}')">
            <label for="country_cb_${country.code}">${country.name}</label>
        `;
        optionsList.appendChild(option);
    });
}

// Toggle country dropdown
function toggleCountryDropdown() {
    const container = document.getElementById('countryOptionsContainer');
    const button = document.querySelector('.multi-select-button');
    countryDropdownOpen = !countryDropdownOpen;
    
    if (countryDropdownOpen) {
        container.classList.add('show');
    button.classList.add('active'); // Afegir classe active per l'animació
    } else {
        container.classList.remove('show');
    button.classList.remove('active'); // Treure classe active
    }
}

// Close country dropdown
function closeCountryDropdown() {
    const container = document.getElementById('countryOptionsContainer');
    const button = document.querySelector('.multi-select-button');
    if (container) {
        container.classList.remove('show');
    button.classList.remove('active'); // Treure classe active
        countryDropdownOpen = false;
    }
}

// Toggle country selection
function toggleCountrySelection(countryName) {
    const index = selectedCountries.indexOf(countryName);
    
    if (index > -1) {
        selectedCountries.splice(index, 1);
    } else {
        selectedCountries.push(countryName);
    }
    
    updateCountryDisplay();
    updateHiddenCountryInput();
    applyFilters(); // Apply filters immediately when countries change
}

// Update country display
function updateCountryDisplay() {
    const placeholderText = document.getElementById('countryPlaceholderText');
    const selectedTags = document.getElementById('countrySelectedTags');
    const selectedDisplay = document.querySelector('.selected-display');
    
    if (!placeholderText || !selectedTags) return;
    
    if (selectedCountries.length === 0) {
        placeholderText.style.display = 'inline';
        placeholderText.textContent = 'All Countries';
        selectedTags.innerHTML = '';
        selectedDisplay.classList.remove('has-overflow');
    } else {
        placeholderText.style.display = 'none';
        
    // Create tags with proper event handling
        selectedTags.innerHTML = selectedCountries.map((country, index) => `
            <span class="selected-tag">
                ${country}
                <span class="tag-remove" data-country="${country}" data-index="${index}">&times;</span>
            </span>
        `).join('');
        
    // Check if there's overflow
        setTimeout(() => {
            if (selectedTags.scrollWidth > selectedTags.clientWidth) {
                selectedDisplay.classList.add('has-overflow');
            } else {
                selectedDisplay.classList.remove('has-overflow');
            }
        }, 10);
        
    // Add event listeners to the X buttons after creating them
        selectedTags.querySelectorAll('.tag-remove').forEach(removeBtn => {
            removeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const countryToRemove = this.getAttribute('data-country');
                removeCountrySelection(countryToRemove);
            });
        });
    }
}

// Update remove function to work with the new event system
function removeCountrySelection(countryName) {
    // Find the checkbox using the country name
    const countryData = countries.find(c => c.name === countryName);
    if (countryData) {
        const checkbox = document.getElementById(`country_cb_${countryData.code}`);
        if (checkbox) {
            checkbox.checked = false;
        }
    }
    
    // Remove from selected countries array
    const index = selectedCountries.indexOf(countryName);
    if (index > -1) {
        selectedCountries.splice(index, 1);
        updateCountryDisplay();
        updateHiddenCountryInput();
        applyFilters();
    }
}

// Filter country options (search)
function filterCountryOptions(searchTerm) {
    const options = document.querySelectorAll('.option-item');
    
    options.forEach(option => {
        const country = option.getAttribute('data-value');
        if (country.toLowerCase().includes(searchTerm.toLowerCase())) {
            option.style.display = 'flex';
        } else {
            option.style.display = 'none';
        }
    });
}

// Update hidden input for form compatibility
function updateHiddenCountryInput() {
    const hiddenInput = document.getElementById('countryFilter');
    if (hiddenInput) {
        hiddenInput.value = selectedCountries.join(',');
    }
}

// Clear country selections
function clearCountrySelections() {
    selectedCountries = [];
    
    // Uncheck all checkboxes
    document.querySelectorAll('#countryOptionsList input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    
    updateCountryDisplay();
    updateHiddenCountryInput();
}

// Debounce function to limit API calls while typing
function debounce(func, delay) {
    let debounceTimer;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
}

// Apply filters and fetch filtered results from API (updated for multi-select)
function applyFilters() {
    const universitySearch = document.getElementById('universitySearch').value.trim();
    // Use selected countries array instead of single country filter
    const countryFilters = selectedCountries;
    const favoritesFilter = document.getElementById('favoritesFilter').value; 
    const sortFilter = document.getElementById('sortFilter').value;
    
    // Show loading indicator
    showLoading(true);
    
    // Build API URL with filters
    let apiUrl = '/api/erasmus-programs/?page=1';
    if (universitySearch) {
        apiUrl += `&university=${encodeURIComponent(universitySearch)}`;
    }
    // Handle multiple countries
    if (countryFilters.length > 0) {
        countryFilters.forEach(country => {
            apiUrl += `&country=${encodeURIComponent(country)}`;
        });
    }
    if (favoritesFilter) { 
        apiUrl += `&favorites=${encodeURIComponent(favoritesFilter)}`;
    }
    if (sortFilter) {
        apiUrl += `&sort=${encodeURIComponent(sortFilter)}`;
    }
    
    // Reset to first page when filtering
    currentPage = 1;
    
    // Fetch filtered results
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Update the DOM with filtered results
            updateResultsDisplay(data);
            
            // Show/hide search info text
            const searchInfo = document.getElementById('searchInfo');
            if (searchInfo) {
                // Update condition to check for selected countries
                if (universitySearch || countryFilters.length > 0 || favoritesFilter) {
                    searchInfo.classList.remove('d-none');
                } else {
                    searchInfo.classList.add('d-none');
                }
            }
            
            // Hide loading indicator
            showLoading(false);
            
            // Scroll to top of the page smoothly when filtering
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        })
        .catch(error => {
            console.error('Error fetching filtered programs:', error);
            showLoading(false);
            
            // Show error message
            if (window.toastSystem) {
                window.toastSystem.showToast('Error loading programs. Please try again.', 'error');
            }
        });
}

// Update the results display with the filtered programs
function updateResultsDisplay(data) {
    const programsList = document.getElementById('programsList');
    const filteredCount = document.getElementById('filteredCount');
    const totalCount = document.getElementById('totalCount');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const pageInfo = document.getElementById('pageInfo');
    
    // Update counts
    if (filteredCount) filteredCount.textContent = data.count;
    if (totalCount) totalCount.textContent = data.total_count || data.count;
    
    // Update total pages
    totalPages = Math.ceil(data.count / 60);
    
    // Update page info
    if (pageInfo) {
        if (totalPages === 0) {
            pageInfo.textContent = 'No pages';
        } else {
            pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        }
    }
      // Clear current programs
    programsList.innerHTML = '';
      if (data.results.length === 0) {
        // Show no results message
        if (noResultsMessage) {
            noResultsMessage.classList.remove('d-none');
        }
        // Hide pagination when no results
        hidePagination();
        // Hide page info when no results
        if (pageInfo) {
            pageInfo.style.display = 'none';
        }
        return;
    }
    
    // Show page info when there are results
    if (pageInfo) {
        pageInfo.style.display = 'block';
    }
    
    // Hide no results message if visible
    if (noResultsMessage) {
        noResultsMessage.classList.add('d-none');
    }
    
    // Render programs
    data.results.forEach(program => {
        const programCard = createProgramCard(program);
        programsList.appendChild(programCard);
    });
    
    // Initialize tooltips on new elements
    const tooltipTriggerList = [].slice.call(programsList.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
      // Update pagination
    updatePagination(data.count, currentPage);
}

// Create a program card element
function createProgramCard(program) {
    // Create card element
    const cardCol = document.createElement('div');
    cardCol.className = 'col-lg-3 col-md-4 col-sm-6 program-card';
    cardCol.setAttribute('data-university', program.university);
    cardCol.setAttribute('data-country', program.country);
    
    // Generate stars HTML
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= program.full_stars) {
            starsHtml += '<i class="fas fa-star text-warning"></i>';
        } else if (i === program.full_stars + 1 && program.has_half_star) {
            starsHtml += '<i class="fas fa-star-half-alt text-warning"></i>';
        } else {
            starsHtml += '<i class="far fa-star text-warning"></i>';
        }
    }
    
    // Three-state logic for connection buttons
    let connectButtonHtml = '';
    if (program.is_user_program) {
        // User is connected to this specific program
        connectButtonHtml = `
            <button class="btn btn-sm btn-success" disabled>
                <i class="fas fa-check me-1"></i>Connected
            </button>
        `;
    } else if (program.has_user_program) {
        // User has a different program - show empty text
        connectButtonHtml = `
            <span class="text-muted small">
                <!--<i class="fas fa-info-circle me-1"></i>Connected elsewhere-->
            </span>
        `;
    } else {
        // User has no program - can connect
        connectButtonHtml = `
            <a href="/exchanges_form/${program.id}/1/" class="btn btn-sm btn-outline-primary">
                <i class="fas fa-plus me-1"></i>Connect
            </a>
        `;
    }
    
    // Build card HTML with bookmark icon
    cardCol.innerHTML = `
        <div class="card h-100 shadow-sm erasmus-card">
            <!-- Card header with logo and ranking -->
            <div class="card-header bg-white p-3 d-flex justify-content-between align-items-start border-0 position-relative">
                <!-- Bookmark icon in top left (like Instagram save) -->
                <div class="bookmark-icon position-absolute">
                    <i class="favorite-icon ${program.is_favorite ? 'fas' : 'far'} fa-bookmark text-primary" 
                       data-program-id="${program.id}" 
                       style="font-size: 1.4rem; cursor: pointer; text-shadow: 0 2px 4px rgba(0,0,0,0.1);"
                       data-bs-toggle="tooltip" 
                       data-bs-placement="top" 
                       title="${program.is_favorite ? 'Remove from favorites' : 'Add to favorites'}">
                    </i>
                </div>
                
                <div class="university-logo-container">
                ${program.static_image ? 
                `<img src="/static/unicat/images/erasmus/${program.static_image}" alt="${program.university}" class="university-logo">` : 
                `<img src="/static/unicat/images/university-placeholder.jpg" alt="${program.university}" class="university-logo">`}
            </div>
                ${program.rank ? 
                  `<div class="university-rank">
                      <span class="fas fa-university badge bg-primary"> #${program.rank}</span>
                   </div>` : ''}
            </div>
            
            <!-- Card body with university information -->
            <div class="card-body pt-0">
                <h5 class="card-title university-name" data-bs-toggle="tooltip" data-bs-placement="top" title="${program.university}">${program.university}</h5>
                <div class="university-location">
                    <i class="fa fa-map-marker-alt location-icon"></i>
                    <span>${program.city}, ${program.country}</span>
                </div>
                
                <!-- Additional statistics -->
                <div class="university-stats mt-3">
                    <div class="stat-item">
                        <i class="fa fa-users stat-icon"></i>
                        <span>${program.participants_count} students</span>
                    </div>
                    
                    <!-- Average rating stars -->
                    <div class="stat-item mt-2">
                        <div class="d-flex align-items-center">
                            <div class="stars-display small" style="letter-spacing: -1px;">
                                ${starsHtml}
                                <span class="ms-2 text-muted" style="letter-spacing: 1px;">
                                    ${program.average_rating.toFixed(1)}
                                    <small>(${program.reviews_count})</small>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Card footer with action buttons -->
            <div class="card-footer bg-white pt-0 border-top-0">
                <div class="d-flex justify-content-between align-items-center py-2">
                    <!-- Use the new three-state logic -->
                    <div>
                        ${connectButtonHtml}
                    </div>
                    <div>
                        <a href="/exchanges_detail/${program.id}/" class="btn btn-sm btn-outline-primary">
                            <i class="fas fa-eye me-1"></i>View Details
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return cardCol;
}

// Update pagination controls
function updatePagination(totalItems, currentPage) {
    const totalPages = Math.ceil(totalItems / 60);
    const paginationElement = document.querySelector('.pagination');
    
    if (!paginationElement) return;
    
    // Hide pagination if no items or only one page
    if (totalItems === 0 || totalPages <= 1) {
        hidePagination();
        return;
    }
    
    // Show pagination if there are multiple pages
    showPagination();
    
    let paginationHtml = '';
    
    // First page
    paginationHtml += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="goToPage(1); return false;" aria-label="First">
                <span aria-hidden="true">&laquo;&laquo;</span>
            </a>
        </li>
    `;
    
    // Previous page
    paginationHtml += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="goToPage(${currentPage - 1}); return false;" aria-label="Previous">
                <span aria-hidden="true">&laquo;</span>
            </a>
        </li>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage || (i > currentPage - 4 && i < currentPage + 4) || i === 1 || i === totalPages) {
            paginationHtml += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="goToPage(${i}); return false;">${i}</a>
                </li>
            `;
        }
    }
    
    // Next page
    paginationHtml += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="goToPage(${currentPage + 1}); return false;" aria-label="Next">
                <span aria-hidden="true">&raquo;</span>
            </a>
        </li>
    `;
    
    // Last page
    paginationHtml += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="goToPage(${totalPages}); return false;" aria-label="Last">
                <span aria-hidden="true">&raquo;&raquo;</span>
            </a>
        </li>
    `;
    
    paginationElement.innerHTML = paginationHtml;
}

// Go to a specific page (updated for multi-select)
function goToPage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    
    currentPage = page;
    
    // Show loading indicator
    showLoading(true);
    
    // Build API URL with filters and page
    const universitySearch = document.getElementById('universitySearch').value.trim();
    // Use selected countries array
    const countryFilters = selectedCountries;
    const favoritesFilter = document.getElementById('favoritesFilter').value;
    const sortFilter = document.getElementById('sortFilter').value;
    
    let apiUrl = `/api/erasmus-programs/?page=${page}`;
    if (universitySearch) {
        apiUrl += `&university=${encodeURIComponent(universitySearch)}`;
    }
    // Handle multiple countries
    if (countryFilters.length > 0) {
        countryFilters.forEach(country => {
            apiUrl += `&country=${encodeURIComponent(country)}`;
        });
    }
    if (favoritesFilter) {
        apiUrl += `&favorites=${encodeURIComponent(favoritesFilter)}`;
    }
    if (sortFilter) {
        apiUrl += `&sort=${encodeURIComponent(sortFilter)}`;
    }
    
    // Fetch page data
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })        .then(data => {
            // Update the DOM with new page results
            updateResultsDisplay(data);
            
            // Hide loading indicator
            showLoading(false);
            
            // Scroll to top of the page smoothly
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        })
        .catch(error => {
            console.error('Error fetching page data:', error);
            showLoading(false);
            
            // Show error message
            if (window.toastSystem) {
                window.toastSystem.showToast('Error loading programs. Please try again.', 'error');
            }
        });
}

// Show/hide loading indicator
function showLoading(isLoading) {
    let loadingIndicator = document.getElementById('loadingIndicator');
    
    if (!loadingIndicator && isLoading) {
        // Create loading indicator if it doesn't exist
        loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loadingIndicator';
        loadingIndicator.className = 'text-center py-3';
        loadingIndicator.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading programs...</p>
        `;
        
        // Insert before the programs list
        const programsList = document.getElementById('programsList');
        programsList.parentNode.insertBefore(loadingIndicator, programsList);
    } else if (loadingIndicator) {
        // Show/hide existing indicator
        loadingIndicator.style.display = isLoading ? 'block' : 'none';
    }
}

// Updated clear filters to include countries
function clearFilters() {
    document.getElementById('universitySearch').value = '';
    clearCountrySelections(); // Clear country selections
    document.getElementById('favoritesFilter').value = '';
    document.getElementById('sortFilter').value = '';
    
    // Apply filters with empty values to reset
    applyFilters();
}

// Hide pagination when no results
function hidePagination() {
    const paginationContainer = document.querySelector('.row.mt-4');
    if (paginationContainer) {
        paginationContainer.style.display = 'none';
    }
}

// Show pagination when there are results
function showPagination() {
    const paginationContainer = document.querySelector('.row.mt-4');
    if (paginationContainer) {
        paginationContainer.style.display = 'block';
    }
}

// Handle bookmark icon clicks (updated from star to bookmark)
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
                // Update the bookmark appearance (instead of star)
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
                
            } else {
                // Show error message
                if (window.toastSystem) {
                    window.toastSystem.showToast(data.message || 'Error updating saved programs', 'error');
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            if (window.toastSystem) {
                window.toastSystem.showToast('Error updating saved programs', 'error');
            }
        })
        .finally(() => {
            // Re-enable the icon
            icon.style.pointerEvents = 'auto';
        });
    }
});

// Function to get CSRF token
function getCsrfToken() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrftoken') {
            return value;
        }
    }
    return '';
}
