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
      console.log('✅ Checking slots structure for Products Inventory...\n');
      
      if (response.products && response.products.length > 0) {
        let productsWithSlots = 0;
        
        response.products.forEach((product, index) => {
          if (product.digital_items && product.digital_items.length > 0) {
            productsWithSlots++;
            console.log(`${productsWithSlots}. ${product.name}:`);
            
            product.digital_items.forEach((item, itemIndex) => {
              console.log(`   🎮 Digital Item ${itemIndex + 1}:`);
              console.log(`      📧 Email: ${item.email}`);
              console.log(`      🔑 Slots: ${Object.keys(item.slots || {}).length} available`);
              
              if (item.slots) {
                Object.entries(item.slots).forEach(([slotType, slotData]) => {
                  console.log(`         • ${slotType}: ${slotData.sold ? 'Sold' : 'Available'} (${slotData.code})`);
                });
              }
              
              console.log(`      📋 Total Codes: ${item.totalCodes || 0}`);
              console.log(`      🔄 Backup Codes: ${item.backupCodes ? item.backupCodes.split('\n').length : 0}`);
              console.log('');
            });
          }
        });
        
        console.log(`📊 Summary: ${productsWithSlots} products with slot data ready for Products Inventory`);
        console.log(`🎯 Each product shows in dropdown with: Primary ps4, Primary ps5, Secondary, Offline ps4, Offline ps5`);
      }
    } catch (e) {
      console.error('❌ Error parsing response:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
});

req.end();
