import assert from 'assert'
import fetch from 'node-fetch'

const BASE = process.env.TEST_API_BASE || process.env.PUBLIC_BASE_URL || 'http://51.75.118.151:20032'

async function testEndpointExists() {
  const res = await fetch(`${BASE}/images/upload`, { method: 'OPTIONS' }).catch(() => null)
  assert(res && [200,204].includes(res.status), 'images/upload endpoint should respond to OPTIONS')
}

async function run() {
  await testEndpointExists()
  console.log('OK: endpoint OPTIONS responsive')
}

run().catch(err => {
  console.error('TEST FAILED:', err && err.message || err)
  process.exit(1)
})
