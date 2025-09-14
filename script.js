// Enhanced Menu Translator with Modern UI
class MenuTranslator {
    constructor() {
        this.selectedFiles = [];
        this.currentMenuData = null;
        this.swiper = null;
        this.currentView = 'grid';
        this.touchStartY = 0;
        this.touchStartX = 0;
        this.isScrolling = false;
        
        this.init();
    }

    init() {
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeMobileOptimizations();
        this.initializeSwiper();
    }

    initializeElements() {
        this.elements = {
            uploadArea: document.getElementById('uploadArea'),
            fileInput: document.getElementById('fileInput'),
            cameraInput: document.getElementById('cameraInput'),
            previewContainer: document.getElementById('previewContainer'),
            photoGrid: document.getElementById('photoGrid'),
            swiperWrapper: document.getElementById('swiperWrapper'),
            photoSwiper: document.getElementById('photoSwiper'),
            menuForm: document.getElementById('menuForm'),
            analyzeBtn: document.getElementById('analyzeBtn'),
            resultsSection: document.getElementById('resultsSection'),
            resultsContent: document.getElementById('resultsContent'),
            downloadBtn: document.getElementById('downloadBtn')
        };
    }

    initializeEventListeners() {
        // File input events
        this.elements.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.elements.cameraInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop events
        this.elements.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.elements.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.elements.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        this.elements.uploadArea.addEventListener('click', (e) => {
            // Only trigger file input if clicking on the upload area itself, not on buttons
            if (e.target === this.elements.uploadArea || e.target.closest('.upload-actions') === null) {
                this.elements.fileInput.click();
            }
        });
        
        // Touch events for mobile
        this.elements.uploadArea.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        this.elements.uploadArea.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
        
        // Form submission
        this.elements.menuForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Download button
        this.elements.downloadBtn.addEventListener('click', () => this.downloadResults());
    }

