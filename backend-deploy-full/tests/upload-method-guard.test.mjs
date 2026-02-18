import assert from 'assert'
import fetch from 'node-fetch'

const BASE = process.env.TEST_API_BASE || process.env.PUBLIC_BASE_URL || 'http://localhost:20032'

async function testGetIs405() {
  const res = await fetch(`${BASE}/images/upload`, { method: 'GET' }).catch(() => null)
  assert(res, 'GET request should return a response')
  assert.strictEqual(res.status, 405, 'GET /images/upload should be 405 Method Not Allowed')
}

async function run() {
  await testGetIs405()
  console.log('OK: method guard returns 405 for GET')
}

run().catch(err => {
  console.error('TEST FAILED:', err && err.message || err)
  process.exit(1)
})

