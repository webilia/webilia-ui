import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import jquery from 'jquery';

const root = resolve(import.meta.dirname, '../..');
function renderPHP(expression) {
    const bootstrap = resolve(root, 'tests/php/bootstrap.php').replace(/'/g, "\\'");
    return execFileSync('php', ['-r', `require '${bootstrap}'; echo ${expression};`], { encoding: 'utf8' });
}
async function settings(t, html, options = {}, hash = '') {
    const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://site.test/' + hash });
    const w = dom.window;
    w.matchMedia = () => ({ matches: true });
    w.requestAnimationFrame = fn => fn();
    w.scrollTo = () => {};
    w.eval(await readFile(resolve(root, 'dist/js/settings-panel.js'), 'utf8'));
    const runtime = w.WebiliaUI.settingsPanel.create(options);
    runtime.app.init();
    t.after(async () => { await new Promise(resolve => setTimeout(resolve, 0)); w.close(); });
    return { w, document: w.document, runtime };
}

test('stale hashes use the configured section initially and preserve the active section later', async t => {
    const { w, document } = await settings(t, '<div class="wui-sp-panel" data-wui-sp-default-section="advanced"><nav class="wui-sp-panel-nav"><a class="wui-sp-nav-link" href="#wui-sp-section-general">General</a><a class="wui-sp-nav-link" href="#wui-sp-section-advanced">Advanced</a></nav><section class="wui-sp-panel-section" data-section="general"></section><section class="wui-sp-panel-section" data-section="advanced"></section></div>', {}, '#unrelated');
    const active = () => [...document.querySelectorAll('.wui-sp-panel-section.is-active')].map(el => el.dataset.section);
    assert.deepEqual(active(), ['advanced']);
    w.location.hash = '#wui-sp-section-general';
    w.dispatchEvent(new w.HashChangeEvent('hashchange'));
    assert.deepEqual(active(), ['general']);
    w.location.hash = '#removed-section';
    w.dispatchEvent(new w.HashChangeEvent('hashchange'));
    assert.deepEqual(active(), ['general']);
});

test('inserted conditional controls evaluate immediately against existing controllers', async t => {
    const { w, document, runtime } = await settings(t, '<div class="wui-sp-panel"><div class="wui-sp-field" data-field-id="enabled"><input id="enabled" type="checkbox"></div></div>');
    const container = document.createElement('div');
    container.innerHTML = '<div class="wui-sp-field" data-required=\'["enabled","=",1]\'><input name="dependent"></div>';
    document.querySelector('.wui-sp-panel').append(container);
    runtime.app.initContext(container);
    const field = container.firstElementChild;
    assert.equal(field.classList.contains('is-hidden'), true);
    const second = field.cloneNode(true);
    second.classList.remove('is-hidden');
    container.append(second);
    runtime.app.initContext(second);
    assert.equal(second.classList.contains('is-hidden'), true);
    document.getElementById('enabled').checked = true;
    document.getElementById('enabled').dispatchEvent(new w.Event('change', { bubbles: true }));
    assert.equal(field.classList.contains('is-hidden'), false);
    assert.equal(second.classList.contains('is-hidden'), false);
});

test('standalone media/gallery callbacks update previews and values once, including remove and clear', async t => {
    const html = renderPHP("\\Webilia\\UI\\SettingsPanel\\Fields::media(['name'=>'theme[image]','id'=>'image']) . \\Webilia\\UI\\SettingsPanel\\Fields::gallery(['name'=>'theme[gallery]','id'=>'gallery'])");
    const picks = [];
    const { document, runtime } = await settings(t, '<div class="wui wui-sp-root">' + html + '</div>', {
        selectMedia(config, done) { picks.push({ config, done }); }
    });
    runtime.app.initContext(document);
    document.querySelector('.wui-sp-media-select').click();
    assert.equal(picks.length, 1);
    assert.equal(picks[0].config.multiple, false);
    picks[0].done({ id: 11, type: 'image', url: 'https://files.test/image.png', sizes: { thumbnail: { url: 'https://files.test/thumb.png' } } });
    assert.equal(document.querySelector('[name="theme[image][id]"]').value, '11');
    assert.equal(document.querySelector('[name="theme[image][url]"]').value, 'https://files.test/image.png');
    assert.equal(document.querySelector('.wui-sp-media-preview img').getAttribute('src'), 'https://files.test/thumb.png');
    document.querySelector('.wui-sp-media-remove').click();
    assert.equal(document.querySelector('[name="theme[image][id]"]').value, '');
    assert.equal(document.querySelector('[name="theme[image][url]"]').value, '');
    assert.equal(document.querySelector('.wui-sp-media-preview').children.length, 0);
    assert.equal(document.querySelector('.wui-sp-media-remove').classList.contains('is-hidden'), true);
    document.querySelector('.wui-sp-gallery-select').click();
    assert.equal(picks.length, 2);
    assert.equal(picks[1].config.multiple, true);
    picks[1].done([{ id: 1, url: 'https://files.test/one.png' }, { id: 2, url: 'https://files.test/two.png' }]);
    assert.equal(document.querySelector('.wui-sp-gallery-input').value, '1,2');
    document.querySelector('.wui-sp-gallery-select').click();
    picks[2].done([{ id: 2, url: 'https://files.test/two.png' }, { id: 3, url: 'https://files.test/three.png' }]);
    assert.equal(document.querySelector('.wui-sp-gallery-input').value, '1,2,3');
    document.querySelector('.wui-sp-gallery-items li[data-id="2"] button').click();
    assert.equal(document.querySelector('.wui-sp-gallery-input').value, '1,3');
    document.querySelector('.wui-sp-gallery-clear').click();
    assert.equal(document.querySelector('.wui-sp-gallery-input').value, '');
    assert.equal(document.querySelector('.wui-sp-gallery-items').children.length, 0);
    assert.equal(document.querySelector('.wui-sp-gallery-empty').style.display, 'block');
});

test('typography leaves native color initialization to registered host adapters', async t => {
    const html = renderPHP("\\Webilia\\UI\\SettingsPanel\\Fields::typography(['name'=>'theme[font]','id'=>'font'])");
    const { document, runtime } = await settings(t, '<div class="wui-sp-panel">' + html + '</div>');
    let initialized = 0;
    runtime.app.register({ name: 'HostColors', init(context) {
        for (const input of context.querySelectorAll('.wui-sp-colorpicker')) {
            if (input.dataset.pickerReady) continue;
            input.dataset.pickerReady = '1';
            initialized++;
        }
    }});
    runtime.app.initContext(document);
    assert.equal(initialized, 1);
    assert.equal(document.querySelector('.wui-sp-colorpicker').dataset.pickerReady, '1');
});

async function importer(t, html, request) {
    const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://site.test/' });
    const w = dom.window, $ = jquery(w);
    w.requestAnimationFrame = fn => fn();
    w.eval(await readFile(resolve(root, 'dist/js/demo-import.js'), 'utf8'));
    const el = w.document.querySelector('.js-wui-di-page');
    w.WebiliaUI.demoImport.init(el, { jquery: $, request: config => $.Deferred().resolve(request(config)).promise() });
    t.after(() => w.close());
    return { w, $, el };
}

test('demo categories match full keys when category names overlap', async t => {
    const html = renderPHP("\\Webilia\\UI\\DemoImport\\Screen::render(['demos'=>[['key'=>'one','import_file_name'=>'Business','categories'=>['Business']],['key'=>'two','import_file_name'=>'Small Business','categories'=>['Small-Business']]],'categories'=>['business'=>'Business','small-business'=>'Small-Business']])");
    const { $, el } = await importer(t, html, () => { throw new Error('Filtering must not request imports.'); });
    $(el).find('a[href="#business"]').trigger('click');
    assert.deepEqual([...el.querySelectorAll('.js-wui-sp-demo-item:not(.is-hidden-by-filter)')].map(item => item.dataset.name), ['business']);
    $(el).find('a[href="#small-business"]').trigger('click');
    assert.deepEqual([...el.querySelectorAll('.js-wui-sp-demo-item:not(.is-hidden-by-filter)')].map(item => item.dataset.name), ['small business']);
});

for (const failure of ['plugin', 'content']) test(`retry after ${failure} failure skips plugins already activated`, async t => {
    const html = renderPHP("\\Webilia\\UI\\DemoImport\\Screen::render(['ajax_url'=>'/mock','ajax_nonce'=>'nonce','demos'=>[['key'=>'starter','import_file_name'=>'Starter']],'plugins_by_demo'=>[[['slug'=>'first','name'=>'First','required'=>true,'status'=>'missing'],['slug'=>'second','name'=>'Second','required'=>true,'status'=>'missing']]]])");
    const installed = [];
    let failed = false;
    const { $, el } = await importer(t, html, config => {
        const { action, slug } = config.data;
        if (action === 'install_plugin') {
            installed.push(slug);
            if (failure === 'plugin' && slug === 'second' && !failed) { failed = true; return { error: 'Plugin failed' }; }
            return { status: 'active' };
        }
        if (action === 'import_demo_data') {
            if (failure === 'content' && !failed) { failed = true; return { error: 'Content failed' }; }
            return { status: 'afterAllImportAJAX' };
        }
        return { message: 'Complete' };
    });
    $(el).find('.js-wui-di-import-form').trigger('submit');
    el.querySelector('.js-wui-di-setup-continue').click();
    assert.equal(failed, true);
    el.querySelector(failure === 'plugin' ? '.js-wui-di-plugin-restart' : '.js-wui-di-content-restart').click();
    assert.deepEqual(installed, failure === 'plugin' ? ['first', 'second', 'second'] : ['first', 'second']);
    assert.equal(el.dataset.pageState, 'done');
});
