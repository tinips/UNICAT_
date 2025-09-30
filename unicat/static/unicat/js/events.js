document.addEventListener('DOMContentLoaded', function() {

    
    
    // Setup para el modal de confirmación de eliminación
    const deleteModal = document.getElementById('deleteEventModal');
    if (deleteModal) {
        deleteModal.addEventListener('show.bs.modal', function (event) {
            // Botón que activó el modal
            const button = event.relatedTarget;
            
            // Extraer información de los atributos data-*
            const eventId = button.getAttribute('data-event-id');
            const eventTitle = button.getAttribute('data-event-title');
            
            // Actualizar el contenido del modal
            const eventNameSpan = deleteModal.querySelector('#delete-event-name');
            const confirmDeleteBtn = deleteModal.querySelector('#confirm-delete-btn');
            
            eventNameSpan.textContent = eventTitle;
            confirmDeleteBtn.setAttribute('data-event-id', eventId);
        });
        
        // Manejar la confirmación de eliminación
        const confirmDeleteBtn = deleteModal.querySelector('#confirm-delete-btn');
        confirmDeleteBtn.addEventListener('click', function() {
            const eventId = this.getAttribute('data-event-id');
            
            // Mostrar estado de carga
            this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';
            this.disabled = true;
            
            // Ocultar el modal
            const bsDeleteModal = bootstrap.Modal.getInstance(deleteModal);
            bsDeleteModal.hide();
            
            // Eliminar backdrop y limpiar estilos de modal
            setTimeout(() => {
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) {
                    backdrop.remove();
                }
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            }, 300);
            
            // Redireccionar a la URL de eliminación
            window.location.href = `/events/${eventId}/delete?confirmed=true`;
        });
    }
    
    // Verificar si estamos en la página de eventos
    const eventsContainer = document.getElementById('events-container');
    if (eventsContainer) {
        infiniteScrollEvents();
    }
});

