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

