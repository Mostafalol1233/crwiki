import test from 'node:test';
import assert from 'node:assert/strict';
import { buildComparisonRows, getRegionBySlug, FORUM_POSTS, WEAPONS } from '../shared/crossfire-regions.js';

test('buildComparisonRows returns expected rows for AK47 Beast', () => {
  const rows = buildComparisonRows('ak47-beast');

  assert.equal(rows.length, 7);
  assert.equal(rows[0].region, 'west');
  assert.equal(rows[0].available, true);
  assert.equal(rows[0].damage, 35);
  assert.equal(rows[2].region, 'vietnam');
  assert.equal(rows[2].available, false);
  assert.equal(rows[4].region, 'philippines');
  assert.equal(rows[4].available, true);
});

test('getRegionBySlug resolves CrossFire China correctly', () => {
  const region = getRegionBySlug('china');

  assert.ok(region);
  assert.equal(region.name, 'CrossFire China');
  assert.equal(region.base, 'cf.qq.com');
});

test('wiki data includes expanded weapons and forum posts', () => {
  assert.ok(WEAPONS.length >= 10);
  assert.ok(FORUM_POSTS.length >= 10);
  assert.ok(WEAPONS.some((weapon) => weapon.slug === 'ak12-commando'));
  assert.ok(FORUM_POSTS.some((post) => post.slug === 'new-region-weapon-tracker'));
});

test('supports Korea and Russia in the canonical region catalog', () => {
  assert.ok(getRegionBySlug('korea'));
  assert.ok(getRegionBySlug('russia'));
  assert.equal(getRegionBySlug('korea').name, 'CrossFire Korea');
  assert.equal(getRegionBySlug('russia').name, 'CrossFire Russia');
});

test('comparison rows include the new regions', () => {
  const rows = buildComparisonRows('ak47-beast');
  const slugs = rows.map((row) => row.region);
  assert.ok(slugs.includes('korea'));
  assert.ok(slugs.includes('russia'));
});
