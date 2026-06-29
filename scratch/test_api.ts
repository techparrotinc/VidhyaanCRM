import { NextRequest } from 'next/server';
import { GET } from '../src/app/api/v1/campaigns/audience-count/route';

async function test() {
  console.log('--- CALLING API HANDLER DIRECTLY ---');
  
  // Construct a simulated NextRequest
  const req = new NextRequest('http://localhost:3000/api/v1/campaigns/audience-count?pool=LEADS', {
    method: 'GET',
    headers: {
      'x-user-id': 'cmqxu48k5001gqtyt4ana37lp',
      'x-user-role': 'ORG_ADMIN',
      'x-org-id': 'cmqxu48dy001cqtyti3zf0ywk',
      'x-user-name': 'Saran Kumar',
    }
  });

  try {
    const res = await GET(req);
    console.log('API Status:', res.status);
    const body = await res.json();
    console.log('API Body:', JSON.stringify(body, null, 2));
  } catch (error) {
    console.error('Error calling GET:', error);
  }
}

test();
