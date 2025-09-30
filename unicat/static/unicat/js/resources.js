function clearSearch() {
    // Clear filter fields
    document.getElementById('resourceSearch').value = '';
    
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) categoryFilter.value = '';
    
    const fieldStudyFilter = document.getElementById('fieldStudyFilter');
    if (fieldStudyFilter) fieldStudyFilter.value = '';
    
    // Hide search results info
    const searchResultsInfo = document.getElementById('searchResultsInfo');
    if (searchResultsInfo) searchResultsInfo.style.display = 'none';
    
    // Obtener el componente Vue y actualizar sus propiedades directamente
    const container = document.getElementById('resources-container');
    if (container && container.__vue_app__) {
        const vueApp = container.__vue_app__;
        const componentInstance = vueApp._instance.proxy;
        
        // Actualizar las propiedades directamente
        componentInstance.searchText = '';
        componentInstance.categoryFilter = '';
        componentInstance.fieldStudyFilter = '';
        
        // Hacer solo una llamada a filterWithoutScrollReset
        componentInstance.filterWithoutScrollReset(isClearing = true);
    } else {
        // Fallback por si no se puede acceder a la instancia de Vue
        const keyupEvent = new Event('keyup');
        const searchInput = document.getElementById('resourceSearch');
        if (searchInput) searchInput.dispatchEvent(keyupEvent);
    }
}

// Setup para la página de detalles - solo se ejecuta si estamos en la página de detalles
function setupCommentForm() {
    const mainCommentForm = document.querySelector('form[action*="add_comment"]:not([id*="reply"])');
    
    if (mainCommentForm) {
        mainCommentForm.addEventListener('submit', function() {
            const submitButton = this.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...';
                submitButton.disabled = true;
                
                // Allow form submission to proceed normally
                setTimeout(function() {
                    submitButton.disabled = false;
                }, 3000); // In case of error and page doesn't reload
            }
        });
    }
}

// Setup para la página de detalles - para botones de respuesta
function setupReplyButtons() {
    // Obtenir tots els botons de resposta
    const replyButtons = document.querySelectorAll('.reply-toggle');
    
    // Afegir event listeners als botons de resposta
    replyButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault(); 
            const commentId = this.getAttribute('data-comment-id');
            
            const replyForm = document.getElementById(`reply-form-${commentId}`);
            if (replyForm) {
                // Toggle visibility
                const currentDisplay = window.getComputedStyle(replyForm).display;
                replyForm.style.display = currentDisplay === 'none' ? 'block' : 'none';
            }
        });
    });
    
    // Configurar botons de cancel·lar resposta
    const cancelButtons = document.querySelectorAll('.cancel-reply');
    cancelButtons.forEach(button => {
        button.addEventListener('click', function() {
            const commentId = this.getAttribute('data-comment-id');
            const replyForm = document.getElementById(`reply-form-${commentId}`);
            if (replyForm) {
                replyForm.style.display = 'none';
            }
        });
    });
}

