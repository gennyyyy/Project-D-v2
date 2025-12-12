// cart.js - simple client-side cart and stock management using localStorage
(function(){
    // Product definitions: sku -> {name, price, rarity, img (optional)}
    const PRODUCTS = {
        'ae86': {name: 'Toyota AE86 Sprinter Trueno (1986)', price:1800000, rarity:'rare', img:'img/Toyota AE86 Sprinter Trueno (1986).jpg'},
        'rx7-fd': {name: 'Mazda RX-7 FD3S (1992)', price:2400000, rarity:'rare', img:'img/Mazda RX-7 FD3S (1992).jpg'},
        'rx7-fc': {name: 'Mazda RX-7 FC3S (1987)', price:2800000, rarity:'uncommon', img:'img/Mazda RX-7 FC3S (1987).jpg'},
        'silvia-s13': {name: 'Nissan Silvia S13 (1990)', price:2500000, rarity:'uncommon', img:'img/Nissan Silvia S13 (1990).jpg'},
        'evo-iii': {name: 'Mitsubishi Lancer Evolution III (1995)', price:2200000, rarity:'uncommon', img:'img/Mitsubishi Lancer Evolution III (1995).jpg'},
        'impreza': {name: 'Subaru Impreza WRX STI (1995)', price:2900000, rarity:'uncommon', img:'img/Subaru Impreza WRX STI (1995).jpg'},
        'skyline-r32': {name: 'Nissan Skyline GT-R R32 (1989)', price:3000000, rarity:'rare', img:'img/Nissan Skyline GT-R R32 (1989).jpg'},
        'civic-eg6': {name: 'Honda Civic EG6 (1992)', price:150000, rarity:'common', img:'img/Honda Civic EG6 (1992).jpg'},
        '180sx': {name: 'Nissan 180SX (1993)', price:1800000, rarity:'uncommon', img:'img/Nissan 180SX (1993).jpg'},
        'supra-a80': {name: 'Toyota Supra A80 (1993–2002)', price:5400000, rarity:'legendary', img:'img/Supra A80 (1993–2002).jpg'},
        'mx5': {name: 'Mazda MX-5 Miata (1989–1997)', price:138000, rarity:'common', img:'img/Mazda MX-5 Miata.jpg'},
        '300zx': {name: 'Nissan 300ZX (1989–2000)', price:880000, rarity:'uncommon', img:'img/Toyota Chaser.jpg'},
        'gto': {name: 'Mitsubishi GTO (1990–2000)', price:300000, rarity:'common', img:'img/Mitsubishi GTO.jpg'},
        's2000': {name: 'Honda S2000 (1999–2009)', price:1000000, rarity:'uncommon', img:'img/Honda S2000.jpg'},
        'legacy': {name: 'Subaru Legacy (1998–2003)', price:374000, rarity:'common', img:'img/Subaru Legacy.jpg'},
        'fairlady': {name: 'Nissan Fairlady Z (1969–1978)', price:3988000, rarity:'very-rare', img:'img/Nissan Fairlady Z.jpg'}
    };

    // Rarity -> initial stock mapping
    const RARITY_STOCK = {
        'common': 10,
        'uncommon': 5,
        'rare': 2,
        'very-rare': 1,
        'legendary': 1
    };

    function getStoredStocks(){
        const s = localStorage.getItem('stocks');
        if(s) return JSON.parse(s);
        const stocks = {};
        for(const sku in PRODUCTS){
            const r = PRODUCTS[sku].rarity || 'common';
            stocks[sku] = RARITY_STOCK[r] ?? 1;
        }
        localStorage.setItem('stocks', JSON.stringify(stocks));
        return stocks;
    }

    function saveStocks(stocks){
        localStorage.setItem('stocks', JSON.stringify(stocks));
    }

    function getCart(){
        const c = localStorage.getItem('cart');
        return c ? JSON.parse(c) : {};
    }

    function saveCart(cart){
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function formatCurrency(n){
        return '₱' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    // Update stock displays on the gallery page
    function refreshGalleryStockDisplays(){
        const stocks = getStoredStocks();
        document.querySelectorAll('.gallery-item').forEach(item =>{
            const sku = item.dataset.sku;
            if(!sku) return;
            const countEl = item.querySelector('.stock-count');
            if(countEl) countEl.textContent = stocks[sku] ?? 0;
            const btn = item.querySelector('.add-to-cart');
            if(btn){
                btn.disabled = (stocks[sku] ?? 0) <= 0;
                btn.textContent = (stocks[sku] ?? 0) <= 0 ? 'Out of stock' : 'Add to Cart';
            }
        });
    }

    // Add product to cart with respect to current stock; accepts quantity
    function addToCart(sku, qty = 1){
        qty = Number(qty) || 1;
        const stocks = getStoredStocks();
        const available = stocks[sku] ?? 0;
        if(available <= 0) return {ok:false, message:'Out of stock'};
        const cart = getCart();
        const current = cart[sku] || 0;
        if(current + qty > available) return {ok:false, message:'Cannot add more than available stock'};
        cart[sku] = current + qty;
        saveCart(cart);
        return {ok:true};
    }

    // Remove a single item from cart
    function removeFromCart(sku){
        const cart = getCart();
        if(!cart[sku]) return;
        cart[sku] = cart[sku] - 1;
        if(cart[sku] <= 0) delete cart[sku];
        saveCart(cart);
    }

    // Render cart on cart page
    function renderCartPage(){
        const cartItemsEl = document.getElementById('cart-items');
        const totalEl = document.getElementById('cart-total');
        if(!cartItemsEl || !totalEl) return;
        const cart = getCart();
        const stocks = getStoredStocks();
        cartItemsEl.innerHTML = '';
        let total = 0;
        if(Object.keys(cart).length === 0){
            cartItemsEl.innerHTML = '<p>Your cart is empty.</p>';
        } else {
            for(const sku in cart){
                const qty = cart[sku];
                const p = PRODUCTS[sku];
                const price = p.price;
                total += price * qty;
                const available = stocks[sku] ?? 0;
                const div = document.createElement('div');
                div.className = 'cart-item';
                div.innerHTML = `
                    <div class="cart-item-left">
                        <strong>${p.name}</strong>
                        <p>Price: ${formatCurrency(price)}</p>
                        <p>Qty: ${qty} / Available: ${available}</p>
                    </div>
                    <div class="cart-item-right">
                        <button class="cart-decrease" data-sku="${sku}">-</button>
                        <button class="cart-increase" data-sku="${sku}">+</button>
                        <button class="cart-remove" data-sku="${sku}">Remove</button>
                    </div>
                `;
                cartItemsEl.appendChild(div);
            }
        }
        totalEl.textContent = formatCurrency(total);

        // attach listeners
        cartItemsEl.querySelectorAll('.cart-increase').forEach(btn =>{
            btn.addEventListener('click', ()=>{
                const sku = btn.dataset.sku;
                const stocks = getStoredStocks();
                const cart = getCart();
                const available = stocks[sku] ?? 0;
                const current = cart[sku] || 0;
                if(current + 1 > available){
                    showCartMessage('Cannot add more than available stock');
                    return;
                }
                cart[sku] = current + 1;
                saveCart(cart);
                renderCartPage();
                refreshGalleryStockDisplays();
            });
        });
        cartItemsEl.querySelectorAll('.cart-decrease').forEach(btn =>{
            btn.addEventListener('click', ()=>{
                const sku = btn.dataset.sku;
                removeFromCart(sku);
                renderCartPage();
                refreshGalleryStockDisplays();
            });
        });
        cartItemsEl.querySelectorAll('.cart-remove').forEach(btn =>{
            btn.addEventListener('click', ()=>{
                const sku = btn.dataset.sku;
                const cart = getCart();
                delete cart[sku];
                saveCart(cart);
                renderCartPage();
                refreshGalleryStockDisplays();
            });
        });
    }

    function showCartMessage(msg, timeout=3000){
        const el = document.getElementById('cart-message');
        if(!el) return;
        el.textContent = msg;
        setTimeout(()=> el.textContent = '', timeout);
    }

    // Checkout: decrement stocks, clear cart
    function checkout(){
        const cart = getCart();
        if(Object.keys(cart).length === 0){
            showCartMessage('Cart is empty');
            return;
        }
        const stocks = getStoredStocks();
        // Verify availability
        for(const sku in cart){
            const qty = cart[sku];
            if((stocks[sku] ?? 0) < qty){
                showCartMessage(`Not enough stock for ${PRODUCTS[sku].name}`);
                return;
            }
        }
        // Deduct
        for(const sku in cart){
            stocks[sku] = (stocks[sku] ?? 0) - cart[sku];
        }
        saveStocks(stocks);
        // optionally: persist orders history (not implemented)
        localStorage.removeItem('cart');
        renderCartPage();
        refreshGalleryStockDisplays();
        showCartMessage('Purchase successful! Thank you.');
    }

    // Modal logic: open modal when clicking a gallery item
    function openProductModal(sku, wrapper){
        const modal = document.getElementById('product-modal');
        const img = document.getElementById('modal-image');
        const name = document.getElementById('modal-name');
        const engine = document.getElementById('modal-engine');
        const price = document.getElementById('modal-price');
        const stock = document.getElementById('modal-stock');
        const qty = document.getElementById('modal-qty');
        const addBtn = document.getElementById('modal-add');

        const p = PRODUCTS[sku];
        if(!p) return;
        img.src = p.img || (wrapper.querySelector('img') && wrapper.querySelector('img').src) || '';
        img.alt = p.name;
        name.textContent = p.name;
        engine.textContent = wrapper.querySelector('.details p') ? wrapper.querySelector('.details p').textContent : '';
        price.textContent = 'Price: ' + formatCurrency(p.price);
        const stocks = getStoredStocks();
        stock.textContent = stocks[sku] ?? 0;
        qty.value = 1;
        addBtn.disabled = (stocks[sku] ?? 0) <= 0;

        modal.setAttribute('aria-hidden', 'false');

        // attach add handler
        addBtn.onclick = () =>{
            const q = Number(qty.value) || 1;
            const res = addToCart(sku, q);
            if(!res.ok){
                alert(res.message);
                return;
            }
            renderCartPage();
            refreshGalleryStockDisplays();
            modal.setAttribute('aria-hidden', 'true');
        };
    }

    function closeProductModal(){
        const modal = document.getElementById('product-modal');
        if(modal) modal.setAttribute('aria-hidden', 'true');
    }

    function attachGalleryHandlers(){
        document.querySelectorAll('.gallery-item').forEach(item =>{
            item.addEventListener('click', (e)=>{
                // open modal for this product
                const sku = item.dataset.sku;
                openProductModal(sku, item);
            });
        });
        // modal close
        const modalClose = document.querySelector('.modal-close');
        if(modalClose) modalClose.addEventListener('click', ()=> closeProductModal());
        // close on overlay click
        const modal = document.getElementById('product-modal');
        if(modal) modal.addEventListener('click', (e)=>{
            if(e.target === modal) closeProductModal();
        });
        // prevent click inside details from closing
        document.querySelectorAll('.modal-content').forEach(c=> c.addEventListener('click', e=> e.stopPropagation()));
    }

    // Initialize / wire-up
    document.addEventListener('DOMContentLoaded', ()=>{
        getStoredStocks();
        refreshGalleryStockDisplays();
        attachGalleryHandlers();
        renderCartPage();

        const checkoutBtn = document.getElementById('checkout-btn');
        if(checkoutBtn) checkoutBtn.addEventListener('click', ()=>{
            checkout();
        });

        // keyboard: Esc to close modal
        document.addEventListener('keydown', (e)=>{
            if(e.key === 'Escape') closeProductModal();
        });
    });

})();
