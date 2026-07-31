async function retry(operation, attempts = 2) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try { return await operation(attempt); } catch (error) { lastError = error; }
  }
  throw lastError;
}

module.exports = { retry };
