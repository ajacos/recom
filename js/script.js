document.addEventListener('DOMContentLoaded', () => {
    console.log("ReCom website script loaded.");

    // --- Sidebar Functionality --- 
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const closeBtn = document.getElementById('close-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    if (hamburgerBtn && sidebar && closeBtn && overlay) {
        hamburgerBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
            overlay.classList.add('active');
            // Optional: Prevent background scrolling
            // document.body.classList.add('sidebar-open-no-scroll'); 
        });

        closeBtn.addEventListener('click', closeSidebar);
        overlay.addEventListener('click', closeSidebar);
    }

    function closeSidebar() {
        if (sidebar && overlay) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
             // Optional: Allow background scrolling again
            // document.body.classList.remove('sidebar-open-no-scroll');
        }
    }
    // --- End Sidebar Functionality ---

    // Example: Update cart count on page load (will be refined in cart.js)
    updateCartIcon();

    // Load featured products if on the homepage
    if (document.getElementById('featured-product-grid')) {
        loadFeaturedProducts();
    }

    // Update navigation based on login status
    updateNavigation();
});

function updateCartIcon() {
    if (typeof updateCartCount === 'function') {
        updateCartCount();
    } else {
        // console.warn('updateCartCount function not found yet. Cart count might not be accurate.');
        // Let's default to 0 if cart.js hasn't loaded the function yet
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement) {
             cartCountElement.textContent = '0';
        }
    }
}

async function loadFeaturedProducts() {
    const grid = document.getElementById('featured-product-grid');
    if (!grid) return;

    const API_URL = `${API_BASE_URL}/api/products?limit=4`; // Fetch only 4 featured
    grid.innerHTML = '<p>Loading products...</p>';

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const featured = await response.json();

        if (featured.length === 0) {
            grid.innerHTML = '<p>No featured products available.</p>';
            return;
        }

        grid.innerHTML = ''; 
        const cartFunctionExists = typeof addItemToCart === 'function'; // Check if cart function is loaded

        featured.forEach(product => {
            const productDiv = document.createElement('div');
            productDiv.classList.add('product-item');
            
            // Ensure price is a number
            const price = typeof product.price === 'number' ? product.price : 0;

            // Construct image URL properly
            const imageUrl = product.image.startsWith('http') ? product.image : API_BASE_URL + product.image;

            const buttonHtml = cartFunctionExists 
                ? `<button class="btn btn-secondary" onclick="addToCartWrapper(${product.id})">Add to Cart</button>`
                : '<button class="btn btn-secondary" disabled>Cart Unavailable</button>';

            productDiv.innerHTML = `
                <img src="${imageUrl}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p class="price">$${price.toFixed(2)}</p>
                ${buttonHtml}
            `;
            grid.appendChild(productDiv);
        });

    } catch (error) {
        console.error('Error fetching featured products:', error);
        grid.innerHTML = '<p>Error loading featured products.</p>';
    }
}

// Wrapper for addToCart to ensure cart.js function exists
function addToCartWrapper(productId) {
    if (typeof addItemToCart === 'function') {
        // Before adding, fetch details to store in localStorage
        fetchProductDetailsAndAddToCart(productId);
    } else {
        console.error('addItemToCart function not found. Make sure cart.js is loaded.');
        alert('Error: Cart functionality is not available.');
    }
}

async function fetchProductDetailsAndAddToCart(productId) {
    const API_URL = `${API_BASE_URL}/api/products/${productId}`;
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error ('Product not found');
        const product = await response.json();
        // Pass necessary details to the actual cart function
        addItemToCart(product.id, product.name, product.price, product.image);
    } catch (error) {
        console.error("Error fetching product details for cart:", error);
        alert("Could not add product to cart. Please try again.");
    }
}

// Simple JWT Decoder (reuse from login.js/account.js)
function decodeJwtPayload(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        // console.error("Error decoding JWT payload for nav:", e);
        return null;
    }
}

// --- Navigation Update Function ---
function updateNavigation() {
    const token = localStorage.getItem('recom_admin_token');
    const payload = token ? decodeJwtPayload(token) : null;
    
    // Common elements
    const accountLink = document.getElementById('nav-account-link');
    const accountLinkDesktop = document.getElementById('nav-account-link-desktop');
    const adminLink = document.getElementById('nav-admin-link');
    const adminLinkDesktop = document.getElementById('nav-admin-link-desktop');
    const loginIcon = document.getElementById('nav-login-icon');
    const logoutIcon = document.getElementById('nav-logout-icon');

    if (payload) { // User is logged in
        // Show Account links
        if (accountLink) accountLink.style.display = 'list-item';
        if (accountLinkDesktop) accountLinkDesktop.style.display = 'list-item';

        // Show Admin links only if role is admin or seller
        if (payload.role === 'admin' || payload.role === 'seller') {
            if (adminLink) adminLink.style.display = 'list-item';
            if (adminLinkDesktop) adminLinkDesktop.style.display = 'list-item';
        } else {
            if (adminLink) adminLink.style.display = 'none';
            if (adminLinkDesktop) adminLinkDesktop.style.display = 'none';
        }

        // Toggle Login/Logout icons
        if (loginIcon) loginIcon.style.display = 'none';
        if (logoutIcon) {
            logoutIcon.style.display = 'inline-block';
            // Add logout functionality to the icon
            logoutIcon.onclick = () => {
                localStorage.removeItem('recom_admin_token');
                // localStorage.removeItem('recom_cart'); // Optionally clear cart too
                updateNavigation(); // Update nav immediately
                // Redirect to homepage or login after logout
                window.location.href = 'index.html'; 
            };
        }

    } else { // User is logged out
        // Hide Account and Admin links
        if (accountLink) accountLink.style.display = 'none';
        if (accountLinkDesktop) accountLinkDesktop.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
        if (adminLinkDesktop) adminLinkDesktop.style.display = 'none';

        // Toggle Login/Logout icons
        if (loginIcon) loginIcon.style.display = 'inline-block';
        if (logoutIcon) logoutIcon.style.display = 'none';
    }
} 