// Run with: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../js/album-core.js');

const NOW = Date.parse('2026-10-24T10:00:00Z');
const MIN = 60 * 1000;

function album(uploaded, total, createdAt) {
  const files = [];
  for (let i = 0; i < total; i++) {
    files.push({ name: 'IMG_' + i + '.jpg', status: i < uploaded ? 'uploaded' : 'pending' });
  }
  return {
    code: 'k7m2x9qa',
    status: 'active',
    created_at: createdAt || '2026-10-24T09:50:00Z',
    expires_at: '2026-11-08T09:50:00Z',
    event: { code: 'demo', name: 'Demo', description: null, banner_url: null },
    total: total,
    uploaded: uploaded,
    files: files
  };
}

function ok(body) {
  return { status: 200, body: body };
}

test('readCode reads ?c= and normalises it', () => {
  assert.equal(core.readCode('?c=K7M2X9QA'), 'k7m2x9qa');
  assert.equal(core.readCode('?c=%20k7m2x9qa%20'), 'k7m2x9qa');
  assert.equal(core.readCode('?c=abc'), null);
  assert.equal(core.readCode(''), null);
});

test('short path regex matches album codes only', () => {
  assert.ok(core.SHORT_PATH_RE.test('/k7m2x9qa'));
  for (const p of ['/about', '/k7m2x9q0', '/k7m2x9qa1', '/price', '/k7m2x9q']) {
    assert.ok(!core.SHORT_PATH_RE.test(p), p);
  }
});

test('apiBase', () => {
  assert.equal(core.apiBase('localhost'), 'http://localhost:8010');
  assert.equal(core.apiBase('127.0.0.1'), 'http://localhost:8010');
  assert.equal(core.apiBase('happybooth.vn'), 'https://api.happybooth.vn');
});

test('deriveState kinds', () => {
  assert.equal(core.deriveState({ status: 404, body: null }, null, NOW).kind, 'not_found');
  const expired = core.deriveState({ status: 410, body: { status: 'expired', event: { name: 'E' } } }, null, NOW);
  assert.equal(expired.kind, 'expired');
  assert.equal(expired.album.event.name, 'E');
  assert.equal(core.deriveState(ok(album(0, 3)), null, NOW).kind, 'empty');
  assert.equal(core.deriveState(ok(album(1, 3)), null, NOW).kind, 'partial');
  assert.equal(core.deriveState(ok(album(3, 3)), null, NOW).kind, 'complete');
  assert.equal(core.deriveState({ status: 500, body: null }, null, NOW).kind, 'error');
  assert.equal(core.deriveState({ status: 0, body: null }, null, NOW).kind, 'error');
});

test('deriveState keeps the previous view when the network drops', () => {
  const prev = core.deriveState(ok(album(1, 3)), null, NOW);
  for (const status of [0, 502, 429]) {
    const s = core.deriveState({ status: status, body: null }, prev, NOW);
    assert.equal(s.kind, 'partial');
    assert.equal(s.offline, true);
    assert.equal(s.album, prev.album);
  }
  assert.equal(core.deriveState(ok(album(2, 3)), prev, NOW).offline, false);
});

test('expiring while the page is open switches to expired', () => {
  const prev = core.deriveState(ok(album(1, 3)), null, NOW);
  assert.equal(core.deriveState({ status: 410, body: { event: {} } }, prev, NOW).kind, 'expired');
});

test('isStale after two hours with photos still pending', () => {
  assert.equal(core.isStale(album(1, 3, '2026-10-24T07:59:00Z'), NOW), true);
  assert.equal(core.isStale(album(1, 3, '2026-10-24T08:01:00Z'), NOW), false);
  assert.equal(core.isStale(album(3, 3, '2026-10-24T07:00:00Z'), NOW), false);
  assert.equal(core.deriveState(ok(album(0, 2, '2026-10-24T07:00:00Z')), null, NOW).stale, true);
});

test('nextPollDelay', () => {
  const partial = core.deriveState(ok(album(1, 3)), null, NOW);
  assert.equal(core.nextPollDelay(partial, NOW - 1 * MIN, NOW), 5000);
  assert.equal(core.nextPollDelay(partial, NOW - 11 * MIN, NOW), 30000);
  assert.equal(core.nextPollDelay(core.deriveState(ok(album(3, 3)), null, NOW), NOW, NOW), null);
  assert.equal(core.nextPollDelay(core.deriveState({ status: 404 }, null, NOW), NOW, NOW), null);
  assert.equal(core.nextPollDelay(core.deriveState({ status: 410, body: {} }, null, NOW), NOW, NOW), null);
  assert.equal(core.nextPollDelay(core.deriveState({ status: 0 }, null, NOW), NOW, NOW), 5000);
});

test('indexAfterUpdate keeps the photo being viewed', () => {
  assert.equal(core.indexAfterUpdate([{ name: 'b' }, { name: 'c' }], 1, [{ name: 'a' }, { name: 'b' }, { name: 'c' }]), 2);
  assert.equal(core.indexAfterUpdate([{ name: 'x' }], 0, [{ name: 'a' }]), 0);
  assert.equal(core.indexAfterUpdate([], 0, [{ name: 'a' }]), 0);
});

test('wrapIndex', () => {
  assert.equal(core.wrapIndex(-1, 3), 2);
  assert.equal(core.wrapIndex(3, 3), 0);
  assert.equal(core.wrapIndex(1, 3), 1);
});

test('formatDate uses Vietnam time', () => {
  assert.equal(core.formatDate('2026-11-07T18:30:00Z'), '08/11/2026');
});

test('chooseIndex shows the first photo that arrives until the guest picks one', () => {
  const before = [{ name: 'a', status: 'pending' }, { name: 'b', status: 'pending' }];
  const after = [{ name: 'a', status: 'pending' }, { name: 'b', status: 'uploaded' }];
  assert.equal(core.chooseIndex(before, 0, after, false), 1);
  // Once the guest has picked a photo, never move them.
  assert.equal(core.chooseIndex(before, 0, after, true), 0);
  // Viewing an uploaded photo: stay on it.
  const viewing = [{ name: 'a', status: 'uploaded' }, { name: 'b', status: 'pending' }];
  const later = [{ name: 'a', status: 'uploaded' }, { name: 'b', status: 'uploaded' }];
  assert.equal(core.chooseIndex(viewing, 0, later, false), 0);
  // First load: the first uploaded photo.
  assert.equal(core.chooseIndex(null, 0, after, false), 1);
});

test('apiUrl only lets through URLs on the API origin', () => {
  const api = 'https://api.happybooth.vn';
  const good = 'https://api.happybooth.vn/public/albums/k7m2x9qa/files/a.jpg/preview.webp?v=1';
  assert.equal(core.apiUrl(good, api), good);
  assert.equal(core.apiUrl('javascript:alert(1)', api), '');
  assert.equal(core.apiUrl('https://evil.example/x.webp', api), '');
  assert.equal(core.apiUrl('', api), '');
  assert.equal(core.apiUrl(null, api), '');
});

test('deriveState coerces counts to numbers', () => {
  const s = core.deriveState({ status: 200, body: { uploaded: '1<b>', total: '3', files: [], created_at: '2026-10-24T09:50:00Z' } }, null, NOW);
  assert.equal(typeof s.album.uploaded, 'number');
  assert.equal(s.album.uploaded, 0);
  assert.equal(s.album.total, 3);
});
