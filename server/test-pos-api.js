const BASE_URL = 'http://localhost:5000';

async function testPOSAPI() {
  try {
    console.log('🔄 Testing POS API endpoint...');
    
    // Test the public products endpoint that POS uses
    console.log('\n📦 Testing /public/products endpoint...');
    const response = await fetch(`${BASE_URL}/public/products`);
    
    console.log(`✅ Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📊 Response data structure:');
      console.log('- Products array length:', data.products?.length || 0);
      
      if (data.products && data.products.length > 0) {
        console.log('\n🎮 Sample product data:');
        const sample = data.products[0];
        console.log('- ID:', sample.id);
        console.log('- Name:', sample.name);
        console.log('- Price:', sample.price);
        console.log('- Digital items type:', typeof sample.digital_items);
        console.log('- Digital items present:', !!sample.digital_items);
        
        if (sample.digital_items) {
          try {
            const digitalItems = typeof sample.digital_items === 'string' 
              ? JSON.parse(sample.digital_items) 
              : sample.digital_items;
            
            console.log('- Digital items count:', digitalItems.length);
            if (digitalItems.length > 0) {
              const item = digitalItems[0];
              console.log('- Sample digital item slots:', Object.keys(item.slots || {}));
              
              // Check for offline slots
              const offlinePS4 = item.slots?.['Offline ps4'];
              const offlinePS5 = item.slots?.['Offline ps5'];
              
              console.log('- Offline PS4 available:', offlinePS4 && !offlinePS4.sold ? 'YES' : 'NO');
              console.log('- Offline PS5 available:', offlinePS5 && !offlinePS5.sold ? 'YES' : 'NO');
            }
          } catch (e) {
            console.log('- Error parsing digital items:', e.message);
          }
        }
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
    }
    
  } catch (error) {
    console.error('❌ API Test Error:', error.message);
  }
}

testPOSAPI();
