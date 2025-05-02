const express = require('express');
const router = express.Router();

// === In-Memory Product Data (Replace with database logic later) ===
// Note: If served from backend, image paths should be relative to the 'public' folder
let products = [
    { id: 1, name: "Modern Armchair", price: 249.99, description: "Comfortable and stylish armchair for your living room.", image: "/images/product1.jpg", category: "Furniture" },
    { id: 2, name: "Wireless Noise-Cancelling Headphones", price: 199.50, description: "Immersive sound quality with active noise cancellation.", image: "/images/product2.jpg", category: "Electronics" },
    { id: 3, name: "Minimalist Desk Lamp", price: 75.00, description: "Sleek LED desk lamp with adjustable brightness.", image: "/images/product3.jpg", category: "Home Office" },
    { id: 4, name: "Organic Cotton T-Shirt", price: 29.95, description: "Soft and sustainable t-shirt made from 100% organic cotton.", image: "/images/product4.jpg", category: "Apparel" },
    { id: 5, name: "Stainless Steel Water Bottle", price: 22.00, description: "Durable and insulated water bottle, keeps drinks cold or hot.", image: "/images/product5.jpg", category: "Accessories" },
    { id: 6, name: "Smart Fitness Tracker", price: 129.00, description: "Track your activity, heart rate, and sleep patterns.", image: "/images/product6.jpg", category: "Electronics" },
    { id: 7, name: "Leather Messenger Bag", price: 180.00, description: "Classic messenger bag crafted from genuine leather.", image: "/images/product7.jpg", category: "Accessories" },
    { id: 8, name: "Ceramic Coffee Mug Set", price: 45.50, description: "Set of 4 stylish ceramic mugs for your morning coffee.", image: "/images/product8.jpg", category: "Kitchenware" }
];
let nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;

// === Product Routes ===

// GET /api/products - Get all products (or limited)
router.get('/', (req, res) => {
    const limit = parseInt(req.query.limit);
    if (limit > 0) {
        res.json(products.slice(0, limit));
    } else {
        res.json(products);
    }
});

// GET /api/products/:id - Get product by ID
router.get('/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const product = products.find(p => p.id === productId);
    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});

// POST /api/products - Add new product 
router.post('/', (req, res) => {
    const { name, price, description, image, category } = req.body;

    // Basic validation
    if (!name || price === undefined || !image) {
        return res.status(400).json({ message: 'Missing required fields: name, price, image' });
    }
    if (typeof price !== 'number' || price < 0) {
         return res.status(400).json({ message: 'Price must be a non-negative number' });
    }

    const newProduct = {
        id: nextId++,
        name,
        price: parseFloat(price),
        description: description || "",
        image, 
        category: category || "Uncategorized"
    };
    products.push(newProduct);
    res.status(201).json(newProduct); // Respond with the created product
});

// PUT /api/products/:id - Update product 
router.put('/:id', (req, res) => {
     const productId = parseInt(req.params.id);
     const productIndex = products.findIndex(p => p.id === productId);

     if (productIndex === -1) {
         return res.status(404).json({ message: 'Product not found' });
     }

     const { name, price, description, image, category } = req.body;
     const updatedProduct = { ...products[productIndex] }; 

     // Update fields if provided
     if (name !== undefined) updatedProduct.name = name;
     if (price !== undefined) {
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
             return res.status(400).json({ message: 'Price must be a non-negative number' });
        }
        updatedProduct.price = parsedPrice;
     }
     if (description !== undefined) updatedProduct.description = description;
     if (image !== undefined) updatedProduct.image = image;
     if (category !== undefined) updatedProduct.category = category;
     
     products[productIndex] = updatedProduct;
     res.json(updatedProduct); // Respond with the updated product
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const initialLength = products.length;
    products = products.filter(p => p.id !== productId);

    if (products.length < initialLength) {
        res.status(204).send(); // Success, no content to return
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});

module.exports = router; // Export the router 