const axios = require('axios');

// OTO Configuration
const OTO_REFRESH_TOKEN = process.env.OTO_REFRESH_TOKEN || 'your_refresh_token';
const OTO_CLIENT_ID = process.env.OTO_CLIENT_ID || 'your_client_id'; // if needed
const BASE_URL = process.env.OTO_ENV === 'production' 
  ? 'https://api.oto.sa/rest/v1' 
  : 'https://api-test.oto.sa/rest/v1';

let accessToken = null;

async function getAccessToken() {
  if (accessToken) return accessToken;
  
  // Mock token for testing
  if (OTO_REFRESH_TOKEN === 'your_refresh_token') {
    return 'mock_access_token';
  }

  try {
    const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
      refresh_token: OTO_REFRESH_TOKEN
    });
    accessToken = response.data.access_token;
    return accessToken;
  } catch (error) {
    console.error('OTO Auth Error:', error.message);
    throw error;
  }
}

/**
 * Create a shipment in OTO
 * @param {Object} orderData 
 */
async function createShipment(orderData) {
  try {
    const token = await getAccessToken();
    
    // Mock shipment creation
    if (OTO_REFRESH_TOKEN === 'your_refresh_token') {
      console.log('OTO: Mocking shipment creation', orderData);
      return {
        success: true,
        otoId: `OTO-${Math.floor(Math.random() * 10000)}`,
        awb: `AWB-${Math.floor(Math.random() * 10000)}`,
        labelUrl: 'https://example.com/label.pdf'
      };
    }

    const payload = {
      orderId: orderData.orderNumber,
      payment_method: 'paid', // Since we use PayTabs
      amount: orderData.total,
      amount_due: 0,
      customer: {
        name: orderData.customerName,
        email: orderData.customerEmail,
        mobile: orderData.shippingAddress.phone,
        address: orderData.shippingAddress.address,
        city: orderData.shippingAddress.city,
        country: "SA" // Default
      },
      items: orderData.items.map(item => ({
        name: item.name,
        price: item.price,
        qty: item.quantity,
        sku: item.id || 'sku'
      }))
    };

    const response = await axios.post(`${BASE_URL}/shipment/create`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return {
      success: true,
      otoId: response.data.otoId,
      awb: response.data.awb,
      labelUrl: response.data.labelUrl
    };

  } catch (error) {
    console.error('OTO Error:', error.response?.data || error.message);
    throw new Error('Shipment creation failed');
  }
}

/**
 * Check delivery service availability/rates
 * @param {string} city 
 */
async function checkDelivery(city) {
  // Mock response
  return {
    available: true,
    companies: [
      { name: 'Aramex', price: 25, time: '2-3 days' },
      { name: 'SMSA', price: 30, time: '1-2 days' }
    ]
  };
}

module.exports = {
  createShipment,
  checkDelivery
};
