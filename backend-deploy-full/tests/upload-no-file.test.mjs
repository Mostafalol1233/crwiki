import assert from 'assert'
import fetch from 'node-fetch'
import FormData from 'form-data'

const BASE = process.env.TEST_API_BASE || process.env.PUBLIC_BASE_URL || 'http://localhost:20032'

async function getCsrfToken() {
  const res = await fetch(`${BASE}/api/security/csrf-token`).catch(() => null)
  assert(res && res.ok, 'csrf-token endpoint should be available')
  const json = await res.json()
  assert(json && json.csrfToken, 'csrfToken should be present')
  return json.csrfToken
}

async function testPostNoFile() {
  const token = await getCsrfToken()
  const fd = new FormData()
  fd.append('folder', 'tests')
  const res = await fetch(`${BASE}/images/upload`, { method: 'POST', body: fd, headers: { 'X-CSRF-Token': token } }).catch(() => null)
  assert(res, 'POST request should return a response')
  assert.strictEqual(res.status, 400, 'POST /images/upload without file should be 400')
  const json = await res.json().catch(() => null)
  assert(json && json.ok === false, 'Response ok should be false')
}

async function run() {
  await testPostNoFile()
  console.log('OK: POST without file returns 400')
}

run().catch(err => {
  console.error('TEST FAILED:', err && err.message || err)
  process.exit(1)
})

