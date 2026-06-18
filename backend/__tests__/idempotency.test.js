const { checkIdempotency } = require('../utils/idempotency');

describe('Idempotency check', () => {
  test('πρώτο request με νέο key δεν είναι duplicate', () => {
    const result = checkIdempotency('order-123');
    expect(result.duplicate).toBe(false);
  });

  test('δεύτερο request με το ΙΔΙΟ key μαρκάρεται ως duplicate', () => {
    checkIdempotency('order-456');
    const result = checkIdempotency('order-456');
    expect(result.duplicate).toBe(true);
  });

  test('requests χωρίς key δεν μαρκάρονται ποτέ ως duplicate', () => {
    const result = checkIdempotency(undefined);
    expect(result.duplicate).toBe(false);
  });
});