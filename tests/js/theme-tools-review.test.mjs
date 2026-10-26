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


test('top navigation separates parent navigation from its submenu toggle and updates headings', async t => {
    const html = renderPHP("\\Webilia\\UI\\SettingsPanel\\Layout::render(['panel_attrs'=>'class=\"wui-sp-panel\" data-wui-sp-nav-position=\"top\"','sections'=>['parent'=>['title'=>'Parent & main','has_content'=>true],'child'=>['title'=>'Child','parent_id'=>'parent','has_content'=>true]],'sections_html'=>['parent'=>'Parent content','child'=>'Child content']])");
    const { w, document } = await settings(t, html, {}, '#wui-sp-section-child');
    const row = document.querySelector('.wui-sp-nav-row');
    const link = row.querySelector('a'), toggle = row.querySelector('button');
    assert.equal(toggle.parentElement, row);
    assert.equal(link.contains(toggle), false);
    link.click();
    w.dispatchEvent(new w.HashChangeEvent('hashchange'));
    assert.equal(document.querySelector('.wui-sp-panel-section.is-active').dataset.section, 'parent');
    assert.equal(document.querySelector('.wui-sp-panel-section-title').textContent, 'Parent & main');
    toggle.click();
    assert.equal(toggle.getAttribute('aria-expanded'), 'true');
    assert.equal(document.querySelector('.wui-sp-panel-section.is-active').dataset.section, 'parent');
});