function infiniteScrollEvents() {
    console.log("Iniciando infiniteScrollEvents");
    
    if (typeof Vue === 'undefined') {
        console.error("Vue no está definido. Asegúrate de cargar Vue.js antes que events.js");
        return;
    }
    
    const Event = {
        data() {
            return {
                events: [],
                currentPage: 1,
                isLoading: false,
                hasMorePages: true,
                currentUser: null,
                universityFilter: '',
                typeFilter: '',
                monthFilter: '',       
                yearFilter: '',        
                isFiltering: false,
                isClearing: false,
                hasFilters: false,
                    // Add has_permissions property
                has_permissions: false,
                interestedFilter: '',
            }
        },
        delimiters: ['[[', ']]'],
        template: `
            <div>
                <div v-if="events.length === 0 && !isClearing && !isFiltering" class="empty-events-container text-center py-5">
                    <div class="text-center mb-4">
                        <i class="fas fa-calendar-times fa-5x" style="opacity: 0.6; color: #4A90E2;"></i>
                    </div>
                    <h3 class="mb-3">No upcoming events</h3>
                    <p v-if="hasFilters" class="text-muted mb-4">No events match the current filters. Try adjusting your search criteria.</p>
                    <p v-else class="text-muted mb-4">Wait for the institutions to create events!</p>
                    <a href="/events/create" class="btn btn-primary btn-lg" v-if="has_permissions">
                        <i class="fas fa-plus"></i> Create Event
                    </a>
                </div>

                <div class="row g-4">
                    <div v-for="event in events" :key="event.id" class="col-md-6 col-lg-4 mb-4">
                        <div class="event-card h-100">
                            <div class="event-image-container">
                                <img v-if="event.image_url" :src="event.image_url" class="event-image" :alt="event.title">
                                <div v-else class="event-image-placeholder">
                                    <i class="fas fa-calendar-alt fa-3x"></i>
                                </div>
                                <div class="event-date">
                                    <span class="event-day">[[formatDay(event.date)]]</span>
                                    <span class="event-month">[[formatMonth(event.date)]]</span>
                                </div>
                                <!-- ✅ Add participants count display -->
                                    <!-- Add participants count display -->
                                <div class="event-participants-badge" v-if="event.participants_count > 0">
                                    <i class="fas fa-users"></i> [[event.participants_count]]
                                </div>
                            </div>
                            <div class="event-content">
                                <div class="event-info">
                                    <h3 class="event-title">[[event.title]]</h3>
                                    <div class="event-meta">
                                        <div class="event-time">
                                            <i class="far fa-clock"></i> [[formatTime(event.date)]]
                                        </div>
                                        <div class="event-location">
                                            <i class="fas fa-map-marker-alt"></i> [[event.location]]
                                        </div>
                                        <div v-if="event.university_display" class="event-university">
                                            <i class="fas fa-university"></i> [[event.university_display]]
                                        </div>
                                        <div>
                                        <i class="fas fa-user me-1"></i><span class="text-muted">Organized by</span>
                                        <a :href="'/profile/' + event.created_by_username + '/'" 
                                           class="text-decoration-none ms-1 fw-bold text-primary">
                                            [[event.created_by_username]]
                                        </a>
                                        </div>
                                    </div>
                                </div>
                                <div class="event-actions">
                                    <a :href="'/events/' + event.id" class="btn btn-primary btn-block">
                                        <i class="fas fa-info-circle"></i> View Details
                                    </a>
                                    
                                    <!-- ✅ Botons d'interès millorats - Mateix estil que event_detail -->
                                    <!-- Botons d'interès millorats - Mateix estil que event_detail -->
                                    <div v-if="currentUser && currentUser !== event.created_by_username && !has_permissions" class="mt-2">
                                        <button v-if="event.is_user_participating" 
                                                class="btn btn-outline-primary btn-sm btn-interested"
                                                @click="leaveEvent(event.id)"
                                                :disabled="event.loading">
                                            <span v-if="event.loading" class="spinner-border spinner-border-sm me-1"></span>
                                            <i v-else class="fas fa-check me-1"></i> Interested
                                        </button>
                                        <button v-else 
                                                class="btn btn-outline-primary btn-sm btn-interested"
                                                @click="joinEvent(event.id)"
                                                :disabled="event.loading">
                                            <span v-if="event.loading" class="spinner-border spinner-border-sm me-1"></span>
                                            <i v-else class="far fa-heart me-1"></i> Interested?
                                        </button>
                                    </div>
                                    
                                    <!-- Edit/Delete buttons for organizers -->
                                    <div v-if="currentUser === event.created_by_username" class="events-actions-right d-flex gap-2 mt-2">
                                        <a :href="'/events/' + event.id + '/edit?source=events'" class="btn btn-outline-primary btn-action">
                                            <i class="fas fa-edit me-1"></i> Edit
                                        </a>
                                        <button class="btn btn-outline-danger delete-event-btn btn-action" 
                                                data-bs-toggle="modal" data-bs-target="#deleteEventModal"
                                                :data-event-id="event.id" :data-event-title="event.title"
                                                @click="setupDeleteModal(event)">
                                            <i class="fas fa-trash me-1"></i> Delete
                                        </button>
                                    </div>
                                </div>
                                
                                
                            </div>
                        </div>
                    </div>
                </div>
                
                <div v-if="isLoading && !isClearing" class="text-center my-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        `,
        mounted() {
            console.log("Componente Vue montado");
            // Initialize filters from existing elements
            this.initializeFilters();
            
            // Load initial events
            this.getEvents();
            
            // Set up scroll event
            window.onscroll = () => {
                let bottomOfWindow = (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100;
                if (bottomOfWindow && !this.isLoading && this.hasMorePages) {
                    this.currentPage++;
                    this.getEvents();
                }
            }
            
            // Add filter listeners
            this.setupFilterListeners();
        },
        methods: {
            initializeFilters() {
                // Get initial filter values
                const universityFilter = document.getElementById('universityFilter');
                const typeFilter = document.getElementById('typeFilter');
                const monthFilter = document.getElementById('monthFilter');   
                const yearFilter = document.getElementById('yearFilter');     
                const interestedFilter = document.getElementById('interestedFilter');
                
                if (universityFilter) this.universityFilter = universityFilter.value;
                if (typeFilter) this.typeFilter = typeFilter.value;
                if (monthFilter) this.monthFilter = monthFilter.value;      
                if (yearFilter) this.yearFilter = yearFilter.value; 
                if (interestedFilter) this.interestedFilter = interestedFilter.value;        
                
                // Set initial hasFilters value
                this.updateFilterStatus();
            },
            
            setupFilterListeners() {
                // Connect filter events
                const universityFilter = document.getElementById('universityFilter');
                const typeFilter = document.getElementById('typeFilter');
                const monthFilter = document.getElementById('monthFilter');   
                const yearFilter = document.getElementById('yearFilter');    
                const interestedFilter = document.getElementById('interestedFilter');
                
                if (universityFilter) {
                    universityFilter.addEventListener('change', () => {
                        this.universityFilter = universityFilter.value;
                        this.updateFilterStatus();
                        this.filterWithoutScrollReset();
                    });
                }
                
                if (typeFilter) {
                    typeFilter.addEventListener('change', () => {
                        this.typeFilter = typeFilter.value;
                        this.updateFilterStatus();
                        this.filterWithoutScrollReset();
                    });
                }
                
                // Añadir listeners para los nuevos filtros
                if (monthFilter) {
                    monthFilter.addEventListener('change', () => {
                        this.monthFilter = monthFilter.value;
                        this.updateFilterStatus();
                        this.filterWithoutScrollReset();
                    });
                }
                
                if (yearFilter) {
                    yearFilter.addEventListener('change', () => {
                        this.yearFilter = yearFilter.value;
                        this.updateFilterStatus();
                        this.filterWithoutScrollReset();
                    });
                }
                
                if (interestedFilter) {
                    interestedFilter.addEventListener('change', () => {
                        this.interestedFilter = interestedFilter.value;
                        this.updateFilterStatus();
                        this.filterWithoutScrollReset();
                    });
                }
            },
            
            updateFilterStatus() {
                this.hasFilters = !!(this.universityFilter || this.typeFilter || this.monthFilter || this.yearFilter);
            },
            
            filterWithoutScrollReset(isClearing) {
                // Activate filtering state
                this.isFiltering = true;
                this.isClearing = isClearing || false;
                
                // Save scroll position and document height
                const scrollY = window.scrollY;
                const oldHeight = document.body.scrollHeight;
                
                // Create temporary element to avoid abrupt size changes
                const tempElement = document.createElement('div');
                tempElement.style.height = oldHeight + 'px';
                tempElement.style.position = 'absolute';
                tempElement.style.top = '0';
                tempElement.style.left = '0';
                tempElement.style.width = '100%';
                tempElement.style.pointerEvents = 'none';
                tempElement.style.zIndex = '-1';
                document.body.appendChild(tempElement);
                
                // Show subtle loading indicator
                const loadingIndicator = document.createElement('div');
                loadingIndicator.innerHTML = `
                    <div class="position-fixed top-50 start-50 translate-middle bg-white rounded p-2" style="z-index: 1050; opacity: 0.8;">
                        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                        <span class="ms-2 small">${isClearing ? 'Clearing filters...' : 'Filtering...'}</span>
                    </div>
                `;
                document.body.appendChild(loadingIndicator);
                
                // Reset state and load with new filters
                this.events = [];
                this.currentPage = 1;
                this.hasMorePages = true;
                
                // Load new events without changing scroll position
                this.getEvents().then(() => {
                    // Remove loading indicator and temp element
                    document.body.removeChild(loadingIndicator);
                    document.body.removeChild(tempElement);
                    this.isFiltering = false;
                    this.isClearing = false;
                }).catch(error => {
                    console.error("Error during filtering:", error);
                    this.isFiltering = false;
                    this.isClearing = false;
                });
            },
            
            getEvents() {
                if (this.isLoading || !this.hasMorePages) return Promise.resolve();
                
                this.isLoading = true;
                
                // Fix URL - change from /get_events/ to /api/events
                let url = `/api/events?page=${this.currentPage}`;
                
                // Add filters if present
                if (this.universityFilter) url += `&university=${encodeURIComponent(this.universityFilter)}`;
                if (this.typeFilter) url += `&type=${encodeURIComponent(this.typeFilter)}`;
                if (this.monthFilter) url += `&month=${encodeURIComponent(this.monthFilter)}`;  
                if (this.yearFilter) url += `&year=${encodeURIComponent(this.yearFilter)}`;     
                if (this.interestedFilter) url += `&interested=${encodeURIComponent(this.interestedFilter)}`;
                
                return fetch(url)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! Status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        this.hasMorePages = !!data.next;
                        
                        if (data.current_user) {
                            this.currentUser = data.current_user;
                        }
                        
                        // ✅ Set has_permissions from API response
                        // Set has_permissions from API response
                        if (data.is_institution !== undefined) {
                            this.has_permissions = data.is_institution;
                        }
                        
                        if (data.results && data.results.length > 0) {
                            this.events = [...this.events, ...data.results];
                        }
                        
                        this.isLoading = false;
                    })
                    .catch(error => {
                        console.error("Error fetching events:", error);
                        this.isLoading = false;
                    });
            },
            
            // ✅ Add join/leave event methods
            // Add join/leave event methods
            joinEvent(eventId) {
                fetch(`/events/${eventId}/join/`, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken'),
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Update event in the list
                        const eventIndex = this.events.findIndex(e => e.id === eventId);
                        if (eventIndex !== -1) {
                            this.events[eventIndex].is_user_participating = true;
                            this.events[eventIndex].participants_count = data.participants_count;
                        }
                        
                        // Show success message
                        if (window.showToast) {
                            window.showToast(data.message, 'success');
                        }
                    } else {
                        if (window.showToast) {
                            window.showToast(data.message, 'error');
                        }
                    }
                })
                .catch(error => {
                    console.error('Error joining event:', error);
                    if (window.showToast) {
                        window.showToast('Error joining event', 'error');
                    }
                });
            },
            
            leaveEvent(eventId) {
                fetch(`/events/${eventId}/leave/`, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken'),
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Update event in the list
                        const eventIndex = this.events.findIndex(e => e.id === eventId);
                        if (eventIndex !== -1) {
                            this.events[eventIndex].is_user_participating = false;
                            this.events[eventIndex].participants_count = data.participants_count;
                        }
                        
                        // Show success message
                        if (window.showToast) {
                            window.showToast(data.message, 'success');
                        }
                    } else {
                        if (window.showToast) {
                            window.showToast(data.message, 'error');
                        }
                    }
                })
                .catch(error => {
                    console.error('Error leaving event:', error);
                    if (window.showToast) {
                        window.showToast('Error leaving event', 'error');
                    }
                });
            },
            
            formatDay(dateString) {
                const date = new Date(dateString);
                return date.getDate();
            },
            
            formatMonth(dateString) {
                const date = new Date(dateString);
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return months[date.getMonth()];
            },
            
            formatTime(dateString) {
                const date = new Date(dateString);
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            },
            
            setupDeleteModal(event) {
                const deleteEventName = document.getElementById('delete-event-name');
                const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
                
                if (deleteEventName) {
                    deleteEventName.textContent = event.title;
                }
                
                if (confirmDeleteBtn) {
                    confirmDeleteBtn.setAttribute('data-event-id', event.id);
                }
            }
        }
    };
    
    const container = document.getElementById('events-container');
    if (container) {
        console.log("Montando Vue en el contenedor events-container");
        try {
            Vue.createApp(Event).mount('#events-container');
            console.log("Vue montado correctamente");
        } catch (error) {
            console.error("Error al montar Vue:", error);
        }
    } else {
        console.error("No se encontró el contenedor events-container");
    }
}

