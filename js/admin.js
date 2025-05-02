document.addEventListener('DOMContentLoaded', () => {
    const productForm = document.getElementById('product-form');
    const productTableBody = document.getElementById('product-table-body');
    const formTitle = document.getElementById('form-title');
    const productIdInput = document.getElementById('product-id');
    const productNameInput = document.getElementById('product-name');
    const productPriceInput = document.getElementById('product-price');
    const productDescriptionInput = document.getElementById('product-description');
    const productImageInput = document.getElementById('product-image');
    const productCategoryInput = document.getElementById('product-category');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const formMessage = document.getElementById('form-message');

    const API_URL = `${API_BASE_URL}/api/products`;

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
    }

    // --- API Functions ---
    async function fetchProducts() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const products = await response.json();
            renderProductTable(products);
        } catch (error) {
            console.error('Error fetching products:', error);
            productTableBody.innerHTML = '<tr><td colspan="6">Error loading products. Check console.</td></tr>';
            showMessage('Failed to load products', true);
        }
    }

    async function addProduct(productData) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            await response.json(); // Get the newly created product data (optional)
            showMessage('Product added successfully!');
            resetForm();
            fetchProducts(); // Refresh table
        } catch (error) {
            console.error('Error adding product:', error);
            showMessage(`Error adding product: ${error.message}`, true);
        }
    }

    async function updateProduct(id, productData) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
             if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            await response.json(); // Get the updated product data (optional)
            showMessage('Product updated successfully!');
            resetForm();
            fetchProducts(); // Refresh table
        } catch (error) {
            console.error('Error updating product:', error);
             showMessage(`Error updating product: ${error.message}`, true);
        }
    }

    async function deleteProduct(id) {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }
        try {
            const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                 if (response.status === 404) throw new Error('Product not found');
                 throw new Error(`HTTP error! status: ${response.status}`);
            } 
            // No content expected on successful DELETE (204)
            showMessage('Product deleted successfully!');
            fetchProducts(); // Refresh table
        } catch (error) {
            console.error('Error deleting product:', error);
            showMessage(`Error deleting product: ${error.message}`, true);
        }
    }

    // --- Rendering Functions ---
    function renderProductTable(products) {
        productTableBody.innerHTML = ''; // Clear existing rows
        if (products.length === 0) {
             productTableBody.innerHTML = '<tr><td colspan="6">No products found.</td></tr>';
             return;
        }

        products.forEach(product => {
            const row = productTableBody.insertRow();
            row.innerHTML = `
                <td>${product.id}</td>
                <td><img src="${product.image.startsWith('http') ? product.image : API_BASE_URL + product.image}" alt="${product.name}" width="50"></td>
                <td>${product.name}</td>
                <td>$${product.price.toFixed(2)}</td>
                <td>${product.category || 'N/A'}</td>
                <td>
                    <button class="btn btn-warning btn-sm edit-btn" data-id="${product.id}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${product.id}"><i class="fas fa-trash"></i> Delete</button>
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
            // Find product data (ideally fetch from API again or use cached data)
            // For simplicity, let's fetch it again
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
                    console.error('Error fetching product for edit:', error);
                    showMessage('Could not load product data for editing.', true);
                 });

        } else if (target.classList.contains('delete-btn')) {
            deleteProduct(id);
        }
    });

    cancelEditBtn.addEventListener('click', resetForm);

    // --- Initial Load ---
    fetchProducts();
}); 