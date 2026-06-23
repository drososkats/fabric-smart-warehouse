import http from 'k6/http';
import { check, sleep } from 'k6';
// library for UUIDs
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export const options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '30s', target: 10 },
    { duration: '30s', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: [
      'p(95)<500',
      'p(99)<1000',
    ],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  // generate 100% unique ID 
  const uniqueId = uuidv4();

  const data = {
    name: `TestProduct-${uniqueId}`, // unique name
    price: '99.99',
    stock: '10',
    category: 'Bag',
    idempotencyKey: uniqueId,        // unique key
    image: http.file('dummy image content', 'test-image.jpg', 'image/jpeg'),
  };

  const res = http.post('http://127.0.0.1:32764/api/products', data);

  if (res.status !== 201) {
     console.log(`Failed! Status: ${res.status}, Body: ${res.body}`);
  }

  check(res, {
    'status is 201': (r) => r.status === 201,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(2);
}