// Setup per a la pàgina de detalls - accions de comentaris
function setupCommentActions() {
    // Configure edit comment buttons
    const editCommentButtons = document.querySelectorAll('.edit-comment-btn, .edit-reply-btn');
    const editCommentModal = document.getElementById('editCommentModal');
    
    if (editCommentModal && typeof bootstrap !== 'undefined') {
        const editModal = new bootstrap.Modal(editCommentModal);
        
        editCommentButtons.forEach(button => {
            button.addEventListener('click', function(event) {
                event.preventDefault();
                
                // Obtain button data
                const commentId = this.getAttribute('data-comment-id') || this.getAttribute('data-reply-id');
                const commentText = this.getAttribute('data-comment-text') || this.getAttribute('data-reply-text');
                const isReply = this.classList.contains('edit-reply-btn');
                if (isReply) {
                    editCommentModalLabel.textContent = 'Edit Reply';
                } else {
                    editCommentModalLabel.textContent = 'Edit Comment';
                }

                // Configure edit form
                const editCommentForm = document.getElementById('editCommentForm');
                const editCommentId = document.getElementById('edit-comment-id');
                const editCommentText = document.getElementById('edit-comment-text');
                
                if (editCommentForm && editCommentId && editCommentText) {
                    editCommentId.value = commentId;
                    editCommentText.value = commentText.replace(/<br\s*\/?>/g, "\n").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
                    
                    // Extract resource ID from URL path
                    let resourceId = null;
                    const path = window.location.pathname;
                    const resourceMatch = path.match(/resources\/(\d+)/);
                    if (resourceMatch && resourceMatch[1]) {
                        resourceId = resourceMatch[1];
                        editCommentForm.action = `/edit_comment/${resourceId}/${isReply ? 'reply' : 'comment'}/${commentId}/`;
                        editModal.show();
                    }
                }
            });
        });
    }

    // Configure delete comment buttons
    const deleteCommentButtons = document.querySelectorAll('.delete-comment-btn');
    const deleteCommentModal = document.getElementById('deleteCommentModal');
    
    if (deleteCommentModal && typeof bootstrap !== 'undefined') {
        const deleteModal = new bootstrap.Modal(deleteCommentModal);
        
        deleteCommentButtons.forEach(button => {
            button.addEventListener('click', function(event) {
                event.preventDefault();
                
                // Obtain button data
                const commentId = this.getAttribute('data-comment-id');
                const commentType = this.getAttribute('data-comment-type') || 'comment';
                
                // Configure delete form
                const deleteCommentForm = document.getElementById('deleteCommentForm');
                const deleteCommentId = document.getElementById('delete-comment-id');
                const deleteCommentType = document.getElementById('delete-comment-type');
                const commentTypeText = document.getElementById('comment-type-text');
                
                if (deleteCommentForm && deleteCommentId && deleteCommentType && commentTypeText) {
                    deleteCommentId.value = commentId;
                    deleteCommentType.value = commentType;
                    commentTypeText.textContent = commentType === 'reply' ? 'reply' : 'comment';
                    
                    // Extract resource ID from URL path
                    let resourceId = null;
                    const path = window.location.pathname;
                    const resourceMatch = path.match(/resources\/(\d+)/);
                    if (resourceMatch && resourceMatch[1]) {
                        resourceId = resourceMatch[1];
                        deleteCommentForm.action = `/delete_comment/${resourceId}/${commentType}/${commentId}/`;
                        deleteModal.show();
                    }
                }
            });
        });
    }
}

