# Component reference

Load `tokens` and each component stylesheet that appears in a screen. Place ordinary content in a `.wui` wrapper. A PHP-rendered modal is itself a `.wui` root, so it may be placed directly under `body`.

| Module | CSS | JS | PHP |
| --- | --- | --- | --- |
| Tokens | `tokens` | — | — |
| Layout | `layout` | — | — |
| Buttons | `buttons` | — | — |
| Header | `header`, `buttons` | — | `Header::render()` |
| Forms | `forms` | — | — |
| Surfaces | `surfaces` | — | — |
| Badge | `badge` | — | `Badge::render()` |
| Notice | `notice` | — | `Notice::render()` |
| Spinner/loading | `feedback` | optional `busy` | — |
| Modal/confirmation | `modal`, `buttons` | `modal` | `Modal::render()` |
| Icons | `icons` | — | — |
| Toast | `toast`, `icons` | `toast` | — |

## Layout, buttons, and surfaces

```html
<div class="wui wui-stack wui-gap-5">
  <div class="wui-grid" style="--wui-grid-columns: 2">
    <section class="wui-card wui-section">
      <div class="wui-section__header"><h2 class="wui-section__title">Connection</h2></div>
      <p>Connected to Webilia.</p>
      <div class="wui-actions">
        <button type="button" class="wui-button">Save</button>
        <button type="button" class="wui-button wui-button--secondary">Cancel</button>
        <button type="button" class="wui-button wui-button--tertiary">Help</button>
        <button type="button" class="wui-button wui-button--danger">Delete</button>
        <button type="button" class="wui-button wui-button--icon" aria-label="More options">⋯</button>
      </div>
    </section>
    <div class="wui-panel">Another panel</div>
  </div>
</div>
```

The parent owns spacing through `gap`; components do not add outside margins. `wui-grid` stacks at 782px. Use logical CSS properties for product-specific rules so RTL works naturally.

## Fields

```html
<form class="wui-form">
  <div class="wui-field">
    <label class="wui-field__label" for="topic">Topic</label>
    <input class="wui-input" id="topic" name="topic" aria-describedby="topic-help">
    <p class="wui-field__help" id="topic-help">Optional.</p>
  </div>
  <div class="wui-field">
    <label class="wui-field__label" for="count">Post count</label>
    <input class="wui-input" type="number" id="count" name="count" min="1" aria-invalid="true" aria-describedby="count-error">
    <p class="wui-field__error" id="count-error">Enter at least one.</p>
  </div>
  <label class="wui-choice"><input type="checkbox" name="notify"> Notify me</label>
  <label class="wui-choice"><input type="radio" name="mode" value="draft"> Draft</label>
  <select class="wui-select" aria-label="Tone"><option>Professional</option></select>
  <textarea class="wui-textarea" aria-label="Prompt"></textarea>
</form>
```

Use native checkbox and radio inputs. Associate help/error text with the control using `aria-describedby`; set `aria-invalid="true"` for errors. Do not replace field validation or product data handling with UI code.

## PHP renderers

`Header::render(array $props)` accepts `title`, `home_url`, trusted `mark_html`, optional `actions` (`label`, `url`, `variant`, `new_tab`), `nav_label`, and `nav` (`label`, `url`, `active`). Empty or unsupported URLs are omitted. Navigation uses `aria-current="page"` for the active link.

`Badge::render(array $props)` accepts `label` and `tone`: `neutral`, `info`, `success`, `warning`, or `danger`.

`Notice::render(array $props)` accepts `message`, optional `detail`, and `tone`: `info`, `success`, `warning`, or `danger`. Warning and danger use an alert live region; other tones use a status live region.

`Modal::render(array $props)` requires a unique `id` and accepts `title`, trusted `body_html`, trusted `footer_html`, `size` (`small`, `medium`, `large`), and translated `close_label`. The renderer returns initially hidden markup with dialog semantics. Open it with `data-wui-modal-open="id"` or `WebiliaUI.modal.open('id')`; close with `data-wui-modal-close` or `WebiliaUI.modal.close('id')`.

All renderer methods return HTML strings. They do not echo, translate, enqueue assets, or call WordPress functions. Labels and ordinary text are escaped; trusted HTML slots remain the caller's responsibility.

## Interaction and state

`WebiliaUI.modal.init(root)` installs delegated click and keyboard handling once per root. Opening focuses the first control, Escape and backdrop clicks close, Tab remains within the top modal, body scrolling is locked, and focus returns to the opener. A programmatic confirmation returns `Promise<boolean>`; provide translated labels in its options. `wui:modal:opened` and `wui:modal:closed` events bubble from the modal element.

`WebiliaUI.busy.setBusy(element, true)` sets `aria-busy`, adds `wui-is-loading`, and disables controls inside the element. Calling it with `false` restores only controls that helper disabled. `WebiliaUI.busy.isBusy(element)` reports the current state. Put a `<span class="wui-spinner" aria-hidden="true"></span>` beside an accessible loading label when a visible indicator is needed.

## Icons and toast

Load the icons stylesheet and font files, then use a decorative icon beside visible text:

~~~html
<span class="wui-icon wui-icon--stars" aria-hidden="true"></span>
~~~

For an icon-only button, put the accessible label on the button. All 139 names are in the [icon catalog](icons.md). The font family and classes are distinct from the older standalone webilia/icons package, so both may appear on a page.

Toast is for short-lived feedback. It is independent of WordPress and jQuery:

~~~js
const toast = WebiliaUI.toast.show('Settings saved.', {
  root: document.querySelector('.wui'),
  tone: 'success',
  position: 'bottom-right',
  durationMs: 8000,
  progress: true,
  closeLabel: 'Dismiss notification',
});
toast.update('Save failed.', { tone: 'danger', durationMs: 8000 });
toast.dismiss();
~~~

The show method returns an object with element, update(message, options), and dismiss(). Tones are neutral, info, success, warning, danger, and loading. Positions are top-left, top-center, top-right, bottom-left, bottom-center, and bottom-right. The default duration is 8000 ms; loading defaults to no timeout. Progress is on by default for timed toasts and can be disabled with progress: false. Hover or keyboard focus pauses the remaining time. Supply translated message and closeLabel from the product. Messages use textContent; HTML is not accepted. Toasts do not move focus. Use the modal component for decisions requiring action.

The root option should be the product's .wui container so the toast inherits its color tokens. If omitted, the module creates a neutral .wui portal under body. Several toasts in the same root and position share a region. The toast stylesheet is scoped to .wui; its font-face declaration only registers a uniquely named font family.

When importing the icon SCSS into a product build, set the font URLs for that build's output location:

~~~scss
@use "path/to/vendor/webilia/ui/assets/scss/components/icons" with (
  $font-woff2-url: "/assets/fonts/webilia-ui-icons.woff2",
  $font-woff-url: "/assets/fonts/webilia-ui-icons.woff"
);
~~~

Use the default neutral tokens or override semantic `--wui-*` variables on a product's `.wui` root. Do not edit compiled component CSS to change branding.
