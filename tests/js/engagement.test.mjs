import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import test from 'node:test';
import { JSDOM } from 'jsdom';
const root = resolve(import.meta.dirname, '../..');
const fixture = () => execFileSync('php', [resolve(root, 'tests/php/engagement-fixture.php')], { encoding: 'utf8' });
async function browser(html = fixture()) {
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://example.test/wp-admin/plugins.php' });
  dom.window.HTMLElement.prototype.getClientRects = () => [{ width: 1, height: 1 }];
  for (const name of ['modal', 'announcements', 'deactivation', 'announcements', 'deactivation']) dom.window.eval(await readFile(resolve(root, `dist/js/${name}.js`), 'utf8'));
  return dom;
}
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const item = { id: 'remote:1', title: '<img src=x>', description_html: '<strong>Safe</strong>', date: '2026-01-01T00:00:00Z', state: 'active', severity: 'warning', url: 'javascript:bad()', cta_label: 'Bad' };

test('drawer manages tabs, focus, badge, safe fields and initializes once', async () => {
  const { window: w } = await browser(); const d = w.document; const modal = d.getElementById('center');
  const api = w.WebiliaUI.announcements.init(modal, { items: [item] });
  assert.equal(api, w.WebiliaUI.announcements.init(modal));
  assert.equal(modal.querySelector('h3').textContent, item.title); assert.equal(modal.querySelector('a'), null);
  const trigger = d.querySelector('[data-wui-modal-open]'); trigger.focus(); trigger.click();
  assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  const first = modal.querySelector('[role="tab"]'); first.focus(); first.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.equal(modal.querySelector('[data-wui-announcement-list="active"]').hidden, true);
  assert.equal(d.activeElement.dataset.wuiAnnouncementTab, 'dismissed');
  d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(modal.hidden, true); assert.equal(d.activeElement, trigger); assert.equal(trigger.getAttribute('aria-expanded'), 'false');
});

test('dismissal synchronizes matching IDs across centers and retains an error on failure', async () => {
  const { window: w } = await browser(); const d = w.document;
  const a = d.getElementById('center'); const b = a.cloneNode(true); b.id = 'second'; d.body.append(b);
  let calls = 0;
  w.WebiliaUI.announcements.init(a, { items: [item], scope: 'site', dismiss: async () => { calls++; } });
  w.WebiliaUI.announcements.init(b, { items: [item, { ...item, id: 'remote:2' }], scope: 'site', dismiss: async () => { throw new Error('no'); } });
  a.querySelector('[data-wui-announcement-dismiss]').click(); await tick();
  assert.equal(calls, 1); assert.equal(a.querySelector('[data-wui-announcement-count]'), null);
  assert.equal(d.querySelector('[data-wui-announcement-count]').hidden, true);
  assert.equal(b.querySelectorAll('[data-wui-announcement-list="active"] article').length, 1);
  assert.equal(b.querySelectorAll('[data-wui-announcement-list="dismissed"] article').length, 1);
  const button = b.querySelector('[data-wui-announcement-dismiss]'); button.click(); await tick();
  assert.equal(button.disabled, false); assert.match(b.querySelector('[role="status"]').textContent, /unavailable/);
});

test('unavailable/loading states recover through bounded callback initialization', async () => {
  const { window: w } = await browser(); const modal = w.document.getElementById('center'); let done;
  const api = w.WebiliaUI.announcements.init(modal, { items: [], unavailable: true, load: () => new Promise(resolve => { done = resolve; }) });
  assert.match(modal.querySelector('[role="status"]').textContent, /unavailable/);
  const loading = api.refresh(); assert.equal(modal.querySelector('[data-wui-announcement-center]').getAttribute('aria-busy'), 'true');
  done({ items: [item], unavailable: false }); await loading;
  assert.equal(modal.querySelector('[role="status"]').textContent, ''); assert.equal(modal.querySelectorAll('article').length, 1);
});

