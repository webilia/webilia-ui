const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { resolve } = require('node:path');
const baseURL = process.env.PARITY_BASE_URL || 'http://127.0.0.1:8877';
const screenshots = resolve(__dirname, '../../docs');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const failures = [];
    page.on('pageerror', error => failures.push(error.message));
    page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
    await page.goto(`${baseURL}/playground/parity.php`);
    await page.getByRole('button', { name: 'Configure scheduling' }).click();
    await page.locator('#scheduling input').fill('45');
    assert.equal(await page.locator('#scheduling').evaluate(el => el.parentElement === document.body), true);
    await page.getByRole('button', { name: 'Nested dialog', exact: true }).click();
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('#nested').evaluate(el => el.contains(document.activeElement)), true);
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Nested dialog');
    await page.screenshot({ path: resolve(screenshots, 'parity-desktop.png') });
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await page.getByRole('button', { name: 'Serialize offering' }).click();
    assert.deepEqual(JSON.parse(await page.locator('#result').textContent()), { name: 'Example offering', duration: '45' });
    await page.locator('#scheduling .wui-modal__body').evaluate(body => {
      body.insertAdjacentHTML('beforeend', '<input name="required-later" required>');
    });
    const validation = await page.locator('#owner').evaluate(form => {
      const input = document.querySelector('[name="required-later"]');
      let submitted = false;
      const handler = () => { submitted = true; };
      form.addEventListener('submit', handler);
      const result = { owned: input.form === form, valid: form.checkValidity() };
      form.requestSubmit();
      result.submitted = submitted;
      form.removeEventListener('submit', handler);
      input.remove();
      return result;
    });
    assert.deepEqual(validation, { owned: true, valid: false, submitted: false });
    await page.getByRole('button', { name: 'Module settings', exact: true }).click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#settings').isVisible(), true);
    await page.locator('#settings input').fill('Updated');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    assert.deepEqual(JSON.parse(await page.locator('#result').textContent()), { label: 'Updated' });
    await page.getByRole('button', { name: 'Dismiss notice' }).click();
    assert.equal(await page.locator('.wui-notice').count(), 1);
    assert.equal(await page.getByText('Persistent validation errors stay inline.').isVisible(), true);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseURL}/playground/parity.php?rtl=1`);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.getByRole('button', { name: 'Feedback links' }).click();
    await page.locator('.wui-deactivation__choice').filter({ hasText: 'Other' }).click();
    assert.equal(await page.getByRole('radio', { name: 'Other' }).isChecked(), true);
    await page.getByRole('button', { name: 'Submit & Deactivate' }).click();
    await page.locator('[data-wui-feedback-error]').filter({ hasText: 'Example failure' }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Skip & Deactivate' }).isEnabled(), true);
    assert.equal(await page.getByRole('link', { name: 'Terms and conditions' }).isVisible(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    await page.screenshot({ path: resolve(screenshots, 'parity-mobile-rtl.png') });
    await page.getByRole('button', { name: 'Skip & Deactivate' }).click();
    assert.equal(await page.locator('#feedback').isVisible(), false);
    assert.deepEqual(failures, []);
    console.log('Chromium parity checks passed: form serialization, nesting, keyboard focus, close policies, notices, mobile RTL/reduced motion, feedback failure/skip, and assets.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
