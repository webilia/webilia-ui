import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import postcss from 'postcss';

const root = resolve(import.meta.dirname, '../..');

async function browserWith(scripts, html) {
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://example.com/' });
  dom.window.HTMLElement.prototype.getClientRects = function () { return [{ width: 1, height: 1 }]; };
  for (const script of scripts) {
    dom.window.eval(await readFile(resolve(root, `dist/js/${script}.js`), 'utf8'));
  }
  return dom;
}

test('declarative modal restores focus and initializes once', async () => {
  const html = '<button id="trigger" data-wui-modal-open="m">Open</button><div id="m" class="wui wui-modal" data-wui-modal hidden><div class="wui-modal__backdrop" data-wui-modal-close></div><div class="wui-modal__panel" role="dialog" tabindex="-1"><button id="inside" data-wui-modal-close>Close</button></div></div>';
  const dom = await browserWith(['modal', 'modal'], html);
  const { document, KeyboardEvent } = dom.window;
  const trigger = document.getElementById('trigger');
  const modal = document.getElementById('m');
  let opened = 0;
  modal.addEventListener('wui:modal:opened', () => { opened++; });
  trigger.focus();
  trigger.click();
  assert.equal(modal.hidden, false);
  assert.equal(opened, 1);
  assert.equal(document.activeElement.id, 'inside');
  modal.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
  assert.equal(document.activeElement.id, 'inside');
  modal.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(modal.hidden, true);
  assert.equal(document.activeElement, trigger);
  trigger.click();
  modal.querySelector('.wui-modal__backdrop').click();
  assert.equal(modal.hidden, true);
  dom.window.close();
});

test('confirmation resolves and removes its dialog', async () => {
  const dom = await browserWith(['modal'], '<button id="trigger">Open</button>');
  const { document, WebiliaUI } = dom.window;
  document.getElementById('trigger').focus();
  const result = WebiliaUI.modal.confirm({ title: 'Delete?', message: 'This cannot be undone.', confirmLabel: 'Delete', danger: true });
  document.querySelector('[data-wui-confirm-accept]').click();
  assert.equal(await result, true);
  assert.equal(document.querySelector('[data-wui-modal]'), null);
  assert.equal(document.activeElement.id, 'trigger');
  const canceled = WebiliaUI.modal.confirm({ title: 'Cancel?' });
  document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(await canceled, false);
  dom.window.close();
});

test('busy state restores only controls it disabled', async () => {
  const dom = await browserWith(['busy'], '<div id="form"><button id="a">A</button><button id="b" disabled>B</button></div>');
  const { document, WebiliaUI } = dom.window;
  const form = document.getElementById('form');
  WebiliaUI.busy.setBusy(form, true);
  assert.equal(form.getAttribute('aria-busy'), 'true');
  assert.equal(document.getElementById('a').disabled, true);
  WebiliaUI.busy.setBusy(form, false);
  assert.equal(document.getElementById('a').disabled, false);
  assert.equal(document.getElementById('b').disabled, true);
  dom.window.close();
});

test('toast renders text safely, updates, and dismisses independently', async () => {
  const dom = await browserWith(['toast', 'toast'], '<div class="wui" id="root"></div>');
  const { document, WebiliaUI } = dom.window;
  const root = document.getElementById('root');
  const first = WebiliaUI.toast.show('<b>Saved</b>', { root, tone: 'success', durationMs: 0, closeLabel: 'Close message' });
  const second = WebiliaUI.toast.show('Another result', { root, tone: 'info', durationMs: 0 });
  assert.equal(root.querySelectorAll('.wui-toast-region').length, 1);
  assert.equal(root.querySelectorAll('.wui-toast').length, 2);
  assert.equal(first.element.querySelector('.wui-toast__message').textContent, '<b>Saved</b>');
  assert.equal(first.element.querySelector('b'), null);
  assert.equal(first.element.querySelector('.wui-toast__icon').classList.contains('wui-icon--checkmark-circle'), true);
  assert.equal(first.element.querySelector('button').getAttribute('aria-label'), 'Close message');
  first.update('Failed', { tone: 'danger', durationMs: 0 });
  assert.equal(first.element.getAttribute('role'), 'alert');
  assert.equal(first.element.querySelector('.wui-toast__message').textContent, 'Failed');
  first.element.querySelector('button').click();
  assert.equal(first.element.isConnected, false);
  assert.equal(second.element.isConnected, true);
  second.dismiss();
  assert.equal(root.querySelector('.wui-toast-region'), null);
  dom.window.close();
});

