
const axios = require('axios');

// Assuming server is running on localhost:5000
const BASE_URL = 'http://localhost:5000/functions/v1/make-server-f6f1fb51';

async function checkEndpoints() {
  try {
    // 1. Check Products
    console.log('--- Checking Products ---');
    const productsRes = await axios.get(`${BASE_URL}/products`);
    const products = productsRes.data.products || productsRes.data;
    console.log(`Found ${products.length} products`);
    if (products.length > 0) {
      console.log('Sample Product:', JSON.stringify(products[0], null, 2));
      // Check for categories
      const categories = [...new Set(products.map(p => p.category))];
      console.log('Derived Categories:', categories);
    }

    // 2. Check Customers
    // Note: /admin/customers usually requires authentication. 
    // I'll skip auth for now and see if it fails, or if I can use a simpler endpoint.
    // If it fails, I'll assume the structure based on typical patterns or read the server code.
    console.log('\n--- Checking Customers (Authentication might be needed) ---');
    try {
        // Need to simulate a token or check if endpoint is protected.
        // I'll just check the server code for this one instead of struggling with auth in a script.
        console.log('Skipping direct customer fetch in script, will check server code.');
    } catch (error) {
        console.log('Customer fetch failed:', error.message);
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
        console.error('Response data:', error.response.data);
    }
  }
}

checkEndpoints();
