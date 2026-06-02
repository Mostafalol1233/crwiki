import assert from 'assert'
import fetch from 'node-fetch'

const BASE = process.env.TEST_API_BASE || process.env.PUBLIC_BASE_URL || 'http://localhost:20032'
const ORIGIN = process.env.TEST_ORIGIN || process.env.FRONTEND_URL || 'https://crossfire.wiki'

async function testOptionsPreflight() {
  const res = await fetch(`${BASE}/images/upload`, {
    method: 'OPTIONS',
    headers: {
      'Origin': ORIGIN,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, X-CSRF-Token'
    }
  }).catch(() => null)
  assert(res, 'OPTIONS preflight should return a response')
  assert([200,204].includes(res.status), 'OPTIONS should be 200 or 204')
  const allowOrigin = res.headers.get('access-control-allow-origin')
  assert(allowOrigin === ORIGIN || allowOrigin === '*', 'Allow-Origin should match origin or be *')
}

async function run() {
  await testOptionsPreflight()
  console.log('OK: CORS preflight responds correctly')
}

run().catch(err => {
  console.error('TEST FAILED:', err && err.message || err)
  process.exit(1)
})

