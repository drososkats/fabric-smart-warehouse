// idempotency tracking - remembers which requests have already been processed
const processedIdempotencyKeys = new Set();

function checkIdempotency(key) {
  if (key && processedIdempotencyKeys.has(key)) {
    return { duplicate: true };
  }
  if (key) {
    processedIdempotencyKeys.add(key);
  }
  return { duplicate: false };
}

module.exports = { checkIdempotency, processedIdempotencyKeys };