for (const direction of ['ltr', 'rtl']) test(`tablist supports arrows, Home and End in ${direction}`, async t => {
    const html = '<div class="wui-sp-panel"><div class="wui-sp-tabbed" data-tab-group="group"><ul role="tablist" style="direction:' + direction + '">' + ['one','two','three'].map(key => `<li class="wui-sp-tabbed-item"><a href="#" role="tab" class="wui-sp-tabbed-link" data-tab="${key}">${key}</a></li>`).join('') + '</ul></div>' + ['one','two','three'].map(key => `<div class="wui-sp-field" data-wui-sp-tab-group="group" data-wui-sp-tab="${key}">${key}</div>`).join('') + '</div>';
    const { w, document, runtime } = await settings(t, html);
    runtime.app.initContext(document);
    const buttons = [...document.querySelectorAll('[role="tab"]')];
    function key(value) { document.activeElement.dispatchEvent(new w.KeyboardEvent('keydown', { key:value, bubbles:true, cancelable:true })); }
    buttons[0].focus();
    key(direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
    assert.equal(document.activeElement, buttons[1]);
    assert.equal(buttons[1].getAttribute('aria-selected'), 'true');
    assert.equal(document.querySelector('[data-wui-sp-tab="two"]').classList.contains('is-tab-hidden'), false);
    key('End'); assert.equal(document.activeElement, buttons[2]);
    key('Home'); assert.equal(document.activeElement, buttons[0]);
    key(direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft');
    assert.equal(document.activeElement, buttons[2]);
    document.querySelector('[role="tablist"]').setAttribute('aria-orientation', 'vertical');
    key('ArrowDown'); assert.equal(document.activeElement, buttons[0]);
    key('ArrowUp'); assert.equal(document.activeElement, buttons[2]);
    assert.equal(buttons.filter(button => button.tabIndex === 0).length, 1);
});

test('theme definitions survive attribute escaping and drive initial and changed previews', async t => {
    const html = renderPHP("\\Webilia\\UI\\SettingsPanel\\Fields::panel_theme(['name'=>'theme[skin]','value'=>'light','themes'=>['light'=>['label'=>\"Light & \\\"bright\\\"\",'vars'=>['--webilia-panel-bg'=>'#ffffff']],'dark'=>['label'=>'Dark','vars'=>['--webilia-panel-bg'=>'#111111']]]])");
    const { w, document } = await settings(t, '<div class="wui-sp-panel">' + html + '</div>');
    const control = document.querySelector('.wui-sp-panel-theme-control');
    assert.equal(JSON.parse(control.dataset.panelThemes).light.label, 'Light & "bright"');
    assert.equal(control.querySelectorAll('.wui-sp-panel-theme-swatch').length, 2);
    const panel = document.querySelector('.wui-sp-panel');
    assert.equal(panel.style.getPropertyValue('--webilia-panel-bg'), '#ffffff');
    const dark = control.querySelector('[value="dark"]');
    dark.checked = true;
    dark.dispatchEvent(new w.Event('change', { bubbles:true }));
    assert.equal(panel.style.getPropertyValue('--webilia-panel-bg'), '#111111');
});

test('palette activation updates the submitted value and emits one pair of events', async t => {
    const html = renderPHP("\\Webilia\\UI\\SettingsPanel\\Fields::color_palette(['name'=>'theme[color]','value'=>'#ffffff','palette'=>['#ffffff','#112233']])");
    const { document, runtime } = await settings(t, html);
    runtime.app.initContext(document);
    const input = document.querySelector('input');
    const events = [];
    for (const name of ['input','change']) input.addEventListener(name, () => events.push(name));
    const swatch = document.querySelector('[data-color="#112233"]');
    swatch.click();
    assert.equal(input.value, '#112233');
    assert.deepEqual(events, ['input','change']);
    assert.equal(document.querySelectorAll('.wui-sp-color-box-active').length, 1);
    assert.equal(swatch.getAttribute('aria-pressed'), 'true');
});

test('sortable adapter initializes once and emits changes with the submitted DOM order', async t => {
    const html = renderPHP("\\Webilia\\UI\\SettingsPanel\\Fields::sortable(['name'=>'theme[order]','options'=>['first'=>'First','second'=>'Second'],'value'=>['first','second']])");
    const calls = [];
    const { w, document, runtime } = await settings(t, '<form>' + html + '</form>', { sortable(list, update) { calls.push({list,update}); } });
    runtime.app.initContext(document);
    assert.equal(calls.length, 1);
    const {list,update} = calls[0];
    const events = [];
    for (const name of ['input','change']) list.addEventListener(name, () => events.push(name));
    list.prepend(list.lastElementChild);
    update();
    assert.deepEqual(new w.FormData(document.querySelector('form')).getAll('theme[order][]'), ['second','first']);
    assert.deepEqual(events, ['input','change']);
});

test('localized fallback demo titles are escaped exactly once', async t => {
    const html = renderPHP("\\Webilia\\UI\\DemoImport\\Screen::render(['labels'=>['Demo Importer'=>\"L'importateur & démo\"]], 'title.php')");
    const dom = new JSDOM(html);
    t.after(() => dom.window.close());
    assert.equal(dom.window.document.querySelector('h1').textContent, "L'importateur & démo");
    assert.equal(html.includes('&amp;amp;'), false);
});


test('theme changes clear omitted variables and never parse swatch values as markup', async t => {
    const themes = { light:{label:'Light', vars:{'--webilia-panel-bg':'#ffffff','--webilia-panel-accent-2':'#ff0000'}}, dark:{label:'Dark',vars:{'--webilia-panel-bg':'#111111'}}, none:{label:'None'}, malicious:{label:'Unsafe',vars:{'--webilia-panel-accent':'red\"></span><img src=x onerror=alert(1)>'}} };
    const { w, document } = await settings(t, '<div class="wui-sp-panel"><div class="wui-sp-panel-theme-control" data-panel-themes=\'' + JSON.stringify(themes).replace(/'/g,'&#39;') + '\'>' + Object.keys(themes).map(key => `<input type="radio" name="skin" value="${key}" ${key === 'light' ? 'checked' : ''}><span class="wui-sp-panel-theme-preview" data-theme-key="${key}"></span>`).join('') + '</div></div>');
    const panel = document.querySelector('.wui-sp-panel');
    assert.equal(panel.style.getPropertyValue('--webilia-panel-accent-2'), '#ff0000');
    function choose(value) { const input = document.querySelector(`[value="${value}"]`); input.checked = true; input.dispatchEvent(new w.Event('change',{bubbles:true})); }
    choose('dark');
    assert.equal(panel.style.getPropertyValue('--webilia-panel-bg'),'#111111');
    assert.equal(panel.style.getPropertyValue('--webilia-panel-accent-2'),'');
    choose('none');
    assert.equal(panel.style.getPropertyValue('--webilia-panel-bg'),'');
    assert.equal(document.querySelector('[data-theme-key="malicious"]').children.length,1);
    assert.equal(document.querySelector('img, [onerror]'),null);
});

test('interrupted conditional hides cannot hide a newly visible field on animation end', async t => {
    const { w, document } = await settings(t, '<div class="wui-sp-panel"><div class="wui-sp-field" data-field-id="enabled"><input id="enabled" type="checkbox" checked></div><div class="wui-sp-panel-field-row"><div class="wui-sp-field" data-required=\'["enabled","=",1]\'><input name="dependent"></div></div></div>');
    w.matchMedia = () => ({matches:false});
    const input = document.getElementById('enabled');
    const field = document.querySelector('[data-required]'), row = field.parentElement;
    function set(value) { input.checked = value; input.dispatchEvent(new w.Event('change',{bubbles:true})); }
    function animationEnd(node) { node.dispatchEvent(new w.Event('animationend',{bubbles:true})); }
    set(false);
    assert.equal(field.classList.contains('is-hiding'),true);
    set(true);
    animationEnd(field); animationEnd(row);
    assert.equal(field.classList.contains('is-hidden'),false);
    assert.equal(row.classList.contains('is-hidden'),false);
    set(false); animationEnd(field); animationEnd(row);
    assert.equal(field.classList.contains('is-hidden'),true);
    set(true); animationEnd(field); animationEnd(row);
    assert.equal(field.classList.contains('is-hidden'),false);
    assert.equal(row.classList.contains('is-hidden'),false);
});

test('typography input origins inherit master color changes and preserve explicit overrides', async t => {
    const html = renderPHP("\\Webilia\\UI\\SettingsPanel\\Fields::typography(['name'=>'theme[font]','id'=>'font','color_origin'=>'accent','value'=>['color'=>'#112233']])");
    const { w, document } = await settings(t, '<div class="wui-sp-panel"><div class="wui-sp-field" data-field-id="accent"><input class="wui-sp-colorpicker" value="#112233"></div><div class="wui-sp-field" data-field-id="font" data-wui-sp-color-origin="accent">' + html + '</div></div>');
    const master = document.querySelector('[data-field-id="accent"] input'), linked = document.querySelector('#font_color');
    let changes = 0;
    linked.addEventListener('change',()=>changes++);
    master.value='#445566'; master.dispatchEvent(new w.Event('input',{bubbles:true}));
    assert.equal(linked.value,'#445566'); assert.equal(changes,1);
    linked.value='#ffffff'; master.value='#778899'; master.dispatchEvent(new w.Event('change',{bubbles:true}));
    assert.equal(linked.value,'#ffffff');
    // Input-only metadata as emitted by the standalone renderer.
    linked.closest('.wui-sp-field').removeAttribute('data-wui-sp-color-origin');
    const inserted = document.createElement('div'); inserted.innerHTML = html.replaceAll('font_color','inserted_color');
    document.querySelector('.wui-sp-panel').append(inserted);
    w.WebiliaUI.settingsPanel.create().app.initContext(inserted);
    const added = inserted.querySelector('.wui-sp-colorpicker'); added.value='';
    master.value='#aabbcc'; master.dispatchEvent(new w.Event('change',{bubbles:true}));
    assert.equal(added.value,'#aabbcc');
});

test('repeated invalid exports reuse a single scoped toast root', async t => {
    const html = renderPHP("\\Webilia\\UI\\SettingsPanel\\Fields::import_export(['name'=>'theme[tools]','id'=>'tools','value'=>'invalid'])");
    const { w, document } = await settings(t, html);
    const roots = [];
    w.WebiliaUI.toast = { show(message, options) { roots.push(options.root); } };
    document.querySelector('.wui-sp-export-json').click();
    document.querySelector('.wui-sp-export-json').click();
    assert.equal(roots.length,2);
    assert.equal(roots[0],roots[1]);
    assert.equal(document.querySelectorAll('[data-wui-sp-settings-toast-root]').length,1);
});

test('plugin switches have unique IDs and names across setup renders', async t => {
    const html = renderPHP("\\Webilia\\UI\\DemoImport\\Screen::render(['ajax_url'=>'/mock','ajax_nonce'=>'nonce','demos'=>[['key'=>'starter','import_file_name'=>'Starter']],'plugins_by_demo'=>[[['slug'=>'one','name'=>'First plugin','required'=>false],['slug'=>'two','name'=>'Second plugin','required'=>false]]]])");
    const { $, el } = await importer(t,html,()=>({}));
    $(el).find('.js-wui-di-import-form').trigger('submit');
    const inputs = [...el.querySelectorAll('.js-wui-di-setup-plugins input[type="checkbox"]')];
    assert.equal(inputs.length,2);
    assert.equal(new Set(inputs.map(input=>input.id)).size,2);
    assert.deepEqual(inputs.map(input=>input.getAttribute('aria-label')),['First plugin','Second plugin']);
    const ids = inputs.map(input=>input.id);
    $(el).find('.js-wui-di-setup-back').trigger('click');
    $(el).find('.js-wui-di-import-form').trigger('submit');
    assert.equal([...el.querySelectorAll('.js-wui-di-setup-plugins input[type="checkbox"]')].some(input=>ids.includes(input.id)),false);
});