test('toast timeout pauses on hover and focus, then resumes', async () => {
  const dom = await browserWith(['toast'], '<div class="wui" id="root"></div>');
  const { document, MouseEvent, WebiliaUI } = dom.window;
  const toast = WebiliaUI.toast.show('Saved', { root: document.getElementById('root'), durationMs: 70 });
  toast.element.dispatchEvent(new MouseEvent('mouseenter'));
  await new Promise((resolve) => setTimeout(resolve, 90));
  assert.equal(toast.element.isConnected, true);
  toast.element.querySelector('button').focus();
  toast.element.dispatchEvent(new MouseEvent('mouseleave'));
  await new Promise((resolve) => setTimeout(resolve, 90));
  assert.equal(toast.element.isConnected, true);
  toast.element.querySelector('button').blur();
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(toast.element.isConnected, false);
  dom.window.close();
});

test('toast without a root uses a scoped portal and loading can become timed success', async () => {
  const dom = await browserWith(['toast'], '<p>Outside Webilia UI</p>');
  const { document, WebiliaUI } = dom.window;
  const toast = WebiliaUI.toast.show('Working', { tone: 'loading', closeLabel: 'Dismiss' });
  assert.equal(document.querySelector('body > .wui[data-wui-toast-scope] .wui-toast--loading'), toast.element);
  assert.equal(toast.element.querySelector('.wui-toast__progress'), null);
  toast.update('Done', { tone: 'success', durationMs: 25 });
  assert.ok(toast.element.querySelector('.wui-toast__progress'));
  await new Promise((resolve) => setTimeout(resolve, 45));
  assert.equal(document.querySelector('[data-wui-toast-scope]'), null);
  dom.window.close();
});

test('icon stylesheet maps all 139 glyphs to a packaged font', async () => {
  const css = await readFile(resolve(root, 'dist/css/icons.css'), 'utf8');
  const glyphs = css.match(/\.wui \.wui-icon--[a-z0-9-]+::before/g) || [];
  assert.equal(glyphs.length, 139);
  assert.match(css, /webilia-ui-icons\.woff2/);
  assert.match(css, /\.wui \.wui-icon--stars::before/);
  assert.equal((await readFile(resolve(root, 'dist/fonts/webilia-ui-icons.woff2'))).subarray(0, 4).toString(), 'wOF2');
  assert.equal((await readFile(resolve(root, 'dist/fonts/webilia-ui-icons.woff'))).subarray(0, 4).toString(), 'wOFF');
});

test('compiled component rules stay under .wui', async () => {
  for (const name of ['tokens', 'layout', 'buttons', 'header', 'breadcrumb', 'forms', 'surfaces', 'badge', 'notice', 'feedback', 'modal', 'icons', 'toast', 'announcements', 'deactivation']) {
    const css = await readFile(resolve(root, `dist/css/${name}.css`), 'utf8');
    const sheet = postcss.parse(css);
    sheet.walkRules((rule) => {
      if (rule.parent.type === 'atrule' && rule.parent.name === 'keyframes') return;
      for (const selector of rule.selectors) {
        assert.match(selector.trim(), /^\.wui(?:\b|\.)/, `${name}: ${selector}`);
      }
    });
  }
});

test('body mounting preserves external form ownership and dynamic field serialization', async () => {
  const dom = await browserWith(['modal'], '<form id="owner"><button type="button" id="open" data-wui-modal-open="#m" aria-expanded="false">Open</button><div id="m" class="wui wui-modal" data-wui-modal data-wui-modal-mount="body" hidden><div class="wui-modal__panel" tabindex="-1"><input name="setting" value="yes"><input name="separate" form="other" value="no"><button type="submit" id="save">Save</button></div></div></form><form id="other"></form>');
  const { document, FormData, WebiliaUI } = dom.window;
  const modal = document.getElementById('m');
  document.getElementById('open').focus();
  document.getElementById('open').click();
  assert.equal(modal.parentElement, document.body);
  assert.equal(modal.querySelector('[name="setting"]').form.id, 'owner');
  assert.equal(modal.querySelector('[name="separate"]').form.id, 'other');
  assert.equal(document.getElementById('save').form.id, 'owner');
  assert.equal(document.getElementById('open').getAttribute('aria-expanded'), 'true');
  modal.querySelector('.wui-modal__panel').insertAdjacentHTML('beforeend', '<input name="dynamic" value="added">');
  await Promise.resolve();
  assert.deepEqual([...new FormData(document.getElementById('owner')).entries()], [['setting', 'yes'], ['dynamic', 'added']]);
  WebiliaUI.modal.close(modal);
  modal.querySelector('.wui-modal__panel').insertAdjacentHTML('beforeend', '<input name="closed" value="also-added">');
  document.getElementById('owner').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  assert.equal(new FormData(document.getElementById('owner')).get('closed'), 'also-added');
  assert.equal(document.activeElement.id, 'open');
  dom.window.close();
});

