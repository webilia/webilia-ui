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
  for (const name of ['tokens', 'layout', 'buttons', 'header', 'forms', 'surfaces', 'badge', 'notice', 'feedback', 'modal', 'icons', 'toast']) {
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
