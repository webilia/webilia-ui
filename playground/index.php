<?php

spl_autoload_register(static function (string $class): void {
    $prefix = 'Webilia\\UI\\';
    if (strpos($class, $prefix) !== 0) return;
    $path = dirname(__DIR__) . '/src/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
    if (is_file($path)) require $path;
});

use Webilia\UI\Badge;
use Webilia\UI\Header;
use Webilia\UI\Modal;
use Webilia\UI\Notice;

$header = Header::render([
    'title' => 'Webilia UI',
    'home_url' => '/playground/',
    'mark_html' => '<span class="playground-mark" aria-hidden="true">W</span>',
    'actions' => [['label' => 'Documentation', 'url' => 'https://github.com/webilia/webilia-ui', 'variant' => 'secondary', 'new_tab' => true]],
    'nav_label' => 'Playground sections',
    'nav' => [
        ['label' => 'Foundations', 'url' => '#foundations', 'active' => true],
        ['label' => 'Actions', 'url' => '#actions'],
        ['label' => 'Forms', 'url' => '#forms'],
        ['label' => 'Feedback', 'url' => '#feedback'],
        ['label' => 'Overlays', 'url' => '#overlays'],
        ['label' => 'RTL', 'url' => '#rtl'],
    ],
]);

$modal = Modal::render([
    'id' => 'example-modal',
    'title' => 'Example dialog',
    'body_html' => '<p>This modal is rendered in PHP and enhanced by a separate JavaScript module.</p><label class="wui-field"><span class="wui-field__label">Name</span><input class="wui-input" type="text" placeholder="Try keyboard focus"></label>',
    'footer_html' => '<button type="button" class="wui-button wui-button--secondary" data-wui-modal-close>Cancel</button><button type="button" class="wui-button" data-wui-modal-close>Done</button>',
    'close_label' => 'Close example dialog',
]);
?><!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Webilia UI Playground</title>
  <?php foreach (['tokens', 'layout', 'buttons', 'header', 'forms', 'surfaces', 'badge', 'notice', 'feedback', 'modal', 'icons', 'toast'] as $style): ?>
    <link rel="stylesheet" href="/dist/css/<?php echo htmlspecialchars($style, ENT_QUOTES, 'UTF-8'); ?>.css">
  <?php endforeach; ?>
  <style>
    body { margin: 0; background: #f6f7f7; font: 14px/1.5 system-ui, sans-serif; }
    .playground-content { max-width: 1160px; margin: 0 auto; padding: 32px 20px 64px; }
    .playground-intro { margin: 0 0 28px; color: #646970; }
    .playground-section { margin-block: 32px; }
    .playground-section > h2 { margin: 0 0 14px; font-size: 22px; }
    .playground-mark { display: inline-grid; place-items: center; width: 32px; height: 32px; border-radius: 8px; background: #3858e9; color: #fff; font-weight: 800; }
    .playground-swatch { min-height: 92px; padding: 12px; border-radius: 8px; font-weight: 600; }
    .playground-swatch--primary { color: #fff; background: var(--wui-color-primary); }
    .playground-swatch--surface { background: var(--wui-color-surface); border: 1px solid var(--wui-color-border); }
    .playground-swatch--success { background: var(--wui-color-success-soft); color: var(--wui-color-success); }
    .playground-swatch--danger { background: var(--wui-color-danger-soft); color: var(--wui-color-danger); }
    .playground-muted { color: #646970; }
  </style>
</head>
<body>
  <div class="wui">
    <?php echo $header; ?>
    <main class="playground-content">
      <h1>Component playground</h1>
      <p class="playground-intro">A standalone PHP page showing the component API, states, responsive layout, and right-to-left behavior.</p>

      <section id="foundations" class="playground-section">
        <h2>Foundations and surfaces</h2>
        <div class="wui-grid" style="--wui-grid-columns: 4">
          <div class="playground-swatch playground-swatch--primary">Primary</div>
          <div class="playground-swatch playground-swatch--surface">Surface</div>
          <div class="playground-swatch playground-swatch--success">Success</div>
          <div class="playground-swatch playground-swatch--danger">Danger</div>
        </div>
        <div class="wui-grid" style="margin-block-start: 16px">
          <section class="wui-card wui-section">
            <div class="wui-section__header"><h3 class="wui-section__title">Connection card</h3><?php echo Badge::render(['label' => 'Connected', 'tone' => 'success']); ?></div>
            <p>A card composes a heading, status badge, body, and action.</p>
            <div class="wui-actions"><button type="button" class="wui-button wui-button--secondary">Manage connection</button></div>
          </section>
          <section class="wui-panel wui-section">
            <h3 class="wui-section__title">Panel</h3><p>Panels have the same spacing and border with no card shadow.</p>
            <hr class="wui-divider"><p class="playground-muted">Parents own spacing through gap.</p>
          </section>
        </div>
      </section>

      <section id="actions" class="playground-section">
        <h2>Actions</h2>
        <div class="wui-card wui-stack">
          <div class="wui-inline">
            <button type="button" class="wui-button">Primary</button>
            <button type="button" class="wui-button wui-button--secondary">Secondary</button>
            <button type="button" class="wui-button wui-button--tertiary">Tertiary</button>
            <button type="button" class="wui-button wui-button--danger">Danger</button>
            <button type="button" class="wui-button wui-button--icon" aria-label="More actions">⋯</button>
          </div>
          <div class="wui-inline">
            <button type="button" class="wui-button" disabled>Disabled</button>
            <button type="button" class="wui-button" aria-busy="true"><span class="wui-spinner" aria-hidden="true"></span> Loading</button>
            <button type="button" class="wui-button wui-button--secondary" id="busy-demo">Try busy state</button>
          </div>
          <p class="playground-muted">Use Tab to inspect visible focus states. Reduce motion in your system settings to inspect motion behavior.</p>
        </div>
      </section>

      <section id="forms" class="playground-section">
        <h2>Forms</h2>
        <div class="wui-card">
          <form class="wui-form" onsubmit="return false">
            <div class="wui-grid">
              <div class="wui-field"><label class="wui-field__label" for="name">Name</label><input class="wui-input" id="name" value="Example automation"><p class="wui-field__help">Shown in your automation list.</p></div>
              <div class="wui-field"><label class="wui-field__label" for="count">Posts per run</label><input class="wui-input" id="count" type="number" min="1" value="2"></div>
              <div class="wui-field"><label class="wui-field__label" for="tone">Tone</label><select class="wui-select" id="tone"><option>Professional</option><option>Friendly</option></select></div>
              <div class="wui-field"><label class="wui-field__label" for="invalid">Invalid field</label><input class="wui-input" id="invalid" aria-invalid="true" aria-describedby="invalid-error"><p class="wui-field__error" id="invalid-error">This field is required.</p></div>
            </div>
            <div class="wui-field"><label class="wui-field__label" for="prompt">Prompt</label><textarea class="wui-textarea" id="prompt" rows="3">Write a useful draft.</textarea></div>
            <div class="wui-inline"><label class="wui-choice"><input type="checkbox" checked> Notify me</label><label class="wui-choice"><input type="radio" name="publish" checked> Draft</label><label class="wui-choice"><input type="radio" name="publish"> Publish</label><label class="wui-choice"><input type="checkbox" disabled> Disabled</label></div>
            <div class="wui-actions"><button class="wui-button" type="submit">Save settings</button></div>
          </form>
        </div>
      </section>

      <section id="feedback" class="playground-section">
        <h2>Feedback</h2>
        <div class="wui-stack">
          <?php echo Notice::render(['message' => 'Settings saved.', 'tone' => 'success']); ?>
          <?php echo Notice::render(['message' => 'Check your connection.', 'detail' => 'Retry after reconnecting your site.', 'tone' => 'warning']); ?>
          <?php echo Notice::render(['message' => 'Unable to save settings.', 'tone' => 'danger']); ?>
          <div class="wui-inline">
            <?php foreach (['neutral', 'info', 'success', 'warning', 'danger'] as $tone) echo Badge::render(['label' => ucfirst($tone), 'tone' => $tone]); ?>
          </div>
          <div class="wui-card wui-stack">
            <h3 class="wui-section__title">Icons and toasts</h3>
            <div class="wui-inline" aria-label="Icon samples">
              <?php foreach (['stars', 'checkmark-circle', 'alert', 'question', 'cross'] as $icon): ?>
                <span class="wui-icon wui-icon--<?php echo htmlspecialchars($icon, ENT_QUOTES, 'UTF-8'); ?>" aria-hidden="true" style="font-size: 24px"></span>
              <?php endforeach; ?>
            </div>
            <div class="wui-inline">
              <?php foreach (['neutral', 'info', 'success', 'warning', 'danger', 'loading'] as $tone): ?>
                <button type="button" class="wui-button wui-button--secondary" data-toast-tone="<?php echo htmlspecialchars($tone, ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars(ucfirst($tone), ENT_QUOTES, 'UTF-8'); ?> toast</button>
              <?php endforeach; ?>
            </div>
          </div>
        </div>
      </section>

      <section id="overlays" class="playground-section">
        <h2>Overlays</h2>
        <div class="wui-inline">
          <button type="button" class="wui-button" data-wui-modal-open="example-modal">Open PHP modal</button>
          <button type="button" class="wui-button wui-button--danger" id="confirm-demo">Open confirmation</button>
          <span id="confirm-result" role="status" aria-live="polite"></span>
        </div>
      </section>

      <section id="rtl" class="playground-section" dir="rtl">
        <h2>RTL example</h2>
        <div class="wui-card wui-stack">
          <div class="wui-inline"><button type="button" class="wui-button">פעולה ראשית</button><?php echo Badge::render(['label' => 'Active', 'tone' => 'info']); ?></div>
          <div class="wui-field"><label class="wui-field__label" for="rtl-input">שם</label><input class="wui-input" id="rtl-input" value="דוגמה"></div>
          <?php echo Notice::render(['message' => 'Example direction-aware notice', 'tone' => 'info']); ?>
          <button type="button" class="wui-button" data-toast-tone="success">عرض إشعار</button>
        </div>
      </section>
    </main>
  </div>
  <?php echo $modal; ?>
  <script src="/dist/js/modal.js"></script>
  <script src="/dist/js/busy.js"></script>
  <script src="/dist/js/toast.js"></script>
  <script>
    document.querySelectorAll('[data-toast-tone]').forEach(function (button) {
      button.addEventListener('click', function () {
        WebiliaUI.toast.show(button.textContent.trim(), {
          root: button.closest('[dir="rtl"]') || button.closest('.wui'),
          tone: button.dataset.toastTone,
          closeLabel: 'Dismiss notification'
        });
      });
    });
    document.getElementById('confirm-demo').addEventListener('click', async function () {
      const accepted = await WebiliaUI.modal.confirm({ title: 'Delete this automation?', message: 'This action cannot be undone.', confirmLabel: 'Delete', cancelLabel: 'Cancel', danger: true });
      document.getElementById('confirm-result').textContent = accepted ? 'Confirmed' : 'Cancelled';
    });
    document.getElementById('busy-demo').addEventListener('click', function () {
      const button = this;
      WebiliaUI.busy.setBusy(button.parentElement, true);
      window.setTimeout(() => WebiliaUI.busy.setBusy(button.parentElement, false), 1200);
    });
  </script>
</body>
</html>
