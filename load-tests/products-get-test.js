import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up - 10 users
    { duration: '30s', target: 20 },   // Silver tier test
    { duration: '30s', target: 40 },   // Bronze tier test  
    { duration: '30s', target: 60 },   // Stress test
    { duration: '30s', target: 100 },  // Peak load
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: [
      'p(95)<100',  // Gold Tier: 95% of requests under 100ms
      'p(95)<250',  // Silver Tier: 95% of requests under 250ms
      'p(99)<500',  // Bronze Tier: 99% of requests under 500ms
    ],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get('http://127.0.0.1:32764/api/products');
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}