// ============================================
// KEENWIIX STORE — INTERACTIONS
// ============================================

(function () {
    'use strict';

    const body = document.body;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ==========================================
    // HEADER SCROLL EFFECT
    // ==========================================
    const header = document.querySelector('.site-header');
    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 50);
        }, { passive: true });
    }

    // ==========================================
    // MOBILE MENU
    // ==========================================
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');

    function closeMenu() {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
        body.style.overflow = '';
        hamburger.setAttribute('aria-expanded', 'false');
    }

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            const isActive = hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active', isActive);
            body.style.overflow = isActive ? 'hidden' : '';
            hamburger.setAttribute('aria-expanded', isActive);
        });

        mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeMenu();
        });
    }

    // ==========================================
    // SMOOTH SCROLL (anchor links)
    // ==========================================
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href.length < 2) return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const top = target.getBoundingClientRect().top + window.pageYOffset - 100;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

    // ==========================================
    // SCROLL PROGRESS
    // ==========================================
    const progressBtn = document.querySelector('.scroll-progress');
    if (progressBtn) {
        window.addEventListener('scroll', () => {
            const maxHeight = document.documentElement.scrollHeight - window.innerHeight;
            const percentage = maxHeight > 0 ? Math.round((window.scrollY / maxHeight) * 100) : 0;
            progressBtn.textContent = percentage + '%';
            progressBtn.classList.toggle('visible', window.scrollY > 500);
        }, { passive: true });

        progressBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ==========================================
    // REVEAL ANIMATIONS
    // ==========================================
    const revealElements = document.querySelectorAll('.product-card, .category-card, .story-visual, .story-text, .arrival-item, .newsletter-wrap');

    if (!prefersReducedMotion && 'IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => entry.target.classList.add('animate'), (index % 4) * 100);
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        revealElements.forEach(el => revealObserver.observe(el));
    } else {
        revealElements.forEach(el => el.classList.add('animate'));
    }

    // ==========================================
    // CART — данные о товарах и хранение
    // Цены здесь должны совпадать с ценами в index.html
    // ==========================================
    const PRODUCTS = {
        turtleneck: { name: 'Merino Wool Turtleneck', category: 'Knitwear',    price: 189, image: 'images/KNITWEAR.jpeg' },
        coat:       { name: 'Wool Overcoat',          category: 'Outerwear',   price: 429, image: 'images/OUTERWEAR.jpeg' },
        wallet:     { name: 'Leather Card Holder',    category: 'Accessories', price: 89,  image: 'images/ACCESSORIES.jpeg' },
        scarf:      { name: 'Cashmere Scarf',         category: 'Accessories', price: 145, image: 'images/SCARF.jpeg' },
        shirt:      { name: 'Linen Shirt',            category: 'Women',       price: 119, image: 'images/SHIRT.jpeg' },
        belt:       { name: 'Leather Belt',           category: 'Accessories', price: 79,  image: 'images/BELT.jpeg' },
        tote:       { name: 'Cotton Tote',            category: 'Home',        price: 49,  image: 'images/TOTE.jpeg' }
    };

    const CART_KEY = 'keenwiix-cart';
    const FREE_SHIPPING_FROM = 150;
    const TELEGRAM_URL = 'https://t.me/keenwiix';

    // Корзина хранится в браузере как { id: количество }
    function getCart() {
        try {
            const cart = JSON.parse(localStorage.getItem(CART_KEY)) || {};
            // Убираем товары, которых нет в каталоге
            Object.keys(cart).forEach(id => { if (!PRODUCTS[id]) delete cart[id]; });
            return cart;
        } catch (e) {
            return {};
        }
    }

    function saveCart(cart) {
        try {
            localStorage.setItem(CART_KEY, JSON.stringify(cart));
        } catch (e) { /* хранилище недоступно — корзина просто не сохранится */ }
        updateCartCount();
    }

    function getTotalCount(cart) {
        return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
    }

    function getTotalPrice(cart) {
        return Object.entries(cart).reduce((sum, [id, qty]) => sum + PRODUCTS[id].price * qty, 0);
    }

    function updateCartCount() {
        const count = getTotalCount(getCart());
        document.querySelectorAll('.cart-count').forEach(el => { el.textContent = count; });
    }

    function pulseCartCount() {
        document.querySelectorAll('.cart-count').forEach(el => {
            el.style.transform = 'scale(1.4)';
            setTimeout(() => { el.style.transform = ''; }, 300);
        });
    }

    updateCartCount();

    // Если корзину изменили в другой вкладке — обновляем счётчик
    window.addEventListener('storage', (e) => {
        if (e.key === CART_KEY) {
            updateCartCount();
            renderCartPage();
        }
    });

    // ==========================================
    // КНОПКИ "ADD TO BAG"
    // ==========================================
    document.querySelectorAll('.product-btn').forEach(btn => {
        const label = btn.innerHTML;
        let timer;

        btn.addEventListener('click', () => {
            const id = btn.dataset.product;
            if (!PRODUCTS[id]) return;

            const cart = getCart();
            cart[id] = (cart[id] || 0) + 1;
            saveCart(cart);
            pulseCartCount();

            btn.innerHTML = 'Added <i class="fas fa-check"></i>';
            btn.classList.add('added');
            clearTimeout(timer);
            timer = setTimeout(() => {
                btn.innerHTML = label;
                btn.classList.remove('added');
            }, 1500);
        });
    });

    // ==========================================
    // СТРАНИЦА КОРЗИНЫ (cart.html)
    // ==========================================
    const cartItemsBox = document.getElementById('cart-items');
    const cartFooterBox = document.getElementById('cart-footer');

    function renderCartPage() {
        if (!cartItemsBox || !cartFooterBox) return;

        const cart = getCart();
        const ids = Object.keys(cart);

        if (ids.length === 0) {
            cartItemsBox.innerHTML = `
                <div class="cart-empty">
                    <p>Your bag is empty.</p>
                    <a href="index.html#featured" class="btn-primary">Continue shopping <i class="fas fa-arrow-right"></i></a>
                </div>`;
            cartFooterBox.innerHTML = '';
            return;
        }

        cartItemsBox.innerHTML = ids.map(id => {
            const p = PRODUCTS[id];
            const qty = cart[id];
            return `
                <div class="cart-item">
                    <img src="${p.image}" alt="${p.name}">
                    <div class="cart-item-info">
                        <h4>${p.name}</h4>
                        <p>${p.category}</p>
                        <span class="cart-item-price">$${p.price * qty}</span>
                    </div>
                    <div class="cart-item-actions">
                        <div class="cart-item-qty">
                            <button data-action="minus" data-id="${id}" aria-label="Decrease quantity">−</button>
                            <span>${qty}</span>
                            <button data-action="plus" data-id="${id}" aria-label="Increase quantity">+</button>
                        </div>
                        <button class="cart-item-remove" data-action="remove" data-id="${id}">Remove</button>
                    </div>
                </div>`;
        }).join('');

        const total = getTotalPrice(cart);
        const shippingNote = total >= FREE_SHIPPING_FROM
            ? 'Free shipping included.'
            : `Add $${FREE_SHIPPING_FROM - total} more for free shipping.`;

        cartFooterBox.innerHTML = `
            <div class="cart-summary">
                <span class="cart-note">Total</span>
                <span class="cart-total">$${total}</span>
                <span class="cart-note">${shippingNote}</span>
                <span class="cart-note">Your order list is copied when you press the button — paste it in the chat.</span>
            </div>
            <a href="${TELEGRAM_URL}" target="_blank" rel="noopener" class="btn-primary" id="order-btn">
                <i class="fab fa-telegram-plane"></i> Order via Telegram
            </a>`;
    }

    if (cartItemsBox) {
        // Кнопки + / − / Remove (одним обработчиком на весь список)
        cartItemsBox.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;

            const cart = getCart();
            const id = btn.dataset.id;

            if (btn.dataset.action === 'plus') cart[id] = (cart[id] || 0) + 1;
            if (btn.dataset.action === 'minus') cart[id] = (cart[id] || 0) - 1;
            if (btn.dataset.action === 'remove' || cart[id] <= 0) delete cart[id];

            saveCart(cart);
            renderCartPage();
        });

        // Кнопка заказа: копируем список заказа и открываем Telegram
        cartFooterBox.addEventListener('click', (e) => {
            if (!e.target.closest('#order-btn')) return;

            const cart = getCart();
            const lines = Object.entries(cart).map(([id, qty]) => `- ${PRODUCTS[id].name} x ${qty} — $${PRODUCTS[id].price * qty}`);
            const text = `Hi! I'd like to order:\n${lines.join('\n')}\nTotal: $${getTotalPrice(cart)}`;

            if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
        });

        renderCartPage();
    }

    // ==========================================
    // NEWSLETTER FORM (пока без сервера — только имитация)
    // ==========================================
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const input = newsletterForm.querySelector('input');
            const button = newsletterForm.querySelector('button');
            const email = input.value.trim();

            if (!email) return;

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                input.value = '';
                input.placeholder = 'Please enter valid email';
                setTimeout(() => { input.placeholder = 'your@email.com'; }, 2500);
                return;
            }

            const originalIcon = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            setTimeout(() => {
                button.innerHTML = '<i class="fas fa-check"></i>';
                button.style.background = 'var(--success)';
                input.value = '';
                input.placeholder = 'Thanks! Check your inbox';

                setTimeout(() => {
                    button.innerHTML = originalIcon;
                    button.style.background = '';
                    input.placeholder = 'your@email.com';
                }, 2500);
            }, 800);
        });
    }

    // ==========================================
    // ACTIVE NAV LINK ON SCROLL (только главная)
    // ==========================================
    const sections = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'))
        .map(link => ({ link, section: document.querySelector(link.getAttribute('href')) }))
        .filter(item => item.section);

    if (sections.length) {
        window.addEventListener('scroll', () => {
            const scrollPos = window.scrollY + 150;

            sections.forEach(({ link, section }) => {
                const top = section.offsetTop;
                const inView = scrollPos >= top && scrollPos < top + section.offsetHeight;
                link.style.color = inView ? 'var(--text)' : '';
            });
        }, { passive: true });
    }

    // ==========================================
    // CONSOLE SIGNATURE
    // ==========================================
    console.log('%cKeenwiix Store', 'font-family: "Alex Brush", cursive; font-size: 28px; color: #F5F5F5; padding: 8px;');
    console.log('%cMade slowly. Worn forever.', 'font-family: Inter, sans-serif; font-size: 12px; color: #A0A0A0;');

})();
