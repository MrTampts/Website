// Enhanced POS Application with Mobile and Desktop Optimizations

// Global state
let cart = [];
let totalAmount = 0;

// DOM elements
const itemNameInput = document.getElementById('itemName');
const itemPriceInput = document.getElementById('itemPrice');
const addItemBtn = document.getElementById('addItemBtn');
const clearCartBtn = document.getElementById('clearCartBtn');
const cartItemsContainer = document.getElementById('cartItems');
const totalAmountDisplay = document.getElementById('totalAmount');
const moneyReceivedInput = document.getElementById('moneyReceived');
const changeAmountDisplay = document.getElementById('changeAmount');
const printReceiptBtn = document.getElementById('printReceiptBtn');

// Application initialization
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupKeyboardShortcuts();
    loadCartFromStorage();
    updateCartDisplay();
    updatePaymentDisplay();
});

// Initialize application
function initializeApp() {
    // Set focus to first input for better UX
    if (itemNameInput) {
        itemNameInput.focus();
    }
    
    // Add touch support detection
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
    }
    
    // Prevent zoom on double tap for iOS
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

// Enhanced event listeners
function setupEventListeners() {
    // Primary actions
    addItemBtn.addEventListener('click', addItem);
    clearCartBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        clearCart();
    });
    printReceiptBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        generatePDF();
    });
    
    // Input formatting and validation
    itemPriceInput.addEventListener('input', handleCurrencyInput);
    moneyReceivedInput.addEventListener('input', function() {
        handleCurrencyInput.call(this);
        calculateChange();
    });
    
    // Enhanced keyboard navigation
    itemNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            itemPriceInput.focus();
        }
    });
    
    itemPriceInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addItem();
        }
    });
    
    moneyReceivedInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !printReceiptBtn.disabled) {
            e.preventDefault();
            generatePDF();
        }
    });
    
    // Real-time input validation
    itemNameInput.addEventListener('input', function() {
        clearError(this);
        validateInputs();
    });
    
    itemPriceInput.addEventListener('input', function() {
        clearError(this);
        validateInputs();
    });
    
    // Auto-save cart on changes
    window.addEventListener('beforeunload', saveCartToStorage);
    
    // Handle visibility change for mobile app switching
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden') {
            saveCartToStorage();
        }
    });
}

// Desktop keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Only trigger if not focused on input elements
        if (e.target.tagName === 'INPUT') return;
        
        switch(e.key) {
            case 'Escape':
                e.preventDefault();
                if (cart.length > 0) {
                    clearCart();
                } else {
                    itemNameInput.focus();
                }
                break;
            case 'F1':
                e.preventDefault();
                itemNameInput.focus();
                break;
            case 'F2':
                e.preventDefault();
                if (!printReceiptBtn.disabled) {
                    generatePDF();
                }
                break;
        }
    });
}