test('feedback submits only the selected details; failure leaves Skip available; cancel sends nothing', async () => {
  const { window: w } = await browser(); const modal = w.document.getElementById('feedback'); let calls = 0, skipped = 0, payload;
  w.WebiliaUI.deactivation.init(modal, { submit: async data => { calls++; payload = data; throw new Error('Failed'); }, skip: () => { skipped++; } });
  w.WebiliaUI.deactivation.init(modal, { submit: () => { throw new Error('duplicate'); } });
  w.WebiliaUI.modal.open(modal);
  modal.querySelector('[type="submit"]').click(); await tick(); assert.equal(calls, 0);
  modal.querySelector('[value="other"]').click(); modal.querySelector('textarea').value = 'Comment';
  modal.querySelector('[type="submit"]').click(); await tick(); assert.equal(calls, 1); assert.equal(payload.details, 'Comment');
  assert.equal(modal.querySelector('[data-wui-feedback-error]').textContent, 'Failed');
  modal.querySelector('[data-wui-feedback-skip]').click(); assert.equal(skipped, 1); assert.equal(calls, 1);
  w.WebiliaUI.modal.close(modal); assert.equal(calls, 1);
});

test('cancelling and reopening during submission cannot deactivate on a late success', async () => {
  const { window: w } = await browser(); const modal = w.document.getElementById('feedback'); let done, completed = 0;
  w.WebiliaUI.deactivation.init(modal, { submit: () => new Promise(resolve => { done = resolve; }), complete: () => { completed++; } });
  w.WebiliaUI.modal.open(modal); modal.querySelector('[value="temporary"]').click(); modal.querySelector('[type="submit"]').click();
  w.WebiliaUI.modal.close(modal); w.WebiliaUI.modal.open(modal); done(); await tick(); assert.equal(completed, 0);
});


test('numeric IDs synchronize and successful dismissals survive older load responses', async () => {
  const { window: w } = await browser(); const d = w.document;
  const a = d.getElementById('center'); const b = a.cloneNode(true); b.id = 'second'; d.body.append(b);
  let finishLoad, dismissed;
  const numeric = { ...item, id: 123 };
  w.WebiliaUI.announcements.init(a, { items: [numeric], scope: 'site', dismiss: async id => { dismissed = id; } });
  const api = w.WebiliaUI.announcements.init(b, { items: [numeric], scope: 'site', load: () => new Promise(resolve => { finishLoad = resolve; }) });
  const refresh = api.refresh();
  a.querySelector('[data-wui-announcement-dismiss]').click(); await tick();
  assert.equal(dismissed, '123');
  assert.equal(a.querySelectorAll('[data-wui-announcement-list="active"] article').length, 0);
  assert.equal(b.querySelectorAll('[data-wui-announcement-list="dismissed"] article').length, 1);
  finishLoad({ items: [numeric, { ...item, id: 456 }] }); await refresh;
  assert.equal(b.querySelectorAll('[data-wui-announcement-list="dismissed"] article').length, 1);
  assert.equal(b.querySelectorAll('[data-wui-announcement-list="active"] article').length, 1);
  assert.equal(b.querySelector('[data-wui-announcement-list="active"] article').dataset.wuiAnnouncementId, '456');
  assert.equal(d.querySelector('[data-wui-announcement-count]').hidden, true);
});

test('configured feedback errors take priority and null rejections recover controls', async () => {
  const { window: w } = await browser(); const modal = w.document.getElementById('feedback');
  let failure = new Error('Raw transport message');
  w.WebiliaUI.deactivation.init(modal, { error: 'Translated error', submit: async () => { throw failure; } });
  w.WebiliaUI.modal.open(modal); modal.querySelector('[value="other"]').click();
  const submit = modal.querySelector('[type="submit"]'); submit.click(); await tick();
  assert.equal(modal.querySelector('[data-wui-feedback-error]').textContent, 'Translated error');
  failure = null; submit.click(); await tick();
  assert.equal(modal.querySelector('[data-wui-feedback-error]').textContent, 'Translated error');
  assert.equal(submit.disabled, false);
  assert.equal(modal.querySelector('[data-wui-feedback-skip]').disabled, false);
});

