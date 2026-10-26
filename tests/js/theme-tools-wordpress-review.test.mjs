import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import jquery from 'jquery';
const root = resolve(import.meta.dirname, '../..');

test('WP action loading labels remain text and the button restores after completion', async t => {
    const dom = new JSDOM('<div class="wui-sp-panel"><form class="wui-sp-panel-form" data-wui-sp-opt-name="theme" data-wui-sp-nonce="nonce"><div class="wui-sp-panel-actions"><button type="button" class="wui-sp-action-save" data-loading-text="&lt;img src=x onerror=alert(1)&gt; &amp; Saving">Save</button></div></form></div>', {runScripts:'outside-only',url:'https://site.test/'});
    const w=dom.window, $=jquery(w);
    t.after(async()=>{await new Promise(resolve=>setTimeout(resolve,0));w.close();});
    w.jQuery=$;w.ajaxurl='/wp-admin/admin-ajax.php';w.matchMedia=()=>({matches:true});w.requestAnimationFrame=fn=>fn();
    w.webiliaWPSettingsI18n={saving:'Saving',done:'Done'};
    const pending=$.Deferred(); $.post=()=>pending.promise();
    w.eval(await readFile(resolve(root,'dist/js/settings-panel.js'),'utf8'));
    w.eval(await readFile(resolve(root,'dist/wordpress/js/settings-panel.js'),'utf8'));
    const button=w.document.querySelector('button');
    button.click();
    assert.equal(button.querySelector('img,[onerror]'),null);
    assert.equal(button.querySelector('.wui-sp-button-label').textContent,'<img src=x onerror=alert(1)> & Saving');
    assert.equal(button.disabled,true);
    pending.resolve({success:true,data:{message:'Saved'}});
    assert.equal(button.textContent,'Save');
    assert.equal(button.disabled,false);
});

test('Customizer child discovery, link activation, and deep-link collapse use emitted data keys', async t => {
    const dom=new JSDOM('<li class="control-section" id="accordion-section-parent"><a href="#" class="wui-sp-customizer-subsection-link" data-wui-sp-section="child" data-wui-sp-panel="panel">Child</a></li><li id="accordion-section-child"><button>Child control</button></li>',{runScripts:'outside-only'});
    const w=dom.window,$=jquery(w);w.jQuery=$;
    t.after(()=>w.close());
    const events={}, expanded={}, calls=[];
    const sections={};
    for(const id of ['parent','child']) sections[id]={id,container:$('#accordion-section-'+id),expanded:{bind(fn){expanded[id]=fn;}},expand(options){calls.push('expand:'+id);if(options && options.completeCallback) options.completeCallback();},focus(){calls.push('focus:'+id);}};
    const section=(id,callback)=>{if(callback) callback(sections[id]);return sections[id];};
    const api={section,bind(name,callback){events[name]=callback;},state(){return {get(){return {id:'child'};}};}};
    w.wp={customize:api};
    w.eval(await readFile(resolve(root,'dist/wordpress/js/settings-customizer.js'),'utf8'));
    events.ready();
    // The child was deep-linked; no click has populated childParentMap yet.
    assert.equal(typeof expanded.child,'function');
    expanded.child(false);
    assert.deepEqual(calls,['expand:parent','focus:parent']);
    assert.equal(sections.child.container.hasClass('wui-sp-customizer-child-hidden'),true);
    $('.wui-sp-customizer-subsection-link').trigger('click');
    assert.equal(calls.at(-1),'expand:child');
    assert.equal(sections.child.container.hasClass('wui-sp-customizer-child-hidden'),false);
    await new Promise(resolve=>setTimeout(resolve,0));
});


test('native color-picker labels remain text after icon decoration', async t => {
    const dom=new JSDOM('<div class="wp-picker-container"><button type="button"><span class="wp-color-result-text"></span></button><input class="wui-sp-colorpicker"><button class="wp-picker-clear">Clear</button></div>',{runScripts:'outside-only',url:'https://site.test/'});
    const w=dom.window,$=jquery(w);w.jQuery=$;
    t.after(async()=>{await new Promise(resolve=>setTimeout(resolve,0));w.close();});
    w.matchMedia=()=>({matches:true});w.requestAnimationFrame=fn=>fn();
    const label='<img src=x onerror=alert(1)> & Choose color';
    $('.wp-color-result-text').text(label);
    $.fn.wpColorPicker=function(){this.data('wpColorPicker',true);return this;};
    w.eval(await readFile(resolve(root,'dist/js/settings-panel.js'),'utf8'));
    w.eval(await readFile(resolve(root,'dist/wordpress/js/settings-panel.js'),'utf8'));
    assert.equal(w.document.querySelector('.screen-reader-text').textContent,label);
    assert.equal(w.document.querySelector('img,[onerror]'),null);
    assert.equal(w.document.querySelectorAll('.wui-sp-color-icon').length,1);
});

test('WP demo transport prepares legacy completion markup as inert plain text', async t => {
    const dom=new JSDOM('<div class="js-wui-di-page"></div>',{runScripts:'outside-only'});
    const w=dom.window,$=jquery(w);w.jQuery=$;t.after(()=>w.close());
    let adapter;
    w.WebiliaUI={demoImport:{init(root,options){adapter=options;}}};
    const response={title:'Import &amp; Finish',message:'<p>Ready &amp; safe</p><img src=x onerror=alert(1)>'};
    $.ajax=()=>$.Deferred().resolve(response).promise();
    w.eval(await readFile(resolve(root,'dist/wordpress/js/demo-import.js'),'utf8'));
    const result=await new Promise((resolve,reject)=>adapter.request({data:{action:'after_import_data'}}).done(resolve).fail(reject));
    assert.equal(result.title,'Import & Finish');
    assert.equal(result.message,'Ready & safe');
    assert.equal(response.message,'<p>Ready &amp; safe</p><img src=x onerror=alert(1)>');
    assert.equal(w.document.querySelector('img,[onerror]'),null);
});
