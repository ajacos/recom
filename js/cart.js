// Cart functionality using localStorage

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount(); // Initial count update on any page load
    // If on the cart page, display the cart items
    if (document.getElementById('cart-items-container')) {
        displayCartItems();
    }
});

// Function to get the cart from localStorage
function getCart() {
    const cart = localStorage.getItem('recomCart');
    // Cart now stores { id, quantity, name, price, image }
    return cart ? JSON.parse(cart) : []; 
}

// Function to save the cart to localStorage
function saveCart(cart) {
    localStorage.setItem('recomCart', JSON.stringify(cart));
}

// Function to add an item to the cart
// Now expects product details fetched by the caller (e.g., addToCartWrapper in script.js)
function addItemToCart(productId, name, price, image) {
    const cart = getCart();
    const id = parseInt(productId);

    // Basic validation of passed data
    if (!id || !name || price === undefined || !image) {
        console.error('addItemToCart called with incomplete product details.', {id, name, price, image});
        alert('Error: Could not get product details to add to cart.');
        return;
    }

    const existingItemIndex = cart.findIndex(item => item.id === id);

    if (existingItemIndex > -1) {
        // Increment quantity
        cart[existingItemIndex].quantity += 1;
    } else {
        // Add new item with details
        cart.push({
             id: id, 
             quantity: 1, 
             name: name, 
             price: parseFloat(price),
             image: image // Store the image path/URL received
        });
    }

    saveCart(cart);
    updateCartCount();
    console.log(`Product ${id} added/updated in cart. New cart:`, cart);
    alert('Product added to cart!'); 
}

// Function to update the quantity of an item in the cart
function updateCartItemQuantity(productId, newQuantity) {
    const cart = getCart();
    const id = parseInt(productId);
    const quantity = parseInt(newQuantity);

    const itemIndex = cart.findIndex(item => item.id === id);

    if (itemIndex > -1) {
        if (quantity > 0) {
            cart[itemIndex].quantity = quantity;
        } else {
            // Remove item if quantity is 0 or less
            cart.splice(itemIndex, 1);
        }
        saveCart(cart);
        updateCartCount();
        // Re-render the cart display IF on the cart page
        if (document.getElementById('cart-items-container')) {
            displayCartItems(); 
        }
    } else {
        console.error(`Item with ID ${id} not found in cart for updating quantity.`);
    }
}

// Function to remove an item from the cart
function removeItemFromCart(productId) {
    let cart = getCart();
    const id = parseInt(productId);
    cart = cart.filter(item => item.id !== id);
    saveCart(cart);
    updateCartCount();
    // Re-render the cart display IF on the cart page
    if (document.getElementById('cart-items-container')) {
        displayCartItems(); 
    }
}

// Function to update the cart count display in the header
function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
    }
}

// Function to display items on the cart page
// Now uses details stored directly in the cart object
function displayCartItems() {
    const cart = getCart();
    const container = document.getElementById('cart-items-container');
    const totalElement = document.getElementById('cart-total');

    if (!container || !totalElement) {
        // This is expected if not on the cart page
        // console.log('Cart container or total element not found on this page.');
        return;
    }

    container.innerHTML = ''; // Clear previous items
    let totalCost = 0;

    if (cart.length === 0) {
        container.innerHTML = '<p>Your cart is empty.</p>';
        totalElement.textContent = '0.00';
        return;
    }

    cart.forEach(item => {
        // Check if essential data exists in the cart item
        if (!item.name || item.price === undefined || !item.image) {
            console.warn(`Cart item with ID ${item.id} is missing details. Skipping display.`);
            return; // Skip this item
        }

        const itemTotal = item.price * item.quantity;
        totalCost += itemTotal;
        const imageUrl = item.image.startsWith('http') ? item.image : API_BASE_URL + item.image;

        const cartItemDiv = document.createElement('div');
        cartItemDiv.classList.add('cart-item');
        cartItemDiv.innerHTML = `
            <img src="${imageUrl}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <h3>${item.name}</h3>
                <p>Price: $${item.price.toFixed(2)}</p>
                <div class="cart-item-quantity">
                    <label for="qty-${item.id}">Quantity:</label>
                    <input type="number" id="qty-${item.id}" value="${item.quantity}" min="1" onchange="updateCartItemQuantity(${item.id}, this.value)">
                </div>
                <p>Subtotal: $${itemTotal.toFixed(2)}</p>
            </div>
            <button class="btn-remove" onclick="removeItemFromCart(${item.id})">&times;</button>
        `;
        container.appendChild(cartItemDiv);
       
    });

    totalElement.textContent = totalCost.toFixed(2);
} 