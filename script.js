// Enhanced Menu Translator with Modern UI
class MenuTranslator {
    constructor() {
        this.selectedFiles = [];
        this.currentMenuData = null;
        this.swiper = null;
        this.elements = {};
        
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
            thumbsWrapper: document.getElementById('thumbsWrapper'),
            menuForm: document.getElementById('menuForm'),
            analyzeBtn: document.getElementById('analyzeBtn'),
            resultsSection: document.getElementById('resultsSection'),
            resultsContent: document.getElementById('resultsContent'),
            choosePhotosBtn: document.querySelector('.upload-btn.primary'),
            takePhotoBtn: document.querySelector('.upload-btn.secondary')
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
        
        // Upload area click handler
        this.elements.uploadArea.addEventListener('click', (e) => {
            // Only trigger if clicking on the upload area itself, not on buttons
            if (e.target === this.elements.uploadArea || e.target.closest('.upload-text')) {
                if (this.elements.fileInput) {
                    this.elements.fileInput.click();
                }
            }
        });
        
        // Form submission
        this.elements.menuForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Language selector events
        this.initializeLanguageSelector();
        
        // Upload buttons with proper event handling
        if (this.elements.choosePhotosBtn) {
            this.elements.choosePhotosBtn.addEventListener('click', (e) => {
                if (this.elements.fileInput) {
                    this.elements.fileInput.click();
                }
            });
        }
        
        if (this.elements.takePhotoBtn) {
            this.elements.takePhotoBtn.addEventListener('click', (e) => {
                if (this.elements.cameraInput) {
                    this.elements.cameraInput.click();
                }
            });
        }
    }

    initializeLanguageSelector() {
        const targetLanguageSelect = document.getElementById('targetLanguage');
        
        if (!targetLanguageSelect || typeof Choices === 'undefined') {
            return;
        }
        
        // Initialize Choices.js with search functionality
        try {
            this.languageChoices = new Choices(targetLanguageSelect, {
                searchEnabled: true,
                searchPlaceholderValue: 'Search languages...',
                itemSelectText: '',
                shouldSort: false,
                position: 'bottom',
                removeItemButton: false,
                duplicateItemsAllowed: false,
                searchResultLimit: 12,
                searchFields: ['label', 'value'],
                fuseOptions: {
                    includeScore: true,
                    threshold: 0.3
                }
            });
        } catch (error) {
            console.error('Error initializing language selector:', error);
        }
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



    // File handling methods
    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        
        if (files.length > 0) {
            this.handleFiles(files);
        }
        
        // Reset the input value to allow selecting the same file again
        setTimeout(() => {
            event.target.value = '';
        }, 100);
    }

    handleFiles(files) {
        const validFiles = Array.from(files).filter(file => {
            if (!file.type.startsWith('image/')) {
                this.showToast('请选择图片文件', 'error');
                return false;
            }
            if (file.size > 10 * 1024 * 1024) {
                this.showToast('图片大小不能超过10MB', 'error');
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        this.selectedFiles = [...this.selectedFiles, ...validFiles];
        this.updatePhotoDisplay();
        this.updateSwiper();
        this.showToast(`已添加 ${validFiles.length} 张图片`, 'success');
    }
    
    // Detect iOS devices
    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    }
    
    // Detect mobile devices
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
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
            this.showToast('photo only', 'error');
        }
        
        this.handleFiles(imageFiles);
    }





    updatePhotoDisplay() {
        if (this.selectedFiles.length === 0) {
            this.elements.previewContainer.style.display = 'none';
            return;
        }

        this.elements.previewContainer.style.display = 'block';
        this.updatePhotoGrid();
    }

