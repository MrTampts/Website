// Aplikasi Kasir Modern dengan PWA dan Fitur Lengkap
class KasirApp {
    constructor() {
        this.cart = [];
        this.totalAmount = 0;
        this.storageKey = 'pos_cart_v2';

        // Items management & earnings storage keys
        this.itemsStorageKey = 'pos_items_v1';
        this.earningsStorageKey = 'pos_earnings_v1';

        // Data holders
        this.items = [];
        this.earnings = [];

        this.initializeElements();
        this.bindEvents();
        this.loadCartFromStorage();
        this.loadItemsFromStorage();
        this.loadEarningsFromStorage();
        this.updateCartDisplay();
        this.updatePaymentDisplay();
        this.updateEarningsDisplay();
        this.updateTheme();
        this.setupServiceWorker();
    }

    initializeElements() {
        // Input elements
        this.itemNameInput = document.getElementById('itemName');
        this.itemPriceInput = document.getElementById('itemPrice');
        this.addItemBtn = document.getElementById('addItemBtn');
        
        // Cart elements
        this.cartItemsContainer = document.getElementById('cartItems');
        this.totalAmountDisplay = document.getElementById('totalAmount');
        this.clearCartBtn = document.getElementById('clearCartBtn');
        
        // Payment elements
        this.moneyReceivedInput = document.getElementById('moneyReceived');
        this.changeAmountDisplay = document.getElementById('changeAmount');
        this.printReceiptBtn = document.getElementById('printReceiptBtn');
        
        // Error elements
        this.itemNameError = document.getElementById('itemNameError');
        this.itemPriceError = document.getElementById('itemPriceError');
        
        // Notification element
        this.successNotification = document.getElementById('successNotification');

        // Header search & modal open buttons
        this.searchInput = document.getElementById('searchItem');
        this.openManageBtn = document.getElementById('openManageBtn');
        this.openEarningsBtn = document.getElementById('openEarningsBtn');

        // Modal elements - Manage Items
        this.manageModal = document.getElementById('manageItemsModal');
        this.closeManageBtn = document.getElementById('closeManageBtn');
        this.manageItemForm = document.getElementById('manageItemForm');
        this.manageName = document.getElementById('manageName');
        this.managePurchase = document.getElementById('managePurchase');
        this.manageSell = document.getElementById('manageSell');
        this.manageId = document.getElementById('manageId');
        this.newManageBtn = document.getElementById('newManageBtn');
        this.itemsTableBody = document.querySelector('#itemsTable tbody');

        // Modal elements - Earnings
        this.earningsModal = document.getElementById('earningsModal');
        this.closeEarningsBtn = document.getElementById('closeEarningsBtn');
        this.weeklyTotalEl = document.getElementById('weeklyTotal');
        this.monthlyTotalEl = document.getElementById('monthlyTotal');
        this.manualIncomeAmount = document.getElementById('manualIncomeAmount');
        this.addIncomeBtn = document.getElementById('addIncomeBtn');
        this.incomeTableBody = document.querySelector('#incomeTable tbody');

        // Currency inputs
        this.currencyInputs = document.querySelectorAll('.currency-input');
    }

