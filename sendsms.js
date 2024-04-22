// sendsms.js

const twilio = require('twilio');
require('dotenv').config();

const sendSMS = async (data) => {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  data.forEach(async (item) => {
    if (item.status === 'Approved' || item.status === 'Received') {
      try {
        // Modify the message body to include more details
        const messageBody = `Your claim with ID ${item._id} has been ${item.status}. Details: Claim Type - ${item.claim_type}, Amount - ${item.amount}, Submitted At - ${item.submitted_at}, Updated At - ${item.updated_at}.`;
        
        await client.messages.create({
          body: messageBody,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: item.phone_number
        });
        console.log(`Message sent to ${item.phone_number}`);
      } catch (error) {
        console.error(`Error sending message to ${item.phone_number}:`, error);
      }
    }
  });
};

module.exports = sendSMS;
