function logStep(message) {
  console.log(`[ADSE] ${new Date().toISOString()} ${message}`);
}

module.exports = { logStep };
