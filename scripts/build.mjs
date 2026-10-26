import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import * as sass from 'sass';

const root = resolve(import.meta.dirname, '..');
const cssDir = resolve(root, 'dist/css');
const jsDir = resolve(root, 'dist/js');
const styles = ['tokens', 'layout', 'buttons', 'header', 'breadcrumb', 'forms', 'surfaces', 'badge', 'notice', 'feedback', 'modal', 'icons', 'toast', 'announcements', 'deactivation', 'settings-panel', 'settings-customizer', 'demo-import'];
const scripts = ['modal', 'busy', 'toast', 'notice', 'announcements', 'deactivation', 'settings-panel', 'demo-import'];

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
  const exportName = name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  const autoInit = ['modal', 'notice'].includes(name) ? '__wuiModule.init(document);' : '';
  const wrapped = `(function (global) {\n  global.WebiliaUI = global.WebiliaUI || {};\n  if (global.WebiliaUI.${exportName}) return;\n${source}\n  global.WebiliaUI.${exportName} = __wuiModule;\n  ${autoInit}\n})(window);\n`;
  await writeFile(resolve(jsDir, `${name}.js`), wrapped);
}

// WordPress adapters are opt-in distributions, separate from the platform-neutral modules.
const wordpressModules = ['settings-panel', 'settings-customizer', 'demo-import'];
await mkdir(resolve(root, 'dist/wordpress/css'), { recursive: true });
await mkdir(resolve(root, 'dist/wordpress/js'), { recursive: true });
for (const name of wordpressModules) {
  await copyFile(resolve(root, `assets/wordpress/css/${name}.css`), resolve(root, `dist/wordpress/css/${name}.css`));
  const result = await build({
    entryPoints: [resolve(root, `assets/wordpress/js/${name}.js`)],
    bundle: true,
    format: 'iife',
    write: false,
    minify: false,
    target: 'es2018',
  });
  await writeFile(resolve(root, `dist/wordpress/js/${name}.js`), result.outputFiles[0].text);
}