// Enhanced currency input handling
function handleCurrencyInput() {
    let value = this.value.replace(/\D/g, '');
    
    // Prevent input that's too long
    if (value.length > 12) {
        value = value.slice(0, 12);
    }
    
    if (value) {
        // Format with dots for thousands
        value = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    
    this.value = value;
    
    // Add visual feedback for valid amounts
    if (parseCurrency(value) > 0) {
        this.classList.add('success');
        this.classList.remove('error');
    } else {
        this.classList.remove('success');
    }
}

// Validate inputs in real-time
function validateInputs() {
    const name = itemNameInput.value.trim();
    const price = parseCurrency(itemPriceInput.value);
    
    if (name && price > 0) {
        addItemBtn.disabled = false;
        addItemBtn.classList.add('btn--ready');
    } else {
        addItemBtn.disabled = true;
        addItemBtn.classList.remove('btn--ready');
    }
}

// Parse currency with better error handling
function parseCurrency(str) {
    if (!str || typeof str !== 'string') return 0;
    const parsed = parseInt(str.replace(/\./g, ''));
    return isNaN(parsed) ? 0 : parsed;
}

// Enhanced currency formatting
function formatCurrency(amount) {
    if (!amount || amount === 0) return 'Rp 0';
    return 'Rp ' + Math.abs(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Add item with enhanced validation and feedback
function addItem() {
    const name = itemNameInput.value.trim();
    const priceStr = itemPriceInput.value.trim();
    
    // Clear previous errors
    clearError(itemNameInput);
    clearError(itemPriceInput);
    
    // Validation with better error messages
    if (!name) {
        showError(itemNameInput, 'Nama barang wajib diisi');
        return;
    }
    
    if (name.length > 50) {
        showError(itemNameInput, 'Nama barang terlalu panjang (maksimal 50 karakter)');
        return;
    }
    
    if (!priceStr) {
        showError(itemPriceInput, 'Harga barang wajib diisi');
        return;
    }
    
    const price = parseCurrency(priceStr);
    if (price <= 0) {
        showError(itemPriceInput, 'Harga harus lebih dari Rp 0');
        return;
    }
    
    if (price > 99999999) {
        showError(itemPriceInput, 'Harga terlalu besar (maksimal Rp 99.999.999)');
        return;
    }
    
    // Add loading state
    addItemBtn.classList.add('loading');
    addItemBtn.disabled = true;
    
    // Simulate brief processing for better UX
    setTimeout(() => {
        // Check if item already exists
        const existingItemIndex = cart.findIndex(item => 
            item.name.toLowerCase() === name.toLowerCase()
        );
        
        if (existingItemIndex !== -1) {
            // Increase quantity of existing item
            cart[existingItemIndex].quantity += 1;
            showSuccess('Jumlah barang ditambahkan');
        } else {
            // Add new item
            cart.push({
                id: Date.now() + Math.random(),
                name: name,
                price: price,
                quantity: 1,
                timestamp: Date.now()
            });
            showSuccess(`${name} ditambahkan ke keranjang`);
        }
        
        // Clear inputs and reset state
        itemNameInput.value = '';
        itemPriceInput.value = '';
        itemNameInput.classList.remove('success');
        itemPriceInput.classList.remove('success');
        addItemBtn.classList.remove('loading');
        addItemBtn.disabled = false;
        
        // Update displays
        updateCartDisplay();
        updatePaymentDisplay();
        saveCartToStorage();
        
        // Return focus to name input for rapid entry
        itemNameInput.focus();
    }, 200);
}

// Enhanced cart display with animations
function updateCartDisplay() {
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <p>Keranjang masih kosong</p>
                <p class="empty-cart-subtitle">Tambahkan barang untuk mulai transaksi</p>
            </div>
        `;
        totalAmount = 0;
        clearCartBtn.style.display = 'none';
    } else {
        cartItemsContainer.innerHTML = cart.map(item => createCartItemHTML(item)).join('');
        calculateTotal();
        clearCartBtn.style.display = 'flex';
        
        // Re-attach event listeners for dynamically created elements
        attachCartEventListeners();
    }
    
    totalAmountDisplay.textContent = formatCurrency(totalAmount);
    
    // Add count to clear button
    if (cart.length > 0) {
        const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        clearCartBtn.innerHTML = `
            <span class="btn-icon">🗑️</span>
            Kosongkan (${itemCount})
        `;
    }
}

// Attach event listeners to cart buttons
function attachCartEventListeners() {
    // Quantity buttons
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const action = this.textContent.trim();
            const itemId = this.closest('.cart-item').dataset.id;
            
            if (action === '+') {
                increaseQuantity(itemId);
            } else if (action === '−') {
                decreaseQuantity(itemId);
            }
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const itemId = this.closest('.cart-item').dataset.id;
            removeItem(itemId);
        });
    });
}

// Create enhanced cart item HTML
function createCartItemHTML(item) {
    const subtotal = item.price * item.quantity;
    
    return `
        <div class="cart-item" data-id="${item.id}">
            <div class="item-info">
                <div class="item-name">${escapeHtml(item.name)}</div>
                <div class="item-price">${formatCurrency(item.price)} per item</div>
            </div>
            <div class="item-controls">
                <div class="quantity-controls">
                    <button class="quantity-btn touch-target" aria-label="Kurangi jumlah">−</button>
                    <div class="quantity-display">${item.quantity}</div>
                    <button class="quantity-btn touch-target" aria-label="Tambah jumlah">+</button>
                </div>
                <div class="item-subtotal">${formatCurrency(subtotal)}</div>
                <button class="delete-btn touch-target" aria-label="Hapus item">🗑️</button>
            </div>
        </div>
    `;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Quantity management with better feedback
function increaseQuantity(itemId) {
    const item = cart.find(item => item.id.toString() === itemId.toString());
    if (item && item.quantity < 999) {
        item.quantity += 1;
        updateCartDisplay();
        updatePaymentDisplay();
        saveCartToStorage();
        
        // Visual feedback
        const element = document.querySelector(`[data-id="${itemId}"]`);
        if (element) {
            element.style.transform = 'scale(1.02)';
            setTimeout(() => {
                element.style.transform = '';
            }, 150);
        }
    }
}

function decreaseQuantity(itemId) {
    const item = cart.find(item => item.id.toString() === itemId.toString());
    if (item && item.quantity > 1) {
        item.quantity -= 1;
        updateCartDisplay();
        updatePaymentDisplay();
        saveCartToStorage();
        
        // Visual feedback
        const element = document.querySelector(`[data-id="${itemId}"]`);
        if (element) {
            element.style.transform = 'scale(0.98)';
            setTimeout(() => {
                element.style.transform = '';
            }, 150);
        }
    }
}

function removeItem(itemId) {
    const item = cart.find(item => item.id.toString() === itemId.toString());
    if (item) {
        const confirmMessage = `Hapus ${item.name} dari keranjang?`;
        if (confirm(confirmMessage)) {
            cart = cart.filter(item => item.id.toString() !== itemId.toString());
            updateCartDisplay();
            updatePaymentDisplay();
            saveCartToStorage();
            showSuccess('Item berhasil dihapus');
        }
    }
}

// Clear cart with confirmation
function clearCart() {
    if (cart.length === 0) {
        showSuccess('Keranjang sudah kosong');
        return;
    }
    
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const confirmMessage = `Yakin ingin mengosongkan keranjang? (${itemCount} item akan dihapus)`;
    
    if (confirm(confirmMessage)) {
        cart = [];
        updateCartDisplay();
        updatePaymentDisplay();
        saveCartToStorage();
        showSuccess('Keranjang berhasil dikosongkan');
        itemNameInput.focus();
    }
}

// Calculate total with tax support (future feature)
function calculateTotal() {
    totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Enhanced change calculation
function calculateChange() {
    const receivedStr = moneyReceivedInput.value.trim();
    const received = parseCurrency(receivedStr);
    const change = received - totalAmount;
    
    // Update change display
    changeAmountDisplay.textContent = formatCurrency(Math.max(0, change));
    changeAmountDisplay.className = 'change-amount' + (change < 0 ? ' negative' : '');
    
    // Update button state and text
    const hasItems = cart.length > 0;
    const hasPayment = received > 0;
    const sufficientPayment = received >= totalAmount;
    
    printReceiptBtn.disabled = !hasItems || !hasPayment || !sufficientPayment;
    
    // Dynamic button text with helpful messages
    if (!hasItems) {
        printReceiptBtn.innerHTML = '<span class="btn-icon">📄</span>Tambah barang dahulu';
    } else if (!hasPayment) {
        printReceiptBtn.innerHTML = '<span class="btn-icon">📄</span>Masukkan uang diterima';
    } else if (!sufficientPayment) {
        const shortage = formatCurrency(totalAmount - received);
        printReceiptBtn.innerHTML = `<span class="btn-icon">📄</span>Kurang ${shortage}`;
    } else {
        printReceiptBtn.innerHTML = '<span class="btn-icon">📄</span>Cetak Struk';
    }
}

// Update payment display
function updatePaymentDisplay() {
    calculateChange();
}

// Local storage functions
function saveCartToStorage() {
    try {
        const cartData = {
            cart: cart,
            timestamp: Date.now()
        };
        // Note: localStorage is not available in sandbox, but keeping for reference
        // localStorage.setItem('pos_cart', JSON.stringify(cartData));
    } catch (error) {
        console.warn('Could not save cart to storage:', error);
    }
}

function loadCartFromStorage() {
    try {
        // Note: localStorage is not available in sandbox, but keeping for reference
        // const stored = localStorage.getItem('pos_cart');
        // if (stored) {
        //     const cartData = JSON.parse(stored);
        //     
        //     // Check if cart data is recent (within 24 hours)
        //     const hoursDiff = (Date.now() - cartData.timestamp) / (1000 * 60 * 60);
        //     
        //     if (hoursDiff < 24 && Array.isArray(cartData.cart)) {
        //         cart = cartData.cart;
        //         showSuccess('Keranjang sebelumnya dipulihkan');
        //     }
        // }
    } catch (error) {
        console.warn('Could not load cart from storage:', error);
    }
}

// Enhanced error handling
function showError(input, message) {
    input.classList.add('error');
    input.classList.remove('success');
    
    // Remove existing error
    const existingError = input.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Add new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    input.parentNode.appendChild(errorDiv);
    
    // Focus and select input
    input.focus();
    input.select();
    
    // Auto-hide error after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
            input.classList.remove('error');
        }
    }, 5000);
}

function clearError(input) {
    input.classList.remove('error');
    const errorMessage = input.parentNode.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

// Success feedback
function showSuccess(message) {
    // Create or update success notification
    let notification = document.querySelector('.success-notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--color-success);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    
    // Show notification
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Hide notification
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
    }, 3000);
}

// Enhanced PDF generation for thermal printers
function generatePDF() {
    if (cart.length === 0) {
        showError(itemNameInput, 'Keranjang masih kosong!');
        return;
    }
    
    const receivedStr = moneyReceivedInput.value.trim();
    const received = parseCurrency(receivedStr);
    
    if (received < totalAmount) {
        const shortage = formatCurrency(totalAmount - received);
        showError(moneyReceivedInput, `Uang kurang ${shortage}`);
        return;
    }
    
    // Add loading state and user feedback
    printReceiptBtn.classList.add('loading');
    printReceiptBtn.disabled = true;
    printReceiptBtn.innerHTML = '<span class="btn-icon">⏳</span>Membuat struk...';
    
    try {
        // Check if jsPDF is available
        if (typeof window.jspdf === 'undefined') {
            throw new Error('jsPDF library not loaded');
        }
        
        const { jsPDF } = window.jspdf;
        
        // Optimal thermal printer dimensions (58mm width)
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [58, 200] // Start with longer format, will adjust
        });
        
        // Receipt styling
        let yPos = 6;
        const lineHeight = 3.5;
        const pageWidth = 58;
        const margin = 2;
        
        // Store header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('STRUK PEMBELIAN', pageWidth/2, yPos, { align: 'center' });
        yPos += lineHeight * 1.5;
        
        // Store info (customize as needed)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('Kasir Modern - POS Digital', pageWidth/2, yPos, { align: 'center' });
        yPos += lineHeight;
        
        // Date and time
        const now = new Date();
        const dateStr = now.toLocaleDateString('id-ID', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const timeStr = now.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        doc.text(`${dateStr}, ${timeStr}`, pageWidth/2, yPos, { align: 'center' });
        yPos += lineHeight * 1.5;
        
        // Divider
        doc.text('========================================', pageWidth/2, yPos, { align: 'center' });
        yPos += lineHeight;
        
        // Items header
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('ITEM', margin, yPos);
        doc.text('QTY', 35, yPos);
        doc.text('HARGA', 42, yPos);
        doc.text('TOTAL', pageWidth - margin, yPos, { align: 'right' });
        yPos += lineHeight * 0.8;
        
        doc.text('----------------------------------------', pageWidth/2, yPos, { align: 'center' });
        yPos += lineHeight * 0.8;
        
        // Items
        doc.setFont('helvetica', 'normal');
        cart.forEach(item => {
            const subtotal = item.price * item.quantity;
            
            // Item name (wrap if too long)
            const itemName = item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name;
            doc.text(itemName, margin, yPos);
            yPos += lineHeight * 0.7;
            
            // Quantity, price, and subtotal on next line
            doc.text(item.quantity.toString(), 35, yPos);
            doc.text(formatCurrency(item.price).replace('Rp ', ''), 42, yPos);
            doc.text(formatCurrency(subtotal).replace('Rp ', ''), pageWidth - margin, yPos, { align: 'right' });
            yPos += lineHeight * 1.2;
        });
        
        // Divider
        doc.text('----------------------------------------', pageWidth/2, yPos, { align: 'center' });
        yPos += lineHeight;
        
        // Totals
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        
        // Total
        doc.text('TOTAL:', margin, yPos);
        doc.text(formatCurrency(totalAmount).replace('Rp ', ''), pageWidth - margin, yPos, { align: 'right' });
        yPos += lineHeight * 1.2;
        
        // Payment
        doc.setFont('helvetica', 'normal');
        doc.text('Bayar:', margin, yPos);
        doc.text(formatCurrency(received).replace('Rp ', ''), pageWidth - margin, yPos, { align: 'right' });
        yPos += lineHeight;
        
        // Change
        const change = received - totalAmount;
        doc.text('Kembali:', margin, yPos);
        doc.text(formatCurrency(change).replace('Rp ', ''), pageWidth - margin, yPos, { align: 'right' });
        yPos += lineHeight * 2;
        
        // Footer
        doc.setFontSize(8);
        doc.text('========================================', pageWidth/2, yPos, { align: 'center' });
        yPos += lineHeight;
        
        doc.text('Terima kasih atas kunjungan Anda!', pageWidth/2, yPos, { align: 'center' });
        yPos += lineHeight;
        doc.text('Semoga berkenan berkunjung kembali', pageWidth/2, yPos, { align: 'center' });
        
        // Generate filename with Indonesian format
        const filename = `struk_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}.pdf`;
        
        // Show immediate success feedback before download
        showSuccess('Struk sedang diunduh...');
        
        // Save PDF
        doc.save(filename);
        
        // Success feedback and reset form
        setTimeout(() => {
            printReceiptBtn.classList.remove('loading');
            printReceiptBtn.innerHTML = '<span class="btn-icon">✅</span>Struk berhasil dicetak!';
            
            showSuccess('Struk berhasil diunduh!');
            
            // Ask to clear cart for new transaction
            setTimeout(() => {
                printReceiptBtn.disabled = false;
                printReceiptBtn.innerHTML = '<span class="btn-icon">📄</span>Cetak Struk';
                
                const newTransaction = confirm('Transaksi berhasil! Mulai transaksi baru?');
                if (newTransaction) {
                    cart = [];
                    moneyReceivedInput.value = '';
                    updateCartDisplay();
                    updatePaymentDisplay();
                    saveCartToStorage();
                    itemNameInput.focus();
                }
            }, 2000);
        }, 500);
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        
        // Reset button state
        printReceiptBtn.classList.remove('loading');
        printReceiptBtn.disabled = false;
        printReceiptBtn.innerHTML = '<span class="btn-icon">📄</span>Cetak Struk';
        
        // Show specific error message
        let errorMessage = 'Gagal membuat struk. ';
        if (error.message.includes('jsPDF')) {
            errorMessage += 'Library PDF tidak tersedia.';
        } else {
            errorMessage += 'Silakan coba lagi.';
        }
        
        showError(printReceiptBtn, errorMessage);
        alert(errorMessage + ' Periksa koneksi internet dan muat ulang halaman jika perlu.');
    }
}