// Setup para los botones de edición y eliminación en la página de detalles
function setupResourceDetailButtons() {
    const editButtons = document.querySelectorAll('.edit-resource-btn');
    const editForm = document.getElementById('editResourceForm');
    
    if (editButtons.length > 0 && editForm) {
        editButtons.forEach(button => {
            button.addEventListener('click', function() {
                const resourceId = this.getAttribute('data-resource-id');
                const description = this.getAttribute('data-description');
                const resourceType = this.getAttribute('data-type');
                const fieldStudy = this.getAttribute('data-field-study');
                
                console.log("Setting up edit modal with values:", {
                    resourceId,
                    description,
                    resourceType,
                    fieldStudy
                });
                
                const editResourceId = document.getElementById('edit-resource-id');
                const editDescription = document.getElementById('edit-description');
                const editCategory = document.getElementById('edit-category');
                const editFieldStudy = document.getElementById('edit-field-study');
                
                if (editResourceId && editDescription && editCategory && editFieldStudy) {
                    editResourceId.value = resourceId;
                    
                    // Asegurarse de que la descripción se establece correctament
                    editDescription.value = description || '';
                    
                    // També usar innerHTML per forçar l'actualització
                    if (description) {
                        editDescription.innerHTML = description;
                        editDescription.textContent = description;
                    }
                    
                    editCategory.value = resourceType;
                    editFieldStudy.value = fieldStudy;
                    
                    console.log("Field study dropdown set to:", fieldStudy);
                    console.log("Description set to:", description); // Debug
                    console.log("Current options:", Array.from(editFieldStudy.options).map(o => o.value));
                    
                    // Si el valor del camp d'estudi no coincideix amb cap opció, mostra un avís
                    if (Array.from(editFieldStudy.options).map(o => o.value).indexOf(fieldStudy) === -1) {
                        console.warn(`Warning: Field study value "${fieldStudy}" not found in options`);
                    }
                    
                    editForm.action = `/edit_resource/${resourceId}/1/`;
                }
                
                // Setup current file section
                const currentFileSection = document.getElementById('current-file-section');
                const currentFileName = document.getElementById('current-file-name');
                const deleteCheckbox = document.getElementById('delete-current-file');
                
                if (currentFileSection && currentFileName && deleteCheckbox) {
                    // Get current document info from the page
                    const documentElement = document.querySelector('.resource-detail-card h2');
                    const documentName = documentElement ? documentElement.textContent.trim() : '';
                    
                    if (documentName && documentName !== 'No document') {
                        currentFileSection.style.display = 'block';
                        currentFileName.textContent = documentName;
                        deleteCheckbox.checked = false;
                    } else {
                        currentFileSection.style.display = 'none';
                    }
                }
            });
        });
        
        editForm.addEventListener('submit', function() {
            const submitButton = this.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
                submitButton.disabled = true;
                
                // Restore the button in case of error
                setTimeout(function() {
                    if (submitButton.disabled) {
                        submitButton.disabled = false;
                        submitButton.innerHTML = 'Save Changes';
                    }
                }, 5000);
            }
        });
    }
    
    const deleteButtons = document.querySelectorAll('.delete-resource-btn');
    const deleteModal = document.getElementById('deleteResourceModal');
    const deleteResourceName = document.getElementById('delete-resource-name');
    
    if (deleteButtons.length > 0 && deleteModal) {
        const bsDeleteModal = new bootstrap.Modal(deleteModal);
        let currentResourceId = null;
        
        deleteButtons.forEach(button => {
            button.addEventListener('click', function() {
                currentResourceId = this.getAttribute('data-resource-id');
                const resourceName = this.getAttribute('data-resource-name');
                
                if (deleteResourceName) {
                    deleteResourceName.textContent = resourceName || 'this resource';
                }
                
                bsDeleteModal.show();
            });
        });
        
        // Configurar el botón de confirmación de eliminación
        const confirmButtons = document.querySelectorAll('#confirm-delete-btn, .delete-resource-detail');
        confirmButtons.forEach(button => {
            button.addEventListener('click', function() {
                if (!currentResourceId) return;
                
                // Cambiar apariencia del botón
                this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';
                this.disabled = true;
                
                // Cerrar el modal
                bsDeleteModal.hide();
                
                // Eliminar modal backdrop
                setTimeout(() => {
                    const backdrop = document.querySelector('.modal-backdrop');
                    if (backdrop) {
                        backdrop.remove();
                    }
                    document.body.classList.remove('modal-open');
                    document.body.style.overflow = '';
                    document.body.style.paddingRight = '';
                }, 300);
                
                // Realizar la solicitud de eliminación
                fetch(`/delete_resource/${currentResourceId}/`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                })
                .then(response => {
                    if (response.ok) {
                        // Verificar si estamos en la página de detalles
                        const isDetailPage = window.location.pathname.match(/\/resources\/\d+\/?$/);
                        if (isDetailPage) {
                            window.location.href = '/resources?action=delete&status=success';
                        } else {
                            window.location.href = '/resources?action=delete&status=success';
                        }
                    } else {
                        window.location.href = '/resources?action=delete&status=error';
                    }
                })
                .catch(error => {
                    console.error("Error deleting resource:", error);
                    window.location.href = '/resources?action=delete&status=error';
                });
            });
        });
    }
}

