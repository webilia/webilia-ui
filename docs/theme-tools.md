# Settings Panel and Demo Import UI (1.5)

These opt-in renderers and browser modules preserve the existing Webilia theme-tool experience.
They require PHP 7.4+ and work without WordPress. WordPress integration is provided by
`webilia/wp:^1.2`; it prepares queries, translated labels, nonce/hidden fields, trusted field HTML,
and supplies media/editor/Customizer/AJAX adapters.

## Render fields and layouts

```php
use Webilia\UI\SettingsPanel\Fields;
use Webilia\UI\SettingsPanel\Layout;

$input = Fields::text(['name' => 'theme[title]', 'id' => 'title', 'value' => 'Example']);
echo Layout::render([
    'config' => ['option_name' => 'theme'],
    'header_html' => '<h1>Theme settings</h1>',
    'sections' => ['general' => [
        'title' => 'General', 'has_content' => true,
        'fields' => [['id' => 'title', 'title' => 'Title', 'html' => $input]],
    ]],
]);
```

All legacy field presentation types remain available as static methods on `Fields`, including
text/select/checkbox/radio, grouped color/layout fields, typography, media/gallery views,
repeaters/slides, tabs, import/export, panel-theme and nav-position controls. Values and options
are prepared data: UI does not query WordPress or fetch fonts. `Fields::editor()` renders a
textarea; WP overrides it with its native editor. Media values may contain `id` and `url`;
gallery previews are supplied through the overridable attachment lookup methods. Query-backed
choices are passed in `options`. `Fields::typography()` accepts a `fonts` map. Field-local labels,
placeholder text, and options are caller-owned; subclasses may override protected `translate()`
for standard field-control labels. Return unescaped plain text from `translate()`; the renderer
escapes each label at its final HTML/attribute boundary, including nested field options. Core field methods use late-static binding so adapters apply
to nested controls as well.

`Layout` accepts prepared section/field arrays, `config`, `post_url`, `nonce`, `header_html`,
`hidden_html`, optional `panel_intro_html`, `actions_top_html`/`actions_bottom_html`, and translated `labels` maps
keyed by the English labels in `Layout::LABELS`. `Actions::render(['bottom' => true])` renders a
standalone action bar. The layout renders a `.wui` wrapper; standalone fields need a `.wui.wui-sp-root`
ancestor. Text and URL slots are escaped. `*_html`, field `html`, `panel_attrs`, raw/content/info
field content, Customizer binding attributes and section descriptions are **trusted caller HTML**;
never pass unsanitized user input to them. Configure field `attributes` only from trusted code.

## Demo screens

```php
use Webilia\UI\DemoImport\Screen;

echo Screen::render([
    'demos' => [['key' => 'starter', 'import_file_name' => 'Starter',
        'categories' => ['Business'], 'preview_url' => 'https://example.com']],
    'categories' => ['business' => 'Business'],
    'plugins_by_demo' => [[]],
    'labels' => ['Select The Demo' => 'Choose a demo'],
]);
```

The screen accepts prepared importer data, endpoint/visit/guide URLs, `post_action`, and
trusted `nonce_html`, `page_header_html`, `page_title_html`, `page_intro_html` slots.
Optional templates are `title.php`, `intro.php`, `progress-template.php`,
`setup-plugin-item-template.php`, and `setup-plugins-empty.php`; unknown template names fail.
`Screen::LABELS` lists translatable view strings. Import workflow/state belongs to the host.

## Assets and browser adapters

Load `settings-panel` or `demo-import` through `WordPress\Assets::enqueue()` or their corresponding
`dist/css/` and `dist/js/` files. The WordPress adapter resolves existing forms/buttons/surfaces/icons
dependencies. `settings-customizer` contains only shared appearance for Customizer controls.
The settings-panel registry also loads its bundled Font Awesome and Elusive styles. Standalone
non-WordPress consumers should load those styles from `dist/vendor/settings-panel/` too.
Component source is under `assets/`; compiled output and required images/fonts ship under `dist/`.

WordPress-specific browser adapters also ship in this UI package, separately under
`assets/wordpress/{css,js}/` (source) and `dist/wordpress/{css,js}/` (distribution). They cover
settings-panel, settings-customizer and demo-import. These are opt-in: loading a generic UI module
does not load WordPress adapters. `webilia/wp:^1.2` supplies the PHP enqueueing, native WordPress
dependencies, localized configuration, permissions and request handling. It loads the adapters
from the explicit UI package URL; consumers do not copy browser assets into the WP package.

```js
const runtime = WebiliaUI.settingsPanel.create({
  labels: translatedLabels,
  customizer: false,
  // Optional host callbacks: setColor(input, value), selectMedia(config, done),
  // sortable(list, update). WordPress supplies these from its adapter.
});
runtime.app.init();
// Initialize controls inserted later:
runtime.app.initContext(insertedContainer);

WebiliaUI.demoImport.init(importerRoot, {
  jquery: jQuery,
  labels: translatedImporterLabels,
  request(config) { return hostRequest(config); }
});
```

Settings presentation uses vanilla JavaScript. The importer preserves its existing jQuery
interaction model, accepting jQuery from the host instead of bundling another copy. Its injected
`request(config)` returns a jQuery-compatible promise (`done`/`fail`), receiving data with stage
actions `install_plugin`, `import_demo_data`, `import_customizer_data`, `after_import_data`.
`selectMedia(config, done)` supplies one prepared attachment object for media/repeater selection,
and an array of attachment objects for gallery selection (`config.multiple: true`). Objects use
`id`, `url`, optional `type`, and optional `sizes.thumbnail.url` for previews. The shared runtime
handles selection, remove/clear controls, and value-change events. WP supplies the picker and
registers its native color-picker module; typography does not reference a UI color-picker global.
`config.panel_intro` is escaped text; use the explicit trusted `panel_intro_html` slot for markup.
The WP adapter adds isolated endpoint action names. Do not mutate the supplied request payload,
because a content continuation can reuse it. Existing response status names are preserved.
Modules initialize only on explicit calls, once per page/root, and do not attach to legacy selectors.

Selectors use `wui-sp-*` for settings and `wui-di-*` for importer presentation. Settings
`--webilia-*` theme-variable names remain compatible with saved themes. Bundled Font Awesome
and Elusive icon assets retain existing field-icon support and notices under
`dist/vendor/settings-panel`; new controls reuse the Webilia UI primitives.

See `/playground/theme-tools.php` for an executable standalone example with a mock transport.
`npm run check` includes renderer and DOM tests. `npm run test:browser` covers desktop/mobile RTL,
reduced motion, keyboard input, form/JSON serialization, navigation and importer success/failure.
Release `v1.5.0` only after review and merge; WP `v1.2.0` follows it. Phase 2 consumers are unchanged.