    bindEvents() {
        // Add item functionality
        this.addItemBtn.addEventListener('click', () => this.addItem());
        
        // Clear cart functionality
        this.clearCartBtn.addEventListener('click', () => this.clearCart());
        
        // Print receipt functionality
        this.printReceiptBtn.addEventListener('click', () => this.printReceipt());
        
        // Input formatting
        this.currencyInputs.forEach(input => {
            input.addEventListener('input', (e) => this.formatCurrencyInput(e.target));
            input.addEventListener('focus', (e) => this.onCurrencyFocus(e.target));
            input.addEventListener('blur', (e) => this.onCurrencyBlur(e.target));
        });
        
        // Real-time validation
        this.itemNameInput.addEventListener('input', () => {
            this.clearError('itemName');
            this.validateInputs();
        });
        
        this.itemPriceInput.addEventListener('input', () => {
            this.clearError('itemPrice');
            this.validateInputs();
        });
        
        this.moneyReceivedInput.addEventListener('input', () => {
            this.updatePaymentDisplay();
        });

        // Search input: Enter opens Manage modal and tries to highlight item
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.openManageModal();
                // prefill search by name
                const q = this.searchInput.value.trim().toLowerCase();
                if (q) {
                    // open modal and highlight matching row
                    setTimeout(() => {
                        const rows = Array.from(this.itemsTableBody.querySelectorAll('tr'));
                        rows.forEach(r => r.classList.remove('highlight'));
                        const found = rows.find(r => r.dataset.name && r.dataset.name.toLowerCase().includes(q));
                        if (found) {
                            found.classList.add('highlight');
                            found.scrollIntoView({ block: 'center' });
                        }
                    }, 120);
                }
            }
        });

        // Header open modal buttons
        this.openManageBtn.addEventListener('click', () => this.openManageModal());
        this.openEarningsBtn.addEventListener('click', () => this.openEarningsModal());

        // Modal close
        this.closeManageBtn.addEventListener('click', () => this.closeManageModal());
        this.closeEarningsBtn.addEventListener('click', () => this.closeEarningsModal());

        // Manage form submit
        this.manageItemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveManageItem();
        });

        // New manage button
        this.newManageBtn.addEventListener('click', () => this.clearManageForm());

        // Add manual income
        this.addIncomeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.addManualIncome();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Auto-save on visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.saveCartToStorage();
                this.saveItemsToStorage();
                this.saveEarningsToStorage();
            }
        });
        
        // Prevent double-tap zoom on iOS
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }

    /* ---------------------------
       Currency and Input Helpers
       --------------------------- */
    formatCurrencyInput(input) {
        let value = input.value.replace(/[^\d]/g, '');
        if (value.length > 12) value = value.slice(0, 12);
        if (value) {
            value = parseInt(value).toLocaleString('id-ID');
        }
        input.value = value;
    }

    onCurrencyFocus(input) {
        input.value = input.value.replace(/[^\d]/g, '');
        const wrapper = input.closest('.currency-input-wrapper');
        const prefix = wrapper.querySelector('.currency-prefix');
        if (prefix) {
            prefix.style.opacity = '0';
            prefix.style.visibility = 'hidden';
        }
    }

    onCurrencyBlur(input) {
        this.formatCurrencyInput(input);
        this.validateInputs();
        const wrapper = input.closest('.currency-input-wrapper');
        const prefix = wrapper.querySelector('.currency-prefix');
        if (prefix) {
            prefix.style.opacity = '1';
            prefix.style.visibility = 'visible';
        }
    }

    handleKeyboardShortcuts(e) {
        if (e.target.tagName === 'INPUT') return;
        
        switch(e.key) {
            case 'Escape':
                e.preventDefault();
                if (this.cart.length > 0) {
                    this.clearCart();
                } else {
                    this.itemNameInput.focus();
                }
                break;
            case 'F1':
                e.preventDefault();
                this.itemNameInput.focus();
                break;
            case 'F2':
                e.preventDefault();
                if (!this.printReceiptBtn.disabled) {
                    this.printReceipt();
                }
                break;
        }
    }

    validateInputs() {
        const name = this.itemNameInput.value.trim();
        const priceStr = this.itemPriceInput.value.replace(/[^\d]/g, '');
        const price = parseInt(priceStr) || 0;
        
        let isValid = true;
        
        // Validate name
        if (!name) {
            this.showError('itemName', 'Nama barang wajib diisi');
            isValid = false;
        } else if (name.length > 50) {
            this.showError('itemName', 'Nama barang terlalu panjang (maksimal 50 karakter)');
            isValid = false;
        } else {
            this.clearError('itemName');
        }
        
        // Validate price
        if (!priceStr) {
            this.showError('itemPrice', 'Harga barang wajib diisi');
            isValid = false;
        } else if (price <= 0) {
            this.showError('itemPrice', 'Harga harus lebih dari 0');
            isValid = false;
        } else if (price > 99999999) {
            this.showError('itemPrice', 'Harga terlalu besar (maksimal Rp 99.999.999)');
            isValid = false;
        } else {
            this.clearError('itemPrice');
        }
        
        this.addItemBtn.disabled = !isValid;
        return isValid;
    }

    showError(field, message) {
        const errorElement = this[`${field}Error`];
        if (!errorElement) return;
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        this[`${field}Input`]?.classList.add('error');
    }

    clearError(field) {
        const errorElement = this[`${field}Error`];
        if (!errorElement) return;
        errorElement.style.display = 'none';
        this[`${field}Input`]?.classList.remove('error');
    }

    /* ---------------------------
       Cart operations (existing)
       --------------------------- */
    addItem() {
        if (!this.validateInputs()) return;
        
        const name = this.itemNameInput.value.trim();
        const priceStr = this.itemPriceInput.value.replace(/[^\d]/g, '');
        const price = parseInt(priceStr);
        
        // Check if item already exists
        const existingItem = this.cart.find(item => 
            item.name.toLowerCase() === name.toLowerCase()
        );
        
        if (existingItem) {
            existingItem.quantity += 1;
            this.showSuccess(`Jumlah ${name} ditambahkan`);
        } else {
            this.cart.push({
                id: Date.now() + Math.random(),
                name: name,
                price: price,
                quantity: 1
            });
            this.showSuccess(`${name} ditambahkan ke keranjang`);
        }
        
        // Reset inputs
        this.itemNameInput.value = '';
        this.itemPriceInput.value = '';
        
        this.updateCartDisplay();
        this.updatePaymentDisplay();
        this.saveCartToStorage();
        this.itemNameInput.focus();
    }

    updateCartDisplay() {
        if (this.cart.length === 0) {
            this.cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <div class="empty-cart-icon">🛒</div>
                    <p>Keranjang masih kosong</p>
                    <p class="empty-cart-subtitle">Tambahkan barang untuk mulai transaksi</p>
                </div>
            `;
            this.clearCartBtn.style.display = 'none';
            this.totalAmount = 0;
        } else {
            this.cartItemsContainer.innerHTML = this.cart.map(item => 
                this.createCartItemHTML(item)
            ).join('');
            
            this.clearCartBtn.style.display = 'inline-flex';
            this.calculateTotal();
            
            // Update clear button text
            const itemCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            this.clearCartBtn.innerHTML = `
                <span class="btn-icon">🗑️</span>
                Kosongkan (${itemCount})
            `;
            
            // Re-attach event listeners
            this.attachCartEventListeners();
        }
        
        this.totalAmountDisplay.textContent = this.formatCurrency(this.totalAmount);
    }

    createCartItemHTML(item) {
        const subtotal = item.price * item.quantity;
        return `
            <div class="cart-item" data-id="${item.id}">
                <div class="item-info">
                    <div class="item-name">${this.escapeHtml(item.name)}</div>
                    <div class="item-price">${this.formatCurrency(item.price)} per item</div>
                </div>
                <div class="item-controls">
                    <div class="quantity-controls">
                        <button class="quantity-btn" aria-label="Kurangi jumlah">-</button>
                        <div class="quantity-display">${item.quantity}</div>
                        <button class="quantity-btn" aria-label="Tambah jumlah">+</button>
                    </div>
                    <div class="item-subtotal">${this.formatCurrency(subtotal)}</div>
                    <button class="delete-btn" aria-label="Hapus item">🗑️</button>
                </div>
            </div>
        `;
    }

    attachCartEventListeners() {
        // Quantity buttons
        document.querySelectorAll('.quantity-btn').forEach((btn, index) => {
            const parentItem = btn.closest('.cart-item');
            const itemId = parentItem.dataset.id;
            const isIncrease = btn.textContent === '+';
            
            btn.addEventListener('click', () => {
                if (isIncrease) {
                    this.increaseQuantity(itemId);
                } else {
                    this.decreaseQuantity(itemId);
                }
            });
        });
        
        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach((btn, index) => {
            const parentItem = btn.closest('.cart-item');
            const itemId = parentItem.dataset.id;
            
            btn.addEventListener('click', () => {
                this.removeItem(itemId);
            });
        });
    }

    increaseQuantity(itemId) {
        const item = this.cart.find(item => item.id.toString() === itemId);
        if (item && item.quantity < 999) {
            item.quantity += 1;
            this.updateCartDisplay();
            this.updatePaymentDisplay();
            this.saveCartToStorage();
        }
    }

    decreaseQuantity(itemId) {
        const item = this.cart.find(item => item.id.toString() === itemId);
        if (item && item.quantity > 1) {
            item.quantity -= 1;
            this.updateCartDisplay();
            this.updatePaymentDisplay();
            this.saveCartToStorage();
        }
    }

    removeItem(itemId) {
        const item = this.cart.find(item => item.id.toString() === itemId);
        if (item) {
            const confirmMessage = `Hapus ${item.name} dari keranjang?`;
            if (confirm(confirmMessage)) {
                this.cart = this.cart.filter(item => item.id.toString() !== itemId);
                this.updateCartDisplay();
                this.updatePaymentDisplay();
                this.saveCartToStorage();
                this.showSuccess('Item berhasil dihapus');
            }
        }
    }

    calculateTotal() {
        this.totalAmount = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    updatePaymentDisplay() {
        const receivedStr = this.moneyReceivedInput.value.replace(/[^\d]/g, '');
        const received = parseInt(receivedStr) || 0;
        const change = received - this.totalAmount;
        
        // Update change display
        this.changeAmountDisplay.textContent = this.formatCurrency(Math.abs(change));
        this.changeAmountDisplay.className = 'change-amount' + (change < 0 ? ' negative' : '');
        
        // Update button state
        const hasItems = this.cart.length > 0;
        const hasPayment = received > 0;
        const sufficientPayment = received >= this.totalAmount;
        
        this.printReceiptBtn.disabled = !hasItems || !hasPayment || !sufficientPayment;
        
        // Update button text
        if (!hasItems) {
            this.printReceiptBtn.innerHTML = '<span class="btn-icon">📄</span>Tambah barang dahulu';
        } else if (!hasPayment) {
            this.printReceiptBtn.innerHTML = '<span class="btn-icon">📄</span>Masukkan uang diterima';
        } else if (!sufficientPayment) {
            const shortage = this.formatCurrency(this.totalAmount - received);
            this.printReceiptBtn.innerHTML = `<span class="btn-icon">📄</span>Kurang ${shortage}`;
        } else {
            this.printReceiptBtn.innerHTML = '<span class="btn-icon">📄</span>Cetak Struk';
        }
    }

    clearCart() {
        if (this.cart.length === 0) {
            this.showSuccess('Keranjang sudah kosong');
            return;
        }
        
        const itemCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const confirmMessage = `Yakin ingin mengosongkan keranjang? (${itemCount} item akan dihapus)`;
        
        if (confirm(confirmMessage)) {
            this.cart = [];
            this.moneyReceivedInput.value = '';
            this.updateCartDisplay();
            this.updatePaymentDisplay();
            this.saveCartToStorage();
            this.showSuccess('Keranjang berhasil dikosongkan');
            this.itemNameInput.focus();
        }
    }

    printReceipt() {
        if (this.cart.length === 0) {
            this.showSuccess('Keranjang masih kosong!');
            return;
        }
        
        const receivedStr = this.moneyReceivedInput.value.replace(/[^\d]/g, '');
        const received = parseInt(receivedStr) || 0;
        
        if (received < this.totalAmount) {
            const shortage = this.formatCurrency(this.totalAmount - received);
            this.showError('moneyReceived', `Uang kurang ${shortage}`);
            return;
        }

        // Store sale amount for earnings before potential clear
        const saleAmount = this.totalAmount;
        
        // Add loading state
        this.printReceiptBtn.classList.add('loading');
        this.printReceiptBtn.disabled = true;
        this.printReceiptBtn.innerHTML = '<span class="btn-icon">⏳</span>Membuat struk...';
        
        setTimeout(() => {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: [58, 200]
                });
                
                let yPos = 6;
                const lineHeight = 3.5;
                const pageWidth = 58;
                const margin = 2;
                
                // Header
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('STRUK PEMBELIAN', pageWidth/2, yPos, { align: 'center' });
                yPos += lineHeight * 1.5;
                
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
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
                    minute: '2-digit'
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
                doc.text('QTY', 30, yPos);
                doc.text('HARGA', 35, yPos);
                doc.text('TOTAL', pageWidth - margin, yPos, { align: 'right' });
                yPos += lineHeight * 0.8;
                
                doc.text('----------------------------------------', pageWidth/2, yPos, { align: 'center' });
                yPos += lineHeight * 0.8;
                
                // Items
                doc.setFont('helvetica', 'normal');
                this.cart.forEach(item => {
                    const subtotal = item.price * item.quantity;
                    
                    const itemName = item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name;
                    doc.text(itemName, margin, yPos);
                    yPos += lineHeight * 0.7;
                    
                    doc.text(item.quantity.toString(), 30, yPos);
                    doc.text(this.formatCurrency(item.price).replace('Rp ', ''), 35, yPos);
                    doc.text(this.formatCurrency(subtotal).replace('Rp ', ''), pageWidth - margin, yPos, { align: 'right' });
                    yPos += lineHeight * 1.2;
                });
                
                // Divider
                doc.text('----------------------------------------', pageWidth/2, yPos, { align: 'center' });
                yPos += lineHeight;
                
                // Totals
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                
                doc.text('TOTAL:', margin, yPos);
                doc.text(this.formatCurrency(this.totalAmount).replace('Rp ', ''), pageWidth - margin, yPos, { align: 'right' });
                yPos += lineHeight * 1.2;
                
                doc.setFont('helvetica', 'normal');
                doc.text('Bayar:', margin, yPos);
                doc.text(this.formatCurrency(received).replace('Rp ', ''), pageWidth - margin, yPos, { align: 'right' });
                yPos += lineHeight;
                
                const change = received - this.totalAmount;
                doc.text('Kembali:', margin, yPos);
                doc.text(this.formatCurrency(change).replace('Rp ', ''), pageWidth - margin, yPos, { align: 'right' });
                yPos += lineHeight * 2;
                
                // Footer
                doc.setFontSize(8);
                doc.text('========================================', pageWidth/2, yPos, { align: 'center' });
                yPos += lineHeight;
                
                doc.text('Terima kasih atas kunjungan Anda!', pageWidth/2, yPos, { align: 'center' });
                yPos += lineHeight;
                doc.text('Semoga berkenan berkunjung kembali', pageWidth/2, yPos, { align: 'center' });
                
                const filename = `struk_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}.pdf`;
                
                doc.save(filename);
                
                this.showSuccess('Struk berhasil dicetak!');
                
                // Reset button state
                this.printReceiptBtn.classList.remove('loading');
                this.printReceiptBtn.innerHTML = '<span class="btn-icon">✅</span>Struk berhasil!';
                
                setTimeout(() => {
                    this.printReceiptBtn.disabled = false;
                    this.printReceiptBtn.innerHTML = '<span class="btn-icon">📄</span>Cetak Struk';
                    
                    const newTransaction = confirm('Transaksi berhasil! Mulai transaksi baru?');
                    if (newTransaction) {
                        // Record earning from sale
                        if (saleAmount > 0) {
                            this.recordSaleEarning(saleAmount);
                        }

                        this.cart = [];
                        this.moneyReceivedInput.value = '';
                        this.updateCartDisplay();
                        this.updatePaymentDisplay();
                        this.saveCartToStorage();
                        this.itemNameInput.focus();
                    }
                }, 2000);
                
            } catch (error) {
                console.error('Error generating PDF:', error);
                this.printReceiptBtn.classList.remove('loading');
                this.printReceiptBtn.disabled = false;
                this.printReceiptBtn.innerHTML = '<span class="btn-icon">📄</span>Cetak Struk';
                alert('Gagal membuat struk. Periksa koneksi internet dan muat ulang halaman jika perlu.');
            }
        }, 500);
    }

    formatCurrency(amount) {
        if (!amount || amount === 0) return 'Rp 0';
        return 'Rp ' + Math.abs(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    showSuccess(message) {
        const successMessage = document.getElementById('successMessage');
        successMessage.textContent = message;
        this.successNotification.classList.add('show');
        
        setTimeout(() => {
            this.successNotification.classList.remove('show');
        }, 3000);
    }

    saveCartToStorage() {
        try {
            const cartData = {
                cart: this.cart,
                timestamp: Date.now()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(cartData));
        } catch (error) {
            console.warn('Could not save cart to storage:', error);
        }
    }

    loadCartFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const cartData = JSON.parse(stored);
                
                // Check if cart data is recent (within 24 hours)
                const hoursDiff = (Date.now() - cartData.timestamp) / (1000 * 60 * 60);
                
                if (hoursDiff < 24 && Array.isArray(cartData.cart)) {
                    this.cart = cartData.cart;
                    this.showSuccess('Keranjang sebelumnya dipulihkan');
                }
            }
        } catch (error) {
            console.warn('Could not load cart from storage:', error);
        }
    }

    updateTheme() {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            document.body.classList.add('dark-mode');
        }
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                        console.log('SW registered: ', registration);
                    })
                    .catch((registrationError) => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }
    }

    /* ---------------------------
       Items management
       --------------------------- */
    loadItemsFromStorage() {
        try {
            const raw = localStorage.getItem(this.itemsStorageKey);
            if (raw) {
                const data = JSON.parse(raw);
                if (Array.isArray(data)) {
                    this.items = data;
                }
            }
        } catch (e) {
            console.warn('Could not load items:', e);
        }
        this.renderItemsTable();
    }

    saveItemsToStorage() {
        try {
            localStorage.setItem(this.itemsStorageKey, JSON.stringify(this.items));
        } catch (e) {
            console.warn('Could not save items:', e);
        }
    }

    renderItemsTable() {
        if (!this.itemsTableBody) return;
        this.itemsTableBody.innerHTML = '';
        this.items.forEach(item => {
            const tr = document.createElement('tr');
            tr.dataset.id = item.id;
            tr.dataset.name = item.name;
            tr.innerHTML = `
                <td class="td-name">${this.escapeHtml(item.name)}</td>
                <td class="td-buy">${this.formatCurrency(item.purchase || 0)}</td>
                <td class="td-sell">${this.formatCurrency(item.sell || 0)}</td>
                <td class="td-actions">
                    <button class="btn btn--sm btn-select" data-id="${item.id}">Pilih</button>
                    <button class="btn btn--sm btn-edit" data-id="${item.id}">Edit</button>
                    <button class="btn btn--sm btn-delete" data-id="${item.id}">Hapus</button>
                </td>
            `;
            this.itemsTableBody.appendChild(tr);
        });

        // attach buttons
        this.itemsTableBody.querySelectorAll('.btn-select').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.selectItemToInput(id);
            });
        });
        this.itemsTableBody.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.editItem(id);
            });
        });
        this.itemsTableBody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.deleteItem(id);
            });
        });
    }

    openManageModal() {
        if (!this.manageModal) return;
        this.manageModal.classList.add('open');
        this.manageModal.setAttribute('aria-hidden', 'false');
        this.renderItemsTable();
    }

    closeManageModal() {
        if (!this.manageModal) return;
        this.manageModal.classList.remove('open');
        this.manageModal.setAttribute('aria-hidden', 'true');
        this.clearManageForm();
    }

    clearManageForm() {
        this.manageName.value = '';
        this.managePurchase.value = '';
        this.manageSell.value = '';
        this.manageId.value = '';
    }

    saveManageItem() {
        const name = this.manageName.value.trim();
        const purchaseStr = this.managePurchase.value.replace(/[^\d]/g, '');
        const sellStr = this.manageSell.value.replace(/[^\d]/g, '');
        const purchase = parseInt(purchaseStr) || 0;
        const sell = parseInt(sellStr) || 0;

        if (!name) {
            alert('Nama barang wajib diisi');
            return;
        }
        if (sell <= 0) {
            alert('Harga jual harus lebih dari 0');
            return;
        }

        const id = this.manageId.value;
        if (id) {
            // update
            const idx = this.items.findIndex(i => i.id.toString() === id.toString());
            if (idx >= 0) {
                this.items[idx].name = name;
                this.items[idx].purchase = purchase;
                this.items[idx].sell = sell;
                this.showSuccess('Barang diperbarui');
            }
        } else {
            // new
            this.items.push({
                id: Date.now() + Math.random(),
                name,
                purchase,
                sell
            });
            this.showSuccess('Barang ditambahkan');
        }

        this.saveItemsToStorage();
        this.renderItemsTable();
        this.clearManageForm();
    }

    editItem(id) {
        const item = this.items.find(i => i.id.toString() === id.toString());
        if (!item) return;
        this.manageId.value = item.id;
        this.manageName.value = item.name;
        this.managePurchase.value = item.purchase ? item.purchase.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
        this.manageSell.value = item.sell ? item.sell.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
        // ensure modal open
        this.openManageModal();
    }

    deleteItem(id) {
        const item = this.items.find(i => i.id.toString() === id.toString());
        if (!item) return;
        if (confirm(`Hapus barang "${item.name}"?`)) {
            this.items = this.items.filter(i => i.id.toString() !== id.toString());
            this.saveItemsToStorage();
            this.renderItemsTable();
            this.showSuccess('Barang dihapus');
        }
    }

    selectItemToInput(id) {
        const item = this.items.find(i => i.id.toString() === id.toString());
        if (!item) return;
        this.itemNameInput.value = item.name;
        this.itemPriceInput.value = item.sell ? item.sell.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
        this.closeManageModal();
        this.itemNameInput.focus();
        this.validateInputs();
    }

    /* ---------------------------
       Earnings management
       --------------------------- */
    loadEarningsFromStorage() {
        try {
            const raw = localStorage.getItem(this.earningsStorageKey);
            if (raw) {
                const data = JSON.parse(raw);
                if (Array.isArray(data)) {
                    this.earnings = data;
                }
            }
        } catch (e) {
            console.warn('Could not load earnings:', e);
        }
        this.renderIncomeTable();
        this.updateEarningsDisplay();
    }

    saveEarningsToStorage() {
        try {
            localStorage.setItem(this.earningsStorageKey, JSON.stringify(this.earnings));
        } catch (e) {
            console.warn('Could not save earnings:', e);
        }
    }

    addManualIncome() {
        const amountStr = this.manualIncomeAmount.value.replace(/[^\d]/g, '');
        const amount = parseInt(amountStr) || 0;
        if (amount <= 0) {
            alert('Masukkan jumlah pemasukan yang valid');
            return;
        }
        const entry = {
            id: Date.now() + Math.random(),
            amount,
            date: new Date().toISOString(),
            source: 'Manual'
        };
        this.earnings.unshift(entry);
        this.saveEarningsToStorage();
        this.renderIncomeTable();
        this.updateEarningsDisplay();
        this.manualIncomeAmount.value = '';
        this.showSuccess('Pemasukan dicatat');
    }

    recordSaleEarning(amount) {
        if (!amount || amount <= 0) return;
        const entry = {
            id: Date.now() + Math.random(),
            amount,
            date: new Date().toISOString(),
            source: 'Penjualan'
        };
        this.earnings.unshift(entry);
        this.saveEarningsToStorage();
        this.renderIncomeTable();
        this.updateEarningsDisplay();
    }

    renderIncomeTable() {
        if (!this.incomeTableBody) return;
        this.incomeTableBody.innerHTML = '';
        this.earnings.forEach(e => {
            const tr = document.createElement('tr');
            const date = new Date(e.date);
            tr.innerHTML = `
                <td>${date.toLocaleString('id-ID')}</td>
                <td>${this.formatCurrency(e.amount)}</td>
                <td>${this.escapeHtml(e.source || '')}</td>
            `;
            this.incomeTableBody.appendChild(tr);
        });
    }

    updateEarningsDisplay() {
        // weekly: last 7 days inclusive
        const now = new Date();
        const weekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        const weekly = this.earnings.reduce((sum, e) => {
            const d = new Date(e.date);
            return d >= weekAgo ? sum + (e.amount || 0) : sum;
        }, 0);

        // monthly: same month & year
        const monthly = this.earnings.reduce((sum, e) => {
            const d = new Date(e.date);
            return (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) ? sum + (e.amount || 0) : sum;
        }, 0);

        if (this.weeklyTotalEl) this.weeklyTotalEl.textContent = this.formatCurrency(weekly);
        if (this.monthlyTotalEl) this.monthlyTotalEl.textContent = this.formatCurrency(monthly);
    }

    openEarningsModal() {
        if (!this.earningsModal) return;
        this.earningsModal.classList.add('open');
        this.earningsModal.setAttribute('aria-hidden', 'false');
        this.renderIncomeTable();
        this.updateEarningsDisplay();
    }

    closeEarningsModal() {
        if (!this.earningsModal) return;
        this.earningsModal.classList.remove('open');
        this.earningsModal.setAttribute('aria-hidden', 'true');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new KasirApp();
});