test('nested mounted dialogs preserve their own forms, layers, focus and scroll lock', async () => {
  const dom = await browserWith(['modal'], '<button id="open" data-wui-modal-open="parent">Open</button><div id="parent" class="wui wui-modal" data-wui-modal hidden><div class="wui-modal__panel" tabindex="-1"><form id="inside"><input name="value" value="one"><button type="button" id="child-open" data-wui-modal-open="child">Child</button></form><div id="child" class="wui wui-modal" data-wui-modal data-wui-modal-mount="body" hidden><div class="wui-modal__panel" tabindex="-1"><button id="child-close" data-wui-modal-close>Close</button></div></div></div></div>');
  const { document, WebiliaUI } = dom.window;
  document.body.style.overflow = 'scroll';
  document.getElementById('open').focus();
  document.getElementById('open').click();
  assert.equal(document.querySelector('[name="value"]').form.id, 'inside');
  document.getElementById('child-open').focus();
  document.getElementById('child-open').click();
  assert.equal(document.getElementById('child').style.getPropertyValue('--wui-modal-stack'), '1');
  document.getElementById('child-close').click();
  assert.equal(document.activeElement.id, 'child-open');
  assert.equal(document.body.style.overflow, 'hidden');
  document.getElementById('child-open').click();
  WebiliaUI.modal.close('parent');
  assert.equal(document.getElementById('child').hidden, true);
  assert.equal(document.body.style.overflow, 'scroll');
  assert.equal(document.activeElement.id, 'open');
  dom.window.close();
});

test('close policy is explicit and default dialogs stay in their product root', async () => {
  const dom = await browserWith(['modal'], '<div id="root" class="wui"><div id="m" class="wui wui-modal" data-wui-modal data-wui-modal-escape-close="0" hidden><div class="wui-modal__backdrop"></div><div class="wui-modal__panel" tabindex="-1"><button data-wui-modal-close>Done</button></div></div></div>');
  const { document, WebiliaUI, KeyboardEvent } = dom.window;
  WebiliaUI.modal.open('m');
  const modal = document.getElementById('m');
  assert.equal(modal.parentElement.id, 'root');
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  modal.querySelector('.wui-modal__backdrop').click();
  assert.equal(modal.hidden, false);
  modal.querySelector('button').click();
  assert.equal(modal.hidden, true);
  dom.window.close();
});

test('dismissible notices use one delegated handler and preserve unrelated content', async () => {
  const dom = await browserWith(['notice', 'notice'], '<div class="wui" id="root"></div><div class="wui-notice" id="outside"><button data-wui-notice-dismiss>Outside</button></div>');
  const { document } = dom.window;
  document.getElementById('root').innerHTML = '<div class="wui-notice" id="notice"><a href="/help">Help</a><button data-wui-notice-dismiss>Dismiss</button></div><div class="wui-notice" id="persistent">Persistent error</div>';
  let dismissed = 0;
  document.addEventListener('wui:notice:dismissed', () => dismissed++);
  document.querySelector('#notice button').click();
  document.querySelector('#outside button').click();
  assert.equal(dismissed, 1);
  assert.equal(document.getElementById('notice'), null);
  assert.ok(document.getElementById('persistent'));
  assert.ok(document.getElementById('outside'));
  dom.window.close();
});

test('busy state supports explicit controls including the target button', async () => {
  const dom = await browserWith(['busy'], '<button id="target">Action</button><button id="disabled" disabled>Unavailable</button><button id="untouched">Other</button>');
  const { document, WebiliaUI } = dom.window;
  const target = document.getElementById('target');
  WebiliaUI.busy.setBusy(target, true, { controls: [target, document.getElementById('disabled')] });
  assert.equal(target.disabled, true);
  assert.equal(document.getElementById('untouched').disabled, false);
  WebiliaUI.busy.setBusy(target, false);
  assert.equal(target.disabled, false);
  assert.equal(document.getElementById('disabled').disabled, true);
  dom.window.close();
});
