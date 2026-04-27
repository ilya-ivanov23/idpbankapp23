import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '20s', target: 100 },
    { duration: '60s', target: 100 },
    { duration: '20s', target: 0 },
  ],
};

export default function () {
  const res = http.get('https://idpbank.app/');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
