document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('product-search');
    const productGrid = document.getElementById('all-products-grid');

    let allProductsCache = []; // Cache fetched products for searching
    const API_URL = `${API_BASE_URL}/api/products`;

    // Function to fetch and display products
    async function fetchAndDisplayProducts() {
        productGrid.innerHTML = '<p>Loading products...</p>';
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            allProductsCache = await response.json(); // Store in cache
            displayProducts(allProductsCache); // Initial display
        } catch (error) {
            console.error('Error fetching products:', error);
            productGrid.innerHTML = '<p>Error loading products. Please try again later.</p>';
        }
    }

    // Initial load
    fetchAndDisplayProducts();

    // Add event listener for real-time search filtering (uses cache)
    if (searchInput) {
        searchInput.addEventListener('input', (event) => {
            const searchTerm = event.target.value.toLowerCase();
            filterAndDisplayProducts(searchTerm);
        });
    }

    // Update cart count on page load
    updateCartCount(); 
});

// Function to display products in the grid (now receives data)
function displayProducts(productsToDisplay) {
    const grid = document.getElementById('all-products-grid');
    if (!grid) return;

    grid.innerHTML = ''; // Clear previous content

    if (productsToDisplay.length === 0) {
        grid.innerHTML = '<p>No products found matching your criteria.</p>';
        return;
    }

    const cartFunctionExists = typeof addItemToCart === 'function';

    productsToDisplay.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.classList.add('product-item');
        
        const price = typeof product.price === 'number' ? product.price : 0;
        const imageUrl = product.image.startsWith('http') ? product.image : API_BASE_URL + product.image;
        const descriptionParagraph = product.description ? `<p class="description">${product.description}</p>` : '';

        // Use the wrapper function from script.js
        const cartButton = typeof addToCartWrapper === 'function'
            ? `<button class="btn btn-secondary" onclick="addToCartWrapper(${product.id})">Add to Cart</button>`
            : '<button class="btn btn-secondary" disabled>Cart Unavailable</button>';

        productDiv.innerHTML = `
            <img src="${imageUrl}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p class="price">$${price.toFixed(2)}</p>
            ${descriptionParagraph}
            ${cartButton}
        `;
        
        grid.appendChild(productDiv);
    });
}

// Function to filter products based on search term (uses cached data)
function filterAndDisplayProducts(searchTerm) {
    // Use allProductsCache defined in the DOMContentLoaded scope
    const filteredProducts = allProductsCache.filter(product => {
        const nameMatch = product.name.toLowerCase().includes(searchTerm);
        const descriptionMatch = product.description ? product.description.toLowerCase().includes(searchTerm) : false;
        const categoryMatch = product.category ? product.category.toLowerCase().includes(searchTerm) : false;
        return nameMatch || descriptionMatch || categoryMatch;
    });

    displayProducts(filteredProducts);
}

// Function explicitly called by the search button (uses filter function)
function searchProducts() {
    const searchInput = document.getElementById('product-search');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    filterAndDisplayProducts(searchTerm);
}

// updateCartCount() is called within DOMContentLoaded
// Ensure cart.js is loaded before this script in HTML 