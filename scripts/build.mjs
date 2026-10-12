import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import * as sass from 'sass';

const root = resolve(import.meta.dirname, '..');
const cssDir = resolve(root, 'dist/css');
const jsDir = resolve(root, 'dist/js');
const styles = ['tokens', 'layout', 'buttons', 'header', 'breadcrumb', 'forms', 'surfaces', 'badge', 'notice', 'feedback', 'modal', 'icons', 'toast', 'announcements', 'deactivation'];
const scripts = ['modal', 'busy', 'toast', 'announcements', 'deactivation'];

await mkdir(cssDir, { recursive: true });
await mkdir(jsDir, { recursive: true });

for (const name of styles) {
  const modulePath = name === 'tokens' ? 'tokens' : `components/${name}`;
  const result = sass.compileString(`@use "${modulePath}";`, {
    loadPaths: [resolve(root, 'assets/scss')],
    style: 'expanded',
  });
  await writeFile(resolve(cssDir, `${name}.css`), result.css);
}

for (const name of scripts) {
  const result = await build({
    entryPoints: [resolve(root, `assets/js/${name}.js`)],
    bundle: true,
    format: 'iife',
    globalName: '__wuiModule',
    write: false,
    minify: false,
    target: 'es2018',
  });
  const source = result.outputFiles[0].text;
  const autoInit = name === 'modal' ? '__wuiModule.init(document);' : '';
  const wrapped = `(function (global) {\n  global.WebiliaUI = global.WebiliaUI || {};\n  if (global.WebiliaUI.${name}) return;\n${source}\n  global.WebiliaUI.${name} = __wuiModule;\n  ${autoInit}\n})(window);\n`;
  await writeFile(resolve(jsDir, `${name}.js`), wrapped);
}