    initializeMobileOptimizations() {
        // Prevent zoom on input focus (iOS)
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                if (window.innerWidth <= 768) {
                    const viewport = document.querySelector('meta[name="viewport"]');
                    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
                }
            });
            
            input.addEventListener('blur', () => {
                if (window.innerWidth <= 768) {
                    const viewport = document.querySelector('meta[name="viewport"]');
                    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover');
                }
            });
        });
        
        // Add haptic feedback for supported devices
        if ('vibrate' in navigator) {
            const buttons = document.querySelectorAll('button, .upload-btn, .analyze-btn');
            buttons.forEach(button => {
                button.addEventListener('click', () => {
                    navigator.vibrate(50);
                });
            });
        }
    }

    initializeSwiper() {
        // Initialize Swiper for photo gallery
        this.swiper = new Swiper('.photo-swiper', {
            slidesPerView: 1,
            spaceBetween: 20,
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            loop: false,
            effect: 'slide',
            autoplay: false,
        });
    }

    // File handling methods
    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        this.addFiles(files);
    }

    handleDragOver(event) {
        event.preventDefault();
        this.elements.uploadArea.classList.add('dragover');
    }

    handleDragLeave(event) {
        event.preventDefault();
        this.elements.uploadArea.classList.remove('dragover');
    }

    handleDrop(event) {
        event.preventDefault();
        this.elements.uploadArea.classList.remove('dragover');
        
        const files = Array.from(event.dataTransfer.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length !== files.length) {
            this.showToast('Only image files are allowed.', 'error');
        }
        
        this.addFiles(imageFiles);
    }

    handleTouchStart(event) {
        this.touchStartY = event.touches[0].clientY;
        this.touchStartX = event.touches[0].clientX;
        this.isScrolling = false;
    }

    handleTouchEnd(event) {
        const touchEndY = event.changedTouches[0].clientY;
        const touchEndX = event.changedTouches[0].clientX;
        const deltaY = this.touchStartY - touchEndY;
        const deltaX = this.touchStartX - touchEndX;
        
        if (Math.abs(deltaY) < 10 && Math.abs(deltaX) < 10 && !this.isScrolling) {
            this.elements.fileInput.click();
        }
    }

    addFiles(files) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            this.showToast('Please select valid image files.', 'error');
            return;
        }
        
        // Add new files to existing selection
        this.selectedFiles = [...this.selectedFiles, ...imageFiles];
        
        // Limit to 10 files
        if (this.selectedFiles.length > 10) {
            this.selectedFiles = this.selectedFiles.slice(0, 10);
            this.showToast('Maximum 10 images allowed. Only the first 10 will be processed.', 'warning');
        }
        
        this.updatePreview();
        this.showToast(`${imageFiles.length} photo(s) added successfully!`, 'success');
        
        // Haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate([50, 50, 50]);
        }
    }

    updatePreview() {
        if (this.selectedFiles.length === 0) {
            this.elements.previewContainer.style.display = 'none';
            return;
        }
        
        this.elements.previewContainer.style.display = 'block';
        this.renderPhotoGrid();
        this.renderSwiper();
    }

    renderPhotoGrid() {
        this.elements.photoGrid.innerHTML = '';
        
        this.selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const photoItem = document.createElement('div');
                photoItem.className = 'photo-item';
                photoItem.innerHTML = `
                    <div class="photo-wrapper">
                        <img src="${e.target.result}" alt="Photo ${index + 1}" loading="lazy">
                        <div class="photo-overlay">
                            <button class="remove-btn" onclick="menuTranslator.removeFile(${index})" title="Remove photo">
                                <i class="fas fa-times"></i>
                            </button>
                            <div class="photo-info">
                                <span class="photo-number">${index + 1}</span>
                                <span class="photo-size">${this.formatFileSize(file.size)}</span>
                            </div>
                        </div>
                    </div>
                `;
                this.elements.photoGrid.appendChild(photoItem);
            };
            reader.readAsDataURL(file);
        });
    }

    renderSwiper() {
        this.elements.swiperWrapper.innerHTML = '';
        
        this.selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const slide = document.createElement('div');
                slide.className = 'swiper-slide';
                slide.innerHTML = `
                    <div class="slide-content">
                        <img src="${e.target.result}" alt="Photo ${index + 1}">
                        <div class="slide-info">
                            <h4>Photo ${index + 1}</h4>
                            <p>${this.formatFileSize(file.size)}</p>
                        </div>
                    </div>
                `;
                this.elements.swiperWrapper.appendChild(slide);
            };
            reader.readAsDataURL(file);
        });
        
        // Update Swiper
        if (this.swiper) {
            this.swiper.update();
        }
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.updatePreview();
        this.showToast('Photo removed', 'info');
        
        // Haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(100);
        }
    }

    // Form submission
    async handleFormSubmit(event) {
        event.preventDefault();
        
        if (this.selectedFiles.length === 0) {
            this.showToast('Please select at least one image.', 'error');
            return;
        }
        
        // Check file sizes before upload
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB
        
        let totalSize = 0;
        for (const file of this.selectedFiles) {
            if (file.size > MAX_FILE_SIZE) {
                this.showToast(`File "${file.name}" is too large. Maximum size is 10MB per file.`, 'error');
                return;
            }
            totalSize += file.size;
        }
        
        if (totalSize > MAX_TOTAL_SIZE) {
            this.showToast('Total file size is too large. Maximum total size is 50MB.', 'error');
            return;
        }
        
        const formData = new FormData();
        
        // Add form fields
        formData.append('target_language', document.getElementById('targetLanguage').value);
        formData.append('allergy_info', document.getElementById('allergyInfo').value);
        formData.append('currency', document.getElementById('currency').value);
        
        // Add images
        this.selectedFiles.forEach(file => {
            formData.append('images', file);
        });
        
        this.setLoadingState(true);
        this.showToast('Analyzing menu...', 'info');
        
        // Retry mechanism
        const maxRetries = 3;
        let retryCount = 0;
        
        while (retryCount < maxRetries) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout
                
                const response = await fetch('/analyze_menu', {
                    method: 'POST',
                    body: formData,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    
                    // Handle specific error types
                    if (response.status === 413) {
                        throw new Error('File size too large. Please reduce image size and try again.');
                    } else if (response.status === 429) {
                        throw new Error('API quota exceeded. Please check your OpenAI billing and usage limits.');
                    } else if (response.status === 401) {
                        throw new Error('API authentication failed. Please check your OpenAI API key.');
                    } else if (response.status >= 500) {
                        // Server error - retry
                        throw new Error(`Server error (${response.status}). Retrying...`);
                    } else {
                        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                    }
                }
                
                const data = await response.json();
                
                if (data.error) {
                    if (data.error_type === 'quota_exceeded') {
                        throw new Error('API quota exceeded. Please check your OpenAI billing and usage limits.');
                    } else if (data.error_type === 'auth_error') {
                        throw new Error('API authentication failed. Please check your OpenAI API key.');
                    } else {
                        throw new Error(data.error);
                    }
                }
                
                this.currentMenuData = data;
                this.displayResults(data);
                this.showToast('Menu analysis completed successfully!', 'success');
                
                // Haptic feedback for success
                if ('vibrate' in navigator) {
                    navigator.vibrate([100, 50, 100]);
                }
                
                return; // Success, exit retry loop
                
            } catch (error) {
                console.error(`Error analyzing menu (attempt ${retryCount + 1}):`, error);
                
                // Check if it's a retryable error
                const isRetryable = error.message.includes('Server error') || 
                                  error.message.includes('network') ||
                                  error.name === 'AbortError' ||
                                  error.message.includes('fetch');
                
                if (isRetryable && retryCount < maxRetries - 1) {
                    retryCount++;
                    this.showToast(`Upload failed. Retrying... (${retryCount}/${maxRetries})`, 'warning');
                    await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // Exponential backoff
                    continue;
                } else {
                    // Final error
                    let errorMessage = error.message;
                    if (error.name === 'AbortError') {
                        errorMessage = 'Upload timed out. Please try with smaller images or check your connection.';
                    }
                    
                    this.showToast(`Error analyzing menu: ${errorMessage}`, 'error');
                    
                    // Haptic feedback for error
                    if ('vibrate' in navigator) {
                        navigator.vibrate([200, 100, 200]);
                    }
                    break;
                }
            }
        }
        
        this.setLoadingState(false);
    }

    // Results display
    displayResults(data) {
        this.elements.resultsSection.style.display = 'block';
        this.elements.resultsContent.innerHTML = '';
        
        // Add summary info
        const summary = document.createElement('div');
        summary.className = 'summary-info';
        summary.innerHTML = `
            <div class="summary-card">
                <h3><i class="fas fa-info-circle"></i> Analysis Summary</h3>
                <div class="summary-details">
                    <div class="summary-item">
                        <span class="label">Target Language:</span>
                        <span class="value">${data.target_language || 'Not specified'}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Currency:</span>
                        <span class="value">${data.currency || 'Not specified'}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Your Allergies:</span>
                        <span class="value">${data.user_allergies && data.user_allergies.length > 0 ? data.user_allergies.join(', ') : 'None specified'}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Dishes Found:</span>
                        <span class="value">${data.dishes ? data.dishes.length : 0}</span>
                    </div>
                </div>
            </div>
        `;
        this.elements.resultsContent.appendChild(summary);
        
        // Add dishes
        if (data.dishes && data.dishes.length > 0) {
            data.dishes.forEach((dish, index) => {
                const dishCard = this.createDishCard(dish);
                dishCard.style.animationDelay = `${index * 0.1}s`;
                this.elements.resultsContent.appendChild(dishCard);
            });
        } else {
            const noDishes = document.createElement('div');
            noDishes.className = 'no-dishes';
            noDishes.innerHTML = `
                <div class="no-dishes-content">
                    <i class="fas fa-utensils"></i>
                    <h3>No dishes found</h3>
                    <p>We couldn't identify any dishes in the uploaded images. Please try with clearer menu photos.</p>
                </div>
            `;
            this.elements.resultsContent.appendChild(noDishes);
        }
        
        // Smooth scroll to results
        setTimeout(() => {
            this.elements.resultsSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    }

    createDishCard(dish) {
        const card = document.createElement('div');
        card.className = 'dish-card';
        
        // Allergy alert badge
        const allergyClass = dish.allergy_alert || 'unknown';
        const allergyText = {
            'safe': 'Safe',
            'contains': 'Contains Allergen',
            'may_contain': 'May Contain',
            'unknown': 'Unknown'
        }[allergyClass] || 'Unknown';
        
        // Price display
        const priceDisplay = dish.price && dish.price.amount > 0 
            ? `${dish.price.amount} ${dish.price.currency || ''}`.trim()
            : 'Price not available';
        
        // Kids friendly display
        const kidsFriendly = {
            'yes': 'Kid Friendly',
            'caution_spicy': 'Caution: Spicy',
            'no': 'Not Kid Friendly'
        }[dish.kids_friendly] || 'Unknown';
        
        // Spice level display
        const spiceLevel = dish.spice_level !== undefined ? `Spice Level: ${dish.spice_level}` : '';
        
        // Flavor profile tags
        const flavorTags = (dish.flavor_profile || []).map(flavor => 
            `<span class="tag flavor-${flavor}">${flavor}</span>`
        ).join('');
        
        // Ingredients display
        const ingredients = (dish.ingredients || []).join(', ') || 'Not specified';
        
        // Allergens display
        const allergens = (dish.dietary && dish.dietary.contains_allergens || []).join(', ') || 'None detected';
        
        card.innerHTML = `
            <div class="dish-header">
                <div>
                    <h3 class="dish-title">${dish.name?.translated || dish.name?.src || 'Unknown Dish'}</h3>
                    ${dish.name?.src && dish.name?.src !== dish.name?.translated ? 
                        `<div class="dish-original">${dish.name.src}</div>` : ''}
                </div>
                <span class="allergy-badge ${allergyClass}">${allergyText}</span>
            </div>
            
            ${dish.description?.translated ? 
                `<div class="dish-description">${dish.description.translated}</div>` : ''}
            
            <div class="dish-details">
                <div class="detail-item">
                    <span class="detail-label">Price</span>
                    <span class="detail-value">${priceDisplay}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Ingredients</span>
                    <span class="detail-value">${ingredients}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Allergens (detected)</span>
                    <span class="detail-value">${allergens}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Confidence</span>
                    <span class="value">${Math.round((dish.confidence || 0) * 100)}%</span>
                </div>
            </div>
            
            <div class="dish-tags">
                <span class="tag kids-${dish.kids_friendly || 'unknown'}">${kidsFriendly}</span>
                ${spiceLevel ? `<span class="tag spice-${dish.spice_level || 0}">${spiceLevel}</span>` : ''}
                ${flavorTags}
            </div>
        `;
        
        return card;
    }

    // Utility methods
    setLoadingState(loading) {
        this.elements.analyzeBtn.disabled = loading;
        this.elements.analyzeBtn.classList.toggle('loading', loading);
    }

    showToast(message, type = 'info') {
        const colors = {
            'error': '#ff4757',
            'success': '#2ed573',
            'warning': '#ffa502',
            'info': '#3742fa'
        };

        Toastify({
            text: message,
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: colors[type] || colors.info,
            stopOnFocus: true,
        }).showToast();
    }

    downloadResults() {
        if (!this.currentMenuData) {
            this.showToast('No results to download.', 'error');
            return;
        }
        
        const dataStr = JSON.stringify(this.currentMenuData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `menu_analysis_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(link.href);
        this.showToast('Results downloaded successfully!', 'success');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Global functions for HTML onclick handlers
    openCamera() {
        this.elements.cameraInput.click();
    }

    clearAllPhotos() {
        this.selectedFiles = [];
        this.updatePreview();
        this.showToast('All photos cleared', 'info');
    }

    addMorePhotos() {
        this.elements.fileInput.click();
    }

    toggleView(view) {
        this.currentView = view;
        
        // Update toggle buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        // Show/hide views
        if (view === 'grid') {
            this.elements.photoGrid.style.display = 'grid';
            this.elements.photoSwiper.style.display = 'none';
        } else {
            this.elements.photoGrid.style.display = 'none';
            this.elements.photoSwiper.style.display = 'block';
        }
    }
}

// Initialize the app when DOM is loaded
let menuTranslator;
document.addEventListener('DOMContentLoaded', function() {
    menuTranslator = new MenuTranslator();
});

// Global functions for HTML onclick handlers
function openCamera() {
    menuTranslator.openCamera();
}

function clearAllPhotos() {
    menuTranslator.clearAllPhotos();
}

function addMorePhotos() {
    menuTranslator.addMorePhotos();
}

function toggleView(view) {
    menuTranslator.toggleView(view);
}