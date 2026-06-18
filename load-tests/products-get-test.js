import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Phase 1: target 20 users
    { duration: '1m', target: 20 },   // Phase 2: maintain the load at 20 users for 1 min
    { duration: '30s', target: 0 },   // Phase 3: reduce the load
  ],
  thresholds: {
    // SLAs
    http_req_duration: [
      'p(95)<250', // Silver Tier SLA: 95% from requests to be completed 250ms
      'p(99)<500'  // Bronze Tier SLA: Το 99% from requests to be completed under 500ms
    ],
    http_req_failed: ['rate<0.01'], // less than 1% of requests should fail

  },
};

export default function () {
  // we assess the backend via the NodePort
  const url = 'http://127.0.0.1:32764/api/products'; 
  const res = http.get(url);

  // we check whether the backend responded correctly (status 200)
  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  // time simulation for a user take to read the page (1sec)
  sleep(1); 
}