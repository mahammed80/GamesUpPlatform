const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/functions/v1/make-server-f6f1fb51/products',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('✅ API Response Status:', res.statusCode);
      console.log('📦 Products found:', response.products?.length || 0);
      
      if (response.products && response.products.length > 0) {
        console.log(`\n🎮 Products with digital items:`);
        let productsWithItems = 0;
        
        response.products.forEach((product, index) => {
          if (product.digital_items && product.digital_items.length > 0) {
            productsWithItems++;
            console.log(`\n${productsWithItems}. ${product.name} (ID: ${product.id})`);
            console.log(`   📧 Digital Items: ${product.digital_items.length}`);
            
            const firstItem = product.digital_items[0];
            console.log(`      Email: ${firstItem.email}`);
            console.log(`      Password: ${firstItem.password ? '***' : 'N/A'}`);
            console.log(`      Code: ${firstItem.code}`);
            console.log(`      Region: ${firstItem.region}`);
            console.log(`      Online ID: ${firstItem.onlineId}`);
          }
        });
        
        console.log(`\n📊 Summary: ${productsWithItems} out of ${response.products.length} products have digital items`);
      }
    } catch (e) {
      console.error('❌ Error parsing response:', e.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
});

req.end();
