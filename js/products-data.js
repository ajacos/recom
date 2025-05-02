// Mock Product Data
// In a real application, this would come from a database/API

const mockProducts = [
    {
        id: 1,
        name: "Modern Armchair",
        price: 249.99,
        description: "Comfortable and stylish armchair for your living room.",
        image: "images/product1.jpg", // Placeholder image path
        category: "Furniture"
    },
    {
        id: 2,
        name: "Wireless Noise-Cancelling Headphones",
        price: 199.50,
        description: "Immersive sound quality with active noise cancellation.",
        image: "images/product2.jpg", // Placeholder image path
        category: "Electronics"
    },
    {
        id: 3,
        name: "Minimalist Desk Lamp",
        price: 75.00,
        description: "Sleek LED desk lamp with adjustable brightness.",
        image: "images/product3.jpg", // Placeholder image path
        category: "Home Office"
    },
    {
        id: 4,
        name: "Organic Cotton T-Shirt",
        price: 29.95,
        description: "Soft and sustainable t-shirt made from 100% organic cotton.",
        image: "images/product4.jpg", // Placeholder image path
        category: "Apparel"
    },
    {
        id: 5,
        name: "Stainless Steel Water Bottle",
        price: 22.00,
        description: "Durable and insulated water bottle, keeps drinks cold or hot.",
        image: "images/product5.jpg", // Placeholder image path
        category: "Accessories"
    },
    {
        id: 6,
        name: "Smart Fitness Tracker",
        price: 129.00,
        description: "Track your activity, heart rate, and sleep patterns.",
        image: "images/product6.jpg", // Placeholder image path
        category: "Electronics"
    },
    {
        id: 7,
        name: "Leather Messenger Bag",
        price: 180.00,
        description: "Classic messenger bag crafted from genuine leather.",
        image: "images/product7.jpg", // Placeholder image path
        category: "Accessories"
    },
    {
        id: 8,
        name: "Ceramic Coffee Mug Set",
        price: 45.50,
        description: "Set of 4 stylish ceramic mugs for your morning coffee.",
        image: "images/product8.jpg", // Placeholder image path
        category: "Kitchenware"
    }
];

// Function to get all products (useful for product page)
function getAllProducts() {
    return mockProducts;
}

// Function to get a product by its ID (useful for cart and product details)
function getProductById(id) {
    return mockProducts.find(product => product.id === id);
}

// Note: Create an 'images' folder in your project root and add placeholder
// images named product1.jpg, product2.jpg, etc., or update the paths here. 