test('terminal feedback actions close without also reporting cancellation', async () => {
  for (const outcome of ['skip', 'submitted']) {
    const { window: w } = await browser(); const modal = w.document.getElementById('feedback');
    let cancels = 0, completed = 0; const events = [];
    for (const name of ['skip', 'submitted', 'cancel']) modal.addEventListener(`wui:feedback:${name}`, () => events.push(name));
    w.WebiliaUI.deactivation.init(modal, { submit: async () => {},
      skip: () => w.WebiliaUI.modal.close(modal), cancel: () => { cancels++; }, complete: () => { completed++; } });
    modal.addEventListener('wui:feedback:submitted', () => w.WebiliaUI.modal.close(modal));
    w.WebiliaUI.modal.open(modal);
    if (outcome === 'skip') modal.querySelector('[data-wui-feedback-skip]').click();
    else { modal.querySelector('[value="temporary"]').click(); modal.querySelector('[type="submit"]').click(); await tick(); }
    assert.equal(modal.hidden, true); assert.deepEqual(events, [outcome]); assert.equal(cancels, 0);
    assert.equal(completed, outcome === 'submitted' ? 1 : 0);
    w.WebiliaUI.modal.open(modal); w.WebiliaUI.modal.close(modal);
    assert.equal(cancels, 1); assert.deepEqual(events, [outcome, 'cancel']);
  }
});

test('server-rendered items survive dismissal without duplicating initialization data', async () => {
  const html = execFileSync('php', ['-r', `require '${root}/tests/php/bootstrap.php'; echo \\Webilia\\UI\\AnnouncementCenter::render(['id' => 'seeded', 'active' => [['id' => 1, 'title' => 'First'], ['id' => 2, 'title' => 'Second']], 'dismissed' => [['id' => 3, 'title' => 'Previous']]]);`], { encoding: 'utf8' });
  const { window: w } = await browser(html); const modal = w.document.getElementById('seeded');
  w.WebiliaUI.announcements.init(modal, { dismiss: async () => {} });
  modal.querySelector('[data-wui-announcement-dismiss]').click(); await tick();
  assert.equal(modal.querySelectorAll('[data-wui-announcement-list="active"] article').length, 1);
  assert.equal(modal.querySelector('[data-wui-announcement-list="active"] h3').textContent, 'Second');
  assert.equal(modal.querySelectorAll('[data-wui-announcement-list="dismissed"] article').length, 2);
});

test('reopening owns new submission controls despite an older pending request', async () => {
  const { window: w } = await browser(); const modal = w.document.getElementById('feedback');
  const pending = []; let completed = 0;
  w.WebiliaUI.deactivation.init(modal, { submit: () => new Promise(resolve => pending.push(resolve)), complete: () => { completed++; } });
  w.WebiliaUI.modal.open(modal); modal.querySelector('[value="temporary"]').click();
  const button = modal.querySelector('[type="submit"]'); const form = modal.querySelector('form');
  button.click(); assert.equal(button.disabled, true);
  w.WebiliaUI.modal.close(modal); w.WebiliaUI.modal.open(modal);
  assert.equal(button.disabled, false); assert.equal(form.hasAttribute('aria-busy'), false);
  button.click(); assert.equal(pending.length, 2);
  pending[0](); await tick();
  assert.equal(completed, 0); assert.equal(button.disabled, true); assert.equal(form.getAttribute('aria-busy'), 'true');
  pending[1](); await tick();
  assert.equal(completed, 1); assert.equal(button.disabled, false); assert.equal(form.hasAttribute('aria-busy'), false);
});

test('relative day labels use local calendar dates around midnight and long same-day intervals', async () => {
  for (const [now, earlier, expected] of [
    [new Date(2026, 9, 12, 23, 30), new Date(2026, 9, 12, 0, 10), 'today'],
    [new Date(2026, 9, 12, 0, 10), new Date(2026, 9, 11, 23, 30), 'yesterday'],
    [new Date(2026, 2, 9, 0, 10), new Date(2026, 2, 8, 23, 30), 'yesterday'],
  ]) {
    const { window: w } = await browser(); w.Date.now = () => now.getTime();
    const modal = w.document.getElementById('center');
    w.WebiliaUI.announcements.init(modal, { locale: 'en', items: [{ ...item, date: earlier.toISOString() }] });
    assert.equal(modal.querySelector('time').textContent, expected);
  }
});
