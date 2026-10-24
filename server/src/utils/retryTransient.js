function isRetryable(error) {
  const status = Number(error?.status || error?.providerStatus);
  return status === 408 || status === 425 || status === 429 || status >= 500
    || ["ECONNRESET", "ETIMEDOUT", "EAI_AGAIN", "ENETWORK", "UND_ERR_CONNECT_TIMEOUT"].includes(error?.code)
    || error?.name === "TypeError";
}

async function retryTransient(operation, { attempts = 3, delayMs = 300 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try { return await operation(attempt); }
    catch (error) {
      lastError = error;
      if (attempt >= attempts || !isRetryable(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
  throw lastError;
}

module.exports = retryTransient;
