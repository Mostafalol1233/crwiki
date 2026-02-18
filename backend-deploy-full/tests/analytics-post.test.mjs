import assert from 'assert'
import fetch from 'node-fetch'

const BASE = process.env.TEST_API_BASE || process.env.PUBLIC_BASE_URL || 'http://localhost:20032'

async function post(url, body) {
  const res = await fetch(`${BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Analytics-Session': 'test-session', 'X-Geo-Country': 'US' },
    body: JSON.stringify(body)
  }).catch(() => null)
  assert(res, `POST ${url} should return a response`)
  const json = await res.json().catch(() => null)
  assert(json && json.ok === true, `POST ${url} should return ok:true`)
}

async function run() {
  await post(`/api/analytics/tutorials/abc/event`, { event: 'view', durationMs: 1234 })
  await post(`/api/analytics/sellers/demo-seller/event`, { event: 'click', timeSpentMs: 4321 })
  await post(`/api/analytics/announcements/xyz/event`, { event: 'learn_more_click' })
  console.log('OK: analytics POST endpoints respond')
}

run().catch(err => {
  console.error('TEST FAILED:', err && err.message || err)
  process.exit(1)
})