function infiniteScroll() {
    const Resource = {
        data() {
            return {
                resources: [],
                currentPage: 1,
                isLoading: false,
                isFiltering: false,
                hasMorePages: true,
                currentUser: null,
                searchText: '',
                categoryFilter: '',
                fieldStudyFilter: '',
                hasFilters: false
            }
        },
        delimiters: ['[[', ']]'],
        template: `
            <div>
                <div v-if="resources.length === 0 && !isFiltering" class="no-resources">
                    <p v-if="hasFilters">No resources match the current filters. Try adjusting your search criteria.</p>
                    <p v-else>No resources have been shared yet. Be the first to contribute!</p>
                </div>
                <div v-for="resource in resources" :key="resource.id" class="resource-card" :data-category="resource.type" :data-field-study="resource.field_of_study">
                    <div class="resource-info">
                        <div class="d-flex mb-2">
                            <div class="badge bg-info resource_type me-2" style="padding-bottom:7px">[[resource.type || "Uncategorized"]]</div>
                            <div class="badge bg-secondary field-study-badge">[[resource.field_of_study]]</div>
                        </div>
                        <h4 class="resource-title">
                            <p :class="{'no-document-title': !resource.document}">
                                [[resource.document ? resource.document.split('/').pop().substring(0, 50) : 'No document']]
                            </p>
                        </h4>
                        <p class="resource-description">[[resource.description ? (resource.description.substring(0, 150) + (resource.description.length > 150 ? '...' : '')) : '']]</p>
                        <div class="resource-meta">
                            <span class="resource-author">Shared by: <a :href="'/profile/' + resource.user_username + '/'" class="text-decoration-none fw-bold text-primary">[[resource.user_username]]</a></span>
                            <div class="resource-dates">
                                <div class="resource-date">Posted on [[formatDate(resource.timestamp)]]</div>
                                <div v-if="resource.edit_display" class="resource-edited">
                                    <i class="me-1"></i>[[resource.edit_display]]
                                </div>
                            </div>
                        </div>
                        <span class="resource-meta">[[resource.comments ? resource.comments.length : 0]] comment[[resource.comments && resource.comments.length !== 1 ? 's' : '']]</span>
                    </div>
                    <div class="resource-actions">
                        <a :href="'/resources/' + resource.id" class="btn btn-info action-btn view-btn resource_buttons">
                            <i class="fas fa-info-circle"></i> Detail View
                        </a>
                        
                        <a v-if="resource.document" :href="resource.document" class="btn btn-success action-btn download-btn resource_buttons" target="_blank">
                            <i class="fas fa-download"></i> Download
                        </a>
                        
                        <button v-if="currentUser === resource.user_username" 
                                class="btn btn-warning action-btn edit-resource-btn resource_buttons" 
                                :data-resource-id="resource.id" 
                                :data-description="resource.description" 
                                :data-type="resource.type"
                                :data-field-study="resource.field_of_study"
                                data-bs-toggle="modal"
                                data-bs-target="#editResourceModal"
                                @click="setupEditModal(resource)">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        
                        <button v-if="currentUser === resource.user_username" 
                                class="btn btn-danger action-btn delete-resource-btn resource_buttons" 
                                :data-resource-id="resource.id"
                                :data-resource-name="resource.document ? resource.document.split('/').pop().substring(0, 30) : 'this resource'"
                                data-bs-toggle="modal"
                                data-bs-target="#deleteResourceModal"
                                @click="setupDeleteModal(resource)">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `,
        mounted() {
            // Inicialitzar els filtres desde els elements existents
            this.initializeFilters();
            
            // Cargar recursos inicials
            this.getResources();
            
            // Configurar el evento de scroll
            window.onscroll = () => {
                let bottomOfWindow = (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100;
                if (bottomOfWindow && !this.isLoading && this.hasMorePages) {
                    this.currentPage++;
                    this.getResources();
                }
            }
            
            // Agregar listeners para los filtros
            this.setupFilterListeners();
        },
        methods: {
            initializeFilters() {
                // Obtener valores iniciales de los filtres
                const searchInput = document.getElementById('resourceSearch');
                const categoryFilter = document.getElementById('categoryFilter');
                const fieldStudyFilter = document.getElementById('fieldStudyFilter');
                
                if (searchInput) this.searchText = searchInput.value.toLowerCase();
                if (categoryFilter) this.categoryFilter = categoryFilter.value;
                if (fieldStudyFilter) this.fieldStudyFilter = fieldStudyFilter.value;
                
                // Set initial hasFilters value
                this.updateFilterStatus();
            },
            
            setupFilterListeners() {
                // Conectar los eventos de los filters existents
                const searchInput = document.getElementById('resourceSearch');
                const categoryFilter = document.getElementById('categoryFilter');
                const fieldStudyFilter = document.getElementById('fieldStudyFilter');
                
                // Añadir debounce para el campo de búsqueda
                let debounceTimer;
                
                if (searchInput) {
                    searchInput.addEventListener('keyup', () => {
                        clearTimeout(debounceTimer);
                        debounceTimer = setTimeout(() => {
                            this.searchText = searchInput.value.toLowerCase();
                            // Update hasFilters status
                            this.updateFilterStatus();
                            this.filterWithoutScrollReset();
                        }, 300);
                    });
                }
                
                if (categoryFilter) {
                    categoryFilter.addEventListener('change', () => {
                        this.categoryFilter = categoryFilter.value;
                        // Update hasFilters status
                        this.updateFilterStatus();
                        this.filterWithoutScrollReset();
                    });
                }
                
                if (fieldStudyFilter) {
                    fieldStudyFilter.addEventListener('change', () => {
                        this.fieldStudyFilter = fieldStudyFilter.value;
                        // Update hasFilters status
                        this.updateFilterStatus();
                        this.filterWithoutScrollReset();
                    });
                }
            },
            
            // New method to update filter status
            updateFilterStatus() {
                this.hasFilters = !!(this.searchText || this.categoryFilter || this.fieldStudyFilter);
            },
            
            filterWithoutScrollReset(isClearing) {
                // Activar estado de filtrado
                this.isFiltering = true;
                
                // Guardar posición exacta del scroll y altura del documento
                const scrollY = window.scrollY;
                const oldHeight = document.body.scrollHeight;
                
                // Crear un contenedor temporal per evitar canvis de mida bruscos
                const tempElement = document.createElement('div');
                tempElement.style.height = oldHeight + 'px';
                tempElement.style.position = 'absolute';
                tempElement.style.top = '0';
                tempElement.style.left = '0';
                tempElement.style.width = '100%';
                tempElement.style.pointerEvents = 'none';
                tempElement.style.zIndex = '-1';
                document.body.appendChild(tempElement);
                
                // Mostrar un indicador de carga sutil
                const loadingIndicator = document.createElement('div');
                loadingIndicator.innerHTML = `
                    <div class="position-fixed top-50 start-50 translate-middle bg-white rounded p-2" style="z-index: 1050; opacity: 0.8;">
                        <div class="spinner-border spinner-border-sm text-primary" role="status">
                
                        </div>
                        <span class="ms-2 small">${isClearing ? 'Clearing filters...' : 'Filtering...'}</span>
                    </div>
                `;
                document.body.appendChild(loadingIndicator);
                
                // Reiniciar el estado i carregar amb els nous filtres
                this.resources = [];
                this.currentPage = 1;
                this.hasMorePages = true;
                
                // Cargar nous recursos sense canviar la posició del scroll
                this.getResources().then(() => {
                    // Eliminar indicador de carga i el element temporal
                    document.body.removeChild(loadingIndicator);
                    document.body.removeChild(tempElement);
                    this.isFiltering = false;  // Desactivar estado de filtrado
                }).catch(error => {
                    console.error("Error during filtering:", error);
                    this.isFiltering = false;  // Asegurar que se desactive incluso con errores
                });
            },
            
            getResources() {
                if (this.isLoading || !this.hasMorePages) return Promise.resolve();
                
                this.isLoading = true;
                
                // Construir URL amb paràmetres de filtre
                let url = `/get_resources/?page=${this.currentPage}`;
                
                // Afegir filtres si estan presents
                if (this.searchText) url += `&search=${encodeURIComponent(this.searchText)}`;
                if (this.categoryFilter) url += `&category=${encodeURIComponent(this.categoryFilter)}`;
                if (this.fieldStudyFilter) url += `&field_study=${encodeURIComponent(this.fieldStudyFilter)}`;
                
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
                        
                        if (data.results && data.results.length > 0) {
                            this.resources = [...this.resources, ...data.results];
                        }
                        
                        this.isLoading = false;
                    })
                    .catch(error => {
                        console.error("Error fetching resources:", error);
                        this.isLoading = false;
                    });
            },
            
            formatDate(dateString) {
                const date = new Date(dateString);
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
            },
            
            setupEditModal(resource) {
                // Manually set up the edit modal when the edit button is clicked
                const editResourceId = document.getElementById('edit-resource-id');
                const editDescription = document.getElementById('edit-description');
                const editCategory = document.getElementById('edit-category');
                const editFieldStudy = document.getElementById('edit-field-study');
                const editForm = document.getElementById('editResourceForm');
                
                if (editResourceId && editDescription && editCategory && editFieldStudy && editForm) {
                    console.log("Setting up edit modal for resource:", resource);
                    editResourceId.value = resource.id;
                    editDescription.value = resource.description || '';
                    editCategory.value = resource.type || '';
                    editFieldStudy.value = resource.field_of_study || '';
                    
                    // Set the form action
                    editForm.action = `/edit_resource/${resource.id}/0/`;
                }
                
                // Quan s'obre el modal d'edició
                // Mostrar informació del fitxer actual
                const currentFileSection = document.getElementById('current-file-section');
                const currentFileName = document.getElementById('current-file-name');
                const deleteCheckbox = document.getElementById('delete-current-file');
                
                if (resource.document && resource.document.trim() !== '') {
                    // Mostrar secció del fitxer actual
                    currentFileSection.style.display = 'block';
                    
                    // Extreure nom del fitxer de la URL
                    const fileName = resource.document.split('/').pop();
                    currentFileName.textContent = fileName;
                    
                    // Reset checkbox
                    deleteCheckbox.checked = false;
                } else {
                    // Amagar secció si no hi ha fitxer
                    currentFileSection.style.display = 'none';
                }
            },
            
            setupDeleteModal(resource) {
                const deleteResourceName = document.getElementById('delete-resource-name');
                const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
                
                if (deleteResourceName) {
                    const resourceName = resource.document ? 
                        resource.document.split('/').pop().substring(0, 30) : 
                        'this resource';
                    deleteResourceName.textContent = resourceName;
                }
                
                if (confirmDeleteBtn) {
                    // Configurar el botón de confirmación
                    confirmDeleteBtn.setAttribute('data-resource-id', resource.id);
                    
                    const existingListener = confirmDeleteBtn._deleteListener;
                    if (existingListener) {
                        confirmDeleteBtn.removeEventListener('click', existingListener);
                    }
                    
                    const deleteListener = () => this.confirmDelete(resource.id);
                    confirmDeleteBtn._deleteListener = deleteListener;
                    confirmDeleteBtn.addEventListener('click', deleteListener);
                }
            },
            
            confirmDelete(resourceId) {
                const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
                const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteResourceModal'));
                
                if (confirmDeleteBtn) {
                    confirmDeleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';
                    confirmDeleteBtn.disabled = true;
                }
                
                if (deleteModal) {
                    deleteModal.hide();
                    
                    setTimeout(() => {
                        const backdrop = document.querySelector('.modal-backdrop');
                        if (backdrop) {
                            backdrop.remove();
                        }
                        document.body.classList.remove('modal-open');
                        document.body.style.overflow = '';
                        document.body.style.paddingRight = '';
                    }, 300);
                }
                
                fetch(`/delete_resource/${resourceId}/`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                })
                .then(response => {
                    if (response.ok) {
                        window.location.href = '/resources?action=delete&status=success';
                    } else {
                        window.location.href = '/resources?action=delete&status=error';
                    }
                })
                .catch(error => {
                    console.error("Error deleting resource:", error);
                    window.location.href = '/resources?action=delete&status=error';
                });
            },
        }
    };
    
    // Mount to the container element
    const container = document.getElementById('resources-container');
    if (container) {
        Vue.createApp(Resource).mount('#resources-container');
    }
}

// Función principal per inicialitzar la aplicació
function initializeApp() {
    // Verificar en qué página estamos
    const isResourceDetails = window.location.pathname.match(/\/resources\/\d+\/?$/);
    const isResourcesList = document.getElementById('resources-container');

    // Inicializar components según la página
    if (isResourceDetails) {
        // Estamos en la página de detalles de un recurso
        setupCommentForm();
        setupReplyButtons();
        setupCommentActions();
        setupResourceDetailButtons(); // Añadir esta línea
    }
    
    if (isResourcesList) {
        // Estamos en la página principal de recursos
        infiniteScroll();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

