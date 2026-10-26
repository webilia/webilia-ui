import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import jquery from 'jquery';
import postcss from 'postcss';
const root=resolve(import.meta.dirname,'../..');

test('settings repeater initialization is idempotent and preserves JSON field shape',async()=>{
    const dom=new JSDOM('<div class="wui-sp-panel"><div class="wui-sp-repeater-wrapper" data-fields=\'[{"key":"title","label":"Title","type":"text"}]\'><div class="wui-sp-repeater-items"></div><button class="wui-sp-repeater-add">Add</button><textarea class="wui-sp-repeater" name="theme[rows]">[{"title":"One"}]</textarea></div></div>',{runScripts:'outside-only'});
    const w=dom.window;w.matchMedia=()=>({matches:false});w.requestAnimationFrame=fn=>fn();
    w.eval(await readFile(resolve(root,'dist/js/settings-panel.js'),'utf8'));
    const runtime=w.WebiliaUI.settingsPanel.create();runtime.app.init();runtime.app.init();
    w.document.querySelector('.wui-sp-repeater-add').click();
    assert.equal(w.document.querySelectorAll('.wui-sp-repeater-item').length,2);
    const last=[...w.document.querySelectorAll('.wui-sp-repeater-input')].at(-1);last.value='Two';last.dispatchEvent(new w.Event('input',{bubbles:true}));
    assert.deepEqual(JSON.parse(w.document.querySelector('textarea').value),[{title:'One'},{title:'Two'}]);
    assert.equal(w.wp,undefined);
    await new Promise(resolve => setTimeout(resolve, 0));
    dom.window.close();
});

test('new component styles are scoped and all relative assets exist',async()=>{
    for(const name of ['settings-panel','settings-customizer','demo-import']) {
        const css=postcss.parse(await readFile(resolve(root,`dist/css/${name}.css`),'utf8'));
        css.walkRules(rule=>{
            if(rule.parent.type==='atrule' && /keyframes$/.test(rule.parent.name)) return;
            for(const selector of rule.selectors) assert.match(selector,/^\.wui(?:[ .:#\[]|$)/,selector);
        });
        for(const match of css.toString().matchAll(/url\(["']?([^)'"?]+)(?:\?[^)'"\s]*)?["']?\)/g)) {
            if(/^(?:data:|https?:)/.test(match[1]))continue;
            await readFile(resolve(root,'dist/css',match[1]));
        }
    }
});

test('demo UI initialization is opt-in, root-scoped and idempotent',async()=>{
    const dom=new JSDOM('<div class="js-wdi-page">Legacy</div><div class="js-wui-di-page"><input class="js-wui-sp-demo-search"><div class="js-wui-sp-demo-container"><div class="js-wui-sp-demo-item" data-name="business" data-categories="business"></div><div class="js-wui-sp-demo-item" data-name="creative" data-categories="creative"></div></div></div>',{runScripts:'outside-only'});
    const w=dom.window,$=jquery(w);w.requestAnimationFrame=fn=>fn();
    w.eval(await readFile(resolve(root,'dist/js/demo-import.js'),'utf8'));
    const el=w.document.querySelector('.js-wui-di-page');
    const options={jquery:$,request(){throw new Error('Unexpected request');}};
    w.WebiliaUI.demoImport.init(el,options);w.WebiliaUI.demoImport.init(el,options);
    $(el).find('input').val('business').trigger('input');
    assert.equal(el.querySelectorAll('.is-hidden-by-filter').length,1);
    assert.equal(w.document.querySelector('.js-wdi-page').textContent,'Legacy');
    dom.window.close();
});
