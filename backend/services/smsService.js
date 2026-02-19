// Placeholder SMS service. Integrate with a provider like Twilio for production.
const sendSms = async (phone, message) => {
  // Intentionally a stub to keep local dev simple.
  console.log(`SMS stub to ${phone}: ${message}`);
  return { success: true };
};

module.exports = { sendSms };