document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication Check --- 
    const token = localStorage.getItem('recom_admin_token');
    if (!token) {
        // No token found, redirect to login
        window.location.href = 'login.html';
        return; // Stop script execution for this page
    }
    // Optional: Decode token to check expiry, but server will verify anyway
    // --------------------------

    // --- DOM Elements --- 
    const productForm = document.getElementById('product-form');
    const productFormContainer = document.querySelector('.product-form-container'); // Get container
    const productTableBody = document.getElementById('product-table-body');
    const formTitle = document.getElementById('form-title');
    const productIdInput = document.getElementById('product-id');
    const productNameInput = document.getElementById('product-name');
    const productPriceInput = document.getElementById('product-price');
    const productDescriptionInput = document.getElementById('product-description');
    const productImageInput = document.getElementById('product-image');
    const imagePreview = document.getElementById('image-preview'); // Image preview element
    const productCategoryInput = document.getElementById('product-category');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const formMessage = document.getElementById('form-message');
    const searchInput = document.getElementById('product-search-input'); // Search input
    const loadingRow = document.getElementById('loading-row'); // Loading indicator row
    const userTableBody = document.getElementById('user-table-body');
    const userLoadingRow = document.getElementById('user-loading-row');

    const API_URL = `${API_BASE_URL}/api/products`;
    let allProductsCache = []; // Cache for filtering
    const USERS_API_URL = `${API_BASE_URL}/api/users`; // Define users API URL

    // --- Helper Functions ---
    function showMessage(message, isError = false) {
        formMessage.textContent = message;
        formMessage.className = isError ? 'message error' : 'message success';
        formMessage.style.display = 'block';
        setTimeout(() => { formMessage.style.display = 'none'; }, 3000); // Hide after 3 seconds
    }

    function resetForm() {
        productForm.reset();
        productIdInput.value = '';
        formTitle.textContent = 'Add New Product';
        cancelEditBtn.style.display = 'none';
        productFormContainer.classList.remove('editing'); // Remove editing class
        imagePreview.style.display = 'none'; // Hide preview on reset
    }

    function handleApiError(error, defaultMessage = 'An error occurred') {
        console.error('API Error:', error);
        let message = defaultMessage;
        if (error.response && error.response.status === 401) {
             message = 'Unauthorized or session expired. Redirecting to login...';
             setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        } else if (error.message) {
            message = error.message;
        }
        showMessage(message, true);
    }

    // --- API Functions (with Authorization Header) ---
    async function fetchProducts() {
        try {
            // GET requests don't need Authorization for products in this setup
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const products = await response.json();
            renderProductTable(products);
        } catch (error) {
             handleApiError(error, 'Failed to load products');
             productTableBody.innerHTML = '<tr><td colspan="6">Error loading products. Check console.</td></tr>';
        }
    }

    async function addProduct(productData) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                     'Content-Type': 'application/json',
                     'Authorization': `Bearer ${token}` // Add token
                },
                body: JSON.stringify(productData)
            });
            const data = await response.json(); // Try to parse JSON regardless of status
            if (!response.ok) {
                throw { message: data.message || `HTTP error! status: ${response.status}`, response: response };
            }
            showMessage('Product added successfully!');
            resetForm();
            fetchProducts(); // Refresh table
        } catch (error) {
            handleApiError(error, 'Error adding product');
        }
    }

    async function updateProduct(id, productData) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Add token
                },
                body: JSON.stringify(productData)
            });
             const data = await response.json();
             if (!response.ok) {
                 throw { message: data.message || `HTTP error! status: ${response.status}`, response: response };
            }
            showMessage('Product updated successfully!');
            resetForm();
            fetchProducts(); // Refresh table
        } catch (error) {
             handleApiError(error, 'Error updating product');
        }
    }

    async function deleteProduct(id) {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }
        try {
            const response = await fetch(`${API_URL}/${id}`, { 
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}` // Add token
                }
             });
            if (!response.ok) {
                 const data = {};
                 try { data = await response.json(); } catch(e){}
                 throw { message: data.message || `HTTP error! status: ${response.status}`, response: response };
            } 
            showMessage('Product deleted successfully!');
            fetchProducts(); // Refresh table
        } catch (error) {
            handleApiError(error, 'Error deleting product');
        }
    }

    // --- API Functions (Users) ---
    async function fetchUsers() {
        if(userLoadingRow) userLoadingRow.style.display = 'table-row';
        if(userTableBody) userTableBody.innerHTML = '';
        if(userLoadingRow && userTableBody) userTableBody.appendChild(userLoadingRow);
        
        try {
            const response = await fetch(USERS_API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) {
                 throw { message: data.message || `HTTP error! status: ${response.status}`, response: response };
            }
            renderUserTable(data);
        } catch (error) {
             handleApiError(error, 'Failed to load users');
             if(userTableBody) userTableBody.innerHTML = '<tr><td colspan="5">Error loading users.</td></tr>';
        } finally {
             if(userLoadingRow) userLoadingRow.style.display = 'none';
        }
    }

    async function updateUserRole(userId, newRole) {
         try {
            const response = await fetch(`${USERS_API_URL}/${userId}`, {
                method: 'PUT',
                headers: {
                     'Content-Type': 'application/json',
                     'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            });
            const data = await response.json();
             if (!response.ok) {
                 throw { message: data.message || `HTTP error! status: ${response.status}`, response: response };
            }
            showMessage(`User ${data.username} role updated to ${newRole}`);
            // No table refresh needed ideally, but can add fetchUsers() if preferred
        } catch (error) {
             handleApiError(error, 'Error updating user role');
             // Optionally refresh table to revert optimistic UI change if any
             fetchUsers(); 
        }
    }

    async function deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user? This is irreversible.')) {
            return;
        }
        try {
            const response = await fetch(`${USERS_API_URL}/${userId}`, { 
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
             });
             const data = await response.json(); // Expect success message or error
             if (!response.ok) {
                 throw { message: data.message || `HTTP error! status: ${response.status}`, response: response };
            } 
            showMessage(data.message || 'User deleted successfully!');
            fetchUsers(); // Refresh table
        } catch (error) {
            handleApiError(error, 'Error deleting user');
        }
    }

    // --- Rendering Functions ---
    function renderProductTable(productsToRender) {
        if (!productTableBody) return;
        productTableBody.innerHTML = ''; // Clear existing rows (including loading row now hidden)
        if (productsToRender.length === 0) {
             productTableBody.innerHTML = '<tr><td colspan="6">No products found.</td></tr>';
             return;
        }

        productsToRender.forEach(product => {
             const row = productTableBody.insertRow();
             const imageUrl = product.image.startsWith('http') ? product.image : API_BASE_URL + product.image;
             // Make sure price is number before toFixed
             const price = typeof product.price === 'number' ? product.price.toFixed(2) : 'N/A';
             const productId = product._id || product.id; // Use MongoDB _id if available

            row.innerHTML = `
                <td>${productId}</td>
                <td><img src="${imageUrl}" alt="${product.name}" width="50" height="50" style="object-fit: cover;"></td>
                <td>${product.name}</td>
                <td>$${price}</td>
                <td>${product.category || 'N/A'}</td>
                <td>
                    <button class="btn btn-warning btn-sm edit-btn" data-id="${productId}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${productId}"><i class="fas fa-trash"></i> Delete</button>
                </td>
            `;
        });
    }

    // --- Rendering Functions (Users) ---
    function renderUserTable(users) {
        if (!userTableBody) return; // Exit if table body doesn't exist
        userTableBody.innerHTML = ''; // Clear existing rows

        if (users.length === 0) {
             userTableBody.innerHTML = '<tr><td colspan="5">No users found.</td></tr>';
             return;
        }

        users.forEach(user => {
             const row = userTableBody.insertRow();
             const joinedDate = new Date(user.createdAt).toLocaleDateString();
             const userId = user._id || user.id; // Use MongoDB _id

             row.innerHTML = `
                <td>${userId}</td>
                <td>${user.username}</td>
                <td>
                   <select class="role-select" data-userid="${userId}">
                     <option value="customer" ${user.role === 'customer' ? 'selected' : ''}>Customer</option>
                     <option value="seller" ${user.role === 'seller' ? 'selected' : ''}>Seller</option>
                     <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                   </select>
                </td>
                <td>${joinedDate}</td>
                <td>
                    <button class="btn btn-danger btn-sm delete-user-btn" data-id="${userId}"><i class="fas fa-user-times"></i> Delete</button>
                </td>
            `;
        });
    }

    // --- Event Listeners ---
    productForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const productData = {
            name: productNameInput.value,
            // Ensure price is sent as a number
            price: parseFloat(productPriceInput.value),
            description: productDescriptionInput.value,
            image: productImageInput.value,
            category: productCategoryInput.value
        };
        const id = productIdInput.value;

        if (id) { // If ID exists, update
            updateProduct(id, productData);
        } else { // Otherwise, add new
            addProduct(productData);
        }
    });

    productTableBody.addEventListener('click', (event) => {
        const target = event.target.closest('button'); // Find closest button clicked
        if (!target) return;

        const id = target.dataset.id;

        if (target.classList.contains('edit-btn')) {
            // Fetch product details for editing (GET is public, no token needed)
            fetch(`${API_URL}/${id}`)
                .then(response => response.ok ? response.json() : Promise.reject('Product not found'))
                .then(product => {
                    formTitle.textContent = 'Edit Product';
                    productIdInput.value = product.id;
                    productNameInput.value = product.name;
                    productPriceInput.value = product.price;
                    productDescriptionInput.value = product.description;
                    productImageInput.value = product.image;
                    productCategoryInput.value = product.category;
                    cancelEditBtn.style.display = 'inline-block'; // Show cancel button
                    window.scrollTo(0, 0); // Scroll to top to see form
                })
                .catch(error => {
                    handleApiError(error, 'Could not load product data for editing.');
                 });

        } else if (target.classList.contains('delete-btn')) {
            deleteProduct(id);
        }
    });

    cancelEditBtn.addEventListener('click', resetForm);

    // Logout Listener
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('recom_admin_token'); // Remove token
            showMessage('Logged out successfully. Redirecting...');
            setTimeout(() => { window.location.href = 'login.html'; }, 1000);
        });
    }

    // --- Event Listeners (Additions for Users) ---
    if (userTableBody) {
        userTableBody.addEventListener('click', (event) => {
            const target = event.target;
            if (target.classList.contains('delete-user-btn')) {
                const userId = target.dataset.id;
                deleteUser(userId);
            }
        });

        userTableBody.addEventListener('change', (event) => {
            const target = event.target;
            if (target.classList.contains('role-select')) {
                const userId = target.dataset.userid;
                const newRole = target.value;
                updateUserRole(userId, newRole);
            }
        });
    }

    // --- Tab Switching Logic --- 
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const tabId = link.dataset.tab;

            // Update tab links styling
            tabLinks.forEach(innerLink => innerLink.classList.remove('active'));
            link.classList.add('active');

            // Show/Hide tab content
            tabContents.forEach(content => {
                if (content.id === tabId) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });

            // Optional: Fetch data again if needed when switching TO a tab
            // Example: If users aren't fetched initially unless tab is active
            // if (tabId === 'users-tab' && userTableBody.innerHTML.includes('Loading')) {
            //    fetchUsers();
            // }
        });
    });
    // --- End Tab Switching Logic ---

    // --- Initial Load --- 
    // Check if the initially active tab requires data loading
    const activeTabId = document.querySelector('.tab-link.active')?.dataset.tab;
    if (activeTabId === 'products-tab') {
        fetchProducts(); // Fetch products if products tab is active initially
    }
    // Assuming users should always be loaded regardless of initial tab:
    fetchUsers(); 
    // Alternatively, load users only if user tab is initially active (or clicked later)
    // if (activeTabId === 'users-tab') {
    //     fetchUsers();
    // }
}); 