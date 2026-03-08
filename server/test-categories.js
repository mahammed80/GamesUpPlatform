const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/functions/v1/make-server-f6f1fb51/system/categories',
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
      console.log('✅ Categories API Response Status:', res.statusCode);
      console.log('📦 Categories found:', response?.length || 0);
      
      if (response && response.length > 0) {
        console.log('\n📂 Available Categories:');
        response.forEach((cat, index) => {
          console.log(`${index + 1}. ${cat.name} (ID: ${cat.id}, Active: ${cat.isActive})`);
        });
      } else {
        console.log('❌ No categories found or invalid response');
        console.log('Raw response:', data);
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
