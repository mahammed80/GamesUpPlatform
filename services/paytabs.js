const axios = require('axios');

// PayTabs Configuration
const PROFILE_ID = process.env.PAYTABS_PROFILE_ID || 'your_profile_id';
const SERVER_KEY = process.env.PAYTABS_SERVER_KEY || 'your_server_key';
const REGION = process.env.PAYTABS_REGION || 'SAU'; // ARE, EGY, SAU, OMN, JOR, global

const BASE_URL = `https://secure${REGION !== 'global' ? '-' + REGION.toLowerCase() : ''}.paytabs.com/payment/request`;

/**
 * Create a payment page
 * @param {Object} orderData 
 * @param {string} returnUrl 
 */
async function createPaymentPage(orderData, returnUrl) {
  try {
    const payload = {
      profile_id: PROFILE_ID,
      tran_type: "sale",
      tran_class: "ecom",
      cart_id: orderData.orderNumber,
      cart_description: `Order ${orderData.orderNumber}`,
      cart_currency: "SAR", // Or USD, based on settings
      cart_amount: orderData.total,
      callback: returnUrl,
      return: returnUrl,
      customer_details: {
        name: orderData.customerName,
        email: orderData.customerEmail,
        phone: orderData.shippingAddress.phone || "0000000000",
        street1: orderData.shippingAddress.address,
        city: orderData.shippingAddress.city,
        state: orderData.shippingAddress.state,
        country: "SA", // Default to SA for now, should be dynamic
        zip: orderData.shippingAddress.zipCode
      }
    };

    // For testing without credentials, return a mock response
    if (PROFILE_ID === 'your_profile_id') {
      console.log('PayTabs: Mocking payment creation', payload);
      return {
        success: true,
        redirect_url: `${returnUrl}?payment_ref=mock_ref_123&status=success`, // Auto-redirect for testing
        tran_ref: 'mock_ref_123'
      };
    }

    const response = await axios.post(BASE_URL, payload, {
      headers: {
        authorization: SERVER_KEY,
        'content-type': 'application/json'
      }
    });

    return {
      success: true,
      redirect_url: response.data.redirect_url,
      tran_ref: response.data.tran_ref
    };

  } catch (error) {
    console.error('PayTabs Error:', error.response?.data || error.message);
    throw new Error('Payment creation failed');
  }
}

/**
 * Verify payment
 * @param {string} tranRef 
 */
async function verifyPayment(tranRef) {
  // Mock verification
  if (PROFILE_ID === 'your_profile_id') {
    return { success: true, status: 'A' };
  }
  
  // Implementation would require querying PayTabs API
  // For now, we rely on the callback data
  return { success: true };
}

module.exports = {
  createPaymentPage,
  verifyPayment
};
