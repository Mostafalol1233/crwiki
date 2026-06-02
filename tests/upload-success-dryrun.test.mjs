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

async function testDryRunUpload() {
  const token = await getCsrfToken()
  const fd = new FormData()
  fd.append('file', Buffer.from('fake image bytes'), { filename: 'test.webp', contentType: 'image/webp' })
  fd.append('public_id', 'test')
  const res = await fetch(`${BASE}/images/upload`, { method: 'POST', body: fd, headers: { 'X-CSRF-Token': token } }).catch(() => null)
  assert(res, 'POST request should return a response')
  assert.strictEqual(res.status, 200, 'POST /images/upload should be 200 in dry-run')
  const json = await res.json()
  assert(json && json.ok === true, 'Response ok should be true')
  assert(json.domain_url && /\/image\/test\.webp$/.test(json.domain_url), 'domain_url should match /image/test.webp')
}

async function run() {
  await testDryRunUpload()
  console.log('OK: Dry-run upload returns expected domain_url')
}

run().catch(err => {
  console.error('TEST FAILED:', err && err.message || err)
  process.exit(1)
})