function clearEventFilters() {
    document.getElementById('universityFilter').value = '';
    document.getElementById('typeFilter').value = '';
    document.getElementById('monthFilter').value = '';  
    document.getElementById('yearFilter').value = '';   
        
    // Get the Vue instance and update filters
    const container = document.getElementById('events-container');
    if (container && container.__vue_app__) {
        const vueApp = container.__vue_app__;
        const componentInstance = vueApp._instance.proxy;
        
        componentInstance.universityFilter = '';
        componentInstance.typeFilter = '';
        componentInstance.monthFilter = '';  
        componentInstance.yearFilter = '';   
        componentInstance.filterWithoutScrollReset(true);
    }
}



// Helper function to get CSRF token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// ✅ Handle join/leave event functionality for event detail page
// Handle join/leave event functionality for event detail page
document.addEventListener('DOMContentLoaded', function() {
    // Join event button
    const joinBtn = document.getElementById('join-event-btn');
    if (joinBtn) {
        joinBtn.addEventListener('click', function() {
            const eventId = this.dataset.eventId;
            const eventTitle = this.dataset.eventTitle;
            
            fetch(`/events/${eventId}/join/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update UI
                    this.outerHTML = `
                        <button class="btn btn-outline-primary btn-lg" id="leave-event-btn" 
                                data-event-id="${eventId}" data-event-title="${eventTitle}">
                            <i class="fas fa-check me-2"></i>Interested
                        </button>
                    `;
                    
                    // Update participants count
                    const participantsCountEl = document.getElementById('participants-count');
                    if (participantsCountEl) {
                        participantsCountEl.textContent = data.participants_count;
                    }
                    
                    // Show success message
                    if (window.showToast) {
                        window.showToast(data.message, 'success');
                    }
                    
                    // Reload page to show updated participants list
                    setTimeout(() => location.reload(), 1000);
                } else {
                    if (window.showToast) {
                        window.showToast(data.message, 'error');
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
                if (window.showToast) {
                    window.showToast('Error joining event', 'error');
                }
            });
        });
    }
    
    // Leave event button (using event delegation since button is dynamically created)
    document.addEventListener('click', function(e) {
        if (e.target.id === 'leave-event-btn' || e.target.closest('#leave-event-btn')) {
            const btn = e.target.id === 'leave-event-btn' ? e.target : e.target.closest('#leave-event-btn');
            const eventId = btn.dataset.eventId;
            const eventTitle = btn.dataset.eventTitle;
            
            fetch(`/events/${eventId}/leave/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update UI
                    btn.outerHTML = `
                        <button class="btn btn-outline-primary btn-lg" id="join-event-btn" 
                                data-event-id="${eventId}" data-event-title="${eventTitle}">
                            <i class="far fa-heart me-2"></i>Interested?
                        </button>
                    `;
                    
                    // Update participants count
                    const participantsCountEl = document.getElementById('participants-count');
                    if (participantsCountEl) {
                        participantsCountEl.textContent = data.participants_count;
                    }
                    
                    // Show success message
                    if (window.showToast) {
                        window.showToast(data.message, 'success');
                    }
                    
                    // Reload page to show updated participants list
                    setTimeout(() => location.reload(), 1000);
                } else {
                    if (window.showToast) {
                        window.showToast(data.message, 'error');
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
                if (window.showToast) {
                    window.showToast('Error leaving event', 'error');
                }
            });
        }
    });
});