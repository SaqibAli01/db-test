const axios = require('axios'); // for Meta / or Twilio SDK as alternative
const twilio = require('twilio');

const provider = process.env.WHATSAPP_PROVIDER || 'twilio';

// Validate required environment variables
if (provider === 'twilio' && (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN)) {
  console.warn('Warning: Twilio configuration is incomplete. WhatsApp sending will fail.');
}

let client;
if (provider === 'twilio') {
  client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

async function sendWhatsApp(toMobile, message) {
  try {
    if (provider === 'twilio') {
      // Twilio WhatsApp (toMobile must be in format +92...)
      const from = process.env.TWILIO_WHATSAPP_FROM; // e.g., 'whatsapp:+14155238886' (Twilio sandbox)
      const to = `whatsapp:${toMobile}`;
      const msg = await client.messages.create({ body: message, from, to });
      return msg;
    } else {
      // Meta Cloud API example
      const token = process.env.META_WHATSAPP_TOKEN;
      const phoneId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
      const url = `https://graph.facebook.com/v15.0/${phoneId}/messages`;
      const res = await axios.post(url, {
        messaging_product: 'whatsapp',
        to: toMobile.replace('+',''),
        type: 'text',
        text: { body: message }
      }, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    }
  } catch (err) {
    console.error('WhatsApp send error:', err?.message || err);
    throw err;
  }
}

module.exports = { sendWhatsApp };