    updatePhotoGrid() {
        this.elements.photoGrid.innerHTML = '';
        
        this.selectedFiles.forEach((file, index) => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            
            const photoWrapper = document.createElement('div');
            photoWrapper.className = 'photo-wrapper';
            
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.alt = `Photo ${index + 1}`;
            
            const overlay = document.createElement('div');
            overlay.className = 'photo-overlay';
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '×';
            removeBtn.onclick = () => this.removeFile(index);
            
            overlay.appendChild(removeBtn);
            photoWrapper.appendChild(img);
            photoWrapper.appendChild(overlay);
            photoItem.appendChild(photoWrapper);
            
            this.elements.photoGrid.appendChild(photoItem);
        });
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.updatePhotoDisplay();
        this.updateSwiper();
        this.showToast('图片已删除', 'success');
    }

    initializeSwiper() {
        if (typeof Swiper === 'undefined') {
            console.warn('Swiper library not loaded');
            return;
        }

        // Initialize thumbnail swiper first
        this.thumbsSwiper = new Swiper('.photo-thumbs', {
            spaceBetween: 10,
            slidesPerView: 'auto',
            freeMode: true,
            watchSlidesProgress: true,
        });

        // Initialize main swiper
        this.swiper = new Swiper('.photo-swiper', {
            spaceBetween: 10,
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            thumbs: {
                swiper: this.thumbsSwiper,
            },
        });
    }

    updateSwiper() {
        if (!this.swiper) return;

        // Update main swiper
        this.elements.swiperWrapper.innerHTML = '';
        this.selectedFiles.forEach((file, index) => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';
            slide.innerHTML = `
                <div class="slide-content">
                    <img src="${URL.createObjectURL(file)}" alt="Photo ${index + 1}">
                    <div class="slide-info">
                        <h4>图片 ${index + 1}</h4>
                        <p>${this.formatFileSize(file.size)}</p>
                    </div>
                </div>
            `;
            this.elements.swiperWrapper.appendChild(slide);
        });

        // Update thumbnail swiper
        this.elements.thumbsWrapper.innerHTML = '';
        this.selectedFiles.forEach((file, index) => {
            const thumbSlide = document.createElement('div');
            thumbSlide.className = 'swiper-slide';
            thumbSlide.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="Thumbnail ${index + 1}">`;
            this.elements.thumbsWrapper.appendChild(thumbSlide);
        });

        // Update swipers
        this.swiper.update();
        if (this.thumbsSwiper) {
            this.thumbsSwiper.update();
        }

        // Show/hide swiper container
        this.elements.photoSwiper.style.display = this.selectedFiles.length > 0 ? 'block' : 'none';
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
        const targetLanguageElement = document.getElementById('targetLanguage');
        const targetLanguageValue = this.languageChoices ? this.languageChoices.getValue(true) : targetLanguageElement.value;
        formData.append('target_language', targetLanguageValue);
        formData.append('allergy_info', document.getElementById('allergyInfo').value);
        
        // Add currency if the field exists
        const currencyField = document.getElementById('currency');
        if (currencyField) {
            formData.append('currency', currencyField.value);
        }
        
        // Add images with iOS compatibility fixes
        this.selectedFiles.forEach((file, index) => {
            // iOS Safari fix: Ensure file has proper name and type
            if (this.isIOS() && (!file.name || file.name === 'image.jpg')) {
                const timestamp = Date.now();
                const newFile = new File([file], `menu_image_${timestamp}_${index}.jpg`, {
                    type: file.type || 'image/jpeg',
                    lastModified: file.lastModified || Date.now()
                });
                formData.append('images', newFile);
            } else {
                formData.append('images', file);
            }
        });
        

        
        this.setLoadingState(true);
        this.updateLoadingText('Translating...');
        
        // Retry mechanism
        const maxRetries = 3;
        let retryCount = 0;
        
        while (retryCount < maxRetries) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout
                
                // iOS Safari compatibility: Add specific headers and options
                const fetchOptions = {
                    method: 'POST',
                    body: formData,
                    signal: controller.signal
                };
                
                // iOS Safari fix: Don't set Content-Type header, let browser set it
                // iOS Safari fix: Add credentials for CORS
                if (this.isIOS()) {
                    fetchOptions.credentials = 'same-origin';
                    fetchOptions.cache = 'no-cache';
                }
                const response = await fetch('/analyze_menu', fetchOptions);
                
                clearTimeout(timeoutId);
                this.updateLoadingText('正在分析菜单...', 'AI正在识别和翻译菜单内容');
                
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
                
                this.updateLoadingText('Translating...');
                this.currentMenuData = data;
                this.displayResults(data);
                
                // Close loading state immediately after displaying results
                this.setLoadingState(false);
                
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
            </div>
            
            ${dish.description?.translated ? 
                `<div class="dish-description">${dish.description.translated}</div>` : ''}
            
            <div class="dish-details">
                <div class="detail-item">
                    <span class="detail-label">Price: </span>
                    <span class="detail-value">${priceDisplay}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Ingredients</span>
                    <span class="detail-value">${ingredients}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Allergens</span>
                    <span class="detail-value">${allergens}</span>
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
        const button = this.elements.analyzeBtn;
        const spinner = button.querySelector('.loading-spinner');
        const text = button.querySelector('span');
        const loadingOverlay = document.getElementById('loadingOverlay');
        
        button.disabled = loading;
        button.classList.toggle('loading', loading);
        
        if (loading) {
            text.style.display = 'none';
            spinner.style.display = 'inline-block';
            loadingOverlay.style.display = 'flex';
            // 防止页面滚动
            document.body.style.overflow = 'hidden';
        } else {
            text.style.display = 'inline';
            spinner.style.display = 'none';
            loadingOverlay.style.display = 'none';
            // 恢复页面滚动
            document.body.style.overflow = '';
        }
    }

    updateLoadingText(text, subtext = 'AI analyzing, may take 5-10s') {
        const loadingText = document.querySelector('.loading-text');
        const loadingSubtext = document.querySelector('.loading-subtext');
        
        if (loadingText) {
            loadingText.textContent = text;
        }
        if (loadingSubtext) {
            loadingSubtext.textContent = subtext;
        }
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



    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
ç
    openCamera() {
        if (this.elements.cameraInput) {
            this.elements.cameraInput.click();
        }
    }

    clearAllPhotos() {
        this.selectedFiles = [];
        this.updatePhotoDisplay();
        this.updateSwiper();
        this.showToast('所有图片已清除', 'info');
    }

    addMorePhotos() {
        if (this.elements.fileInput) {
            this.elements.fileInput.click();
        }
    }


}

let menuTranslator;
document.addEventListener('DOMContentLoaded', function() {
    menuTranslator = new MenuTranslator();
});

// Global functions for HTML onclick handlers
function openCamera() {
    if (menuTranslator) {
        menuTranslator.openCamera();
    }
}

function clearAllPhotos() {
    if (menuTranslator) {
        menuTranslator.clearAllPhotos();
    }
}

function addMorePhotos() {
    if (menuTranslator && menuTranslator.elements.fileInput) {
        menuTranslator.elements.fileInput.click();
    }
}