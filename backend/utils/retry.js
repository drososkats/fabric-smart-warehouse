// Retry pattern: retries an async operation with a fixed delay between attempts.
// Used for resilient connections to external services (e.g. MongoDB) that may
// not be immediately available at container startup.
async function retryWithDelay(fn, { retries = 3, delayMs = 2000, label = "operation" } = {}) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      console.error(`❌ ${label} attempt ${attempt}/${retries} failed:`, err.message);
      if (attempt < retries) {
        console.log(`⏳ Retrying ${label} in ${delayMs / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        console.error(`❌ All retry attempts exhausted for ${label}.`);
        throw err;
      }
    }
  }
}

module.exports = { retryWithDelay };
