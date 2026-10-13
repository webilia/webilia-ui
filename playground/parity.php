<?php

spl_autoload_register(static function (string $class): void {
    $prefix = 'Webilia\\UI\\';
    if (strpos($class, $prefix) !== 0) return;
    $path = dirname(__DIR__) . '/src/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
    if (is_file($path)) require $path;
});

use Webilia\UI\Header;
use Webilia\UI\Modal;
use Webilia\UI\Notice;
use Webilia\UI\DeactivationFeedbackDialog;

?><!doctype html>
<html lang="en" dir="<?php echo isset($_GET['rtl']) ? 'rtl' : 'ltr'; ?>">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Consumer parity playground</title>
  <?php foreach (['tokens', 'layout', 'buttons', 'header', 'forms', 'surfaces', 'notice', 'modal', 'icons', 'deactivation'] as $style): ?>
    <link rel="stylesheet" href="/dist/css/<?php echo htmlspecialchars($style, ENT_QUOTES, 'UTF-8'); ?>.css">
  <?php endforeach; ?>
  <style>
    body { margin: 0; font: 14px/1.5 system-ui, sans-serif; background: #f6f7f7; }
    .wui.consumer-theme { --wui-color-primary: #008c5e; --wui-color-primary-hover: #00754e; }
    .wui .parity-content { max-inline-size: 1000px; padding: 24px; margin-inline: auto; }
  </style>
</head>
<body>
  <div class="wui consumer-theme">
    <?php echo Header::render([
        'title' => 'Example product', 'version' => '1.4.0', 'page_title' => 'Settings',
        'title_actions' => [['label' => 'Add New', 'url' => '#forms']],
        'actions' => [['label' => 'Documentation', 'url' => '/docs/components.md']],
    ]); ?>
    <main class="parity-content wui-stack">
      <?php echo Notice::render(['tone' => 'warning', 'message_html' => 'Review <a href="/docs/components.md">the component guidance</a> before saving.', 'dismissible' => true]); ?>
      <?php echo Notice::render(['tone' => 'danger', 'message' => 'Persistent validation errors stay inline.']); ?>
      <form id="owner" class="wui-card wui-form">
        <label class="wui-field"><span class="wui-field__label">Offering name</span><input class="wui-input" name="name" value="Example offering"></label>
        <div class="wui-actions">
          <button type="button" class="wui-button" data-wui-modal-open="scheduling">Configure scheduling</button>
          <button type="button" class="wui-button wui-button--secondary" data-wui-modal-open="settings">Module settings</button>
          <button type="submit" class="wui-button">Serialize offering</button>
        </div>
        <?php echo Modal::render([
            'id' => 'scheduling', 'title' => 'Scheduling settings', 'class' => 'consumer-theme', 'size' => 'xl', 'mount_to_body' => true,
            'body_html' => '<label class="wui-field"><span class="wui-field__label">Duration</span><input class="wui-input" name="duration" value="30"></label>',
            'footer_html' => '<button type="button" class="wui-button wui-button--secondary" data-wui-modal-open="nested">Nested dialog</button><button type="button" class="wui-button" data-wui-modal-close>Done</button>',
        ]); ?>
      </form>
      <output id="result" role="status"></output>
      <button type="button" class="wui-button wui-button--secondary" data-wui-modal-open="feedback">Feedback links</button>
    </main>
  </div>
  <?php echo Modal::render([
      'id' => 'settings', 'title' => 'Module settings', 'class' => 'consumer-theme', 'form' => true,
      'form_attributes' => ['id' => 'module-form'], 'escape_close' => false, 'backdrop_close' => false,
      'body_html' => '<label class="wui-field"><span class="wui-field__label">Label</span><input class="wui-input" name="label" value="Module"></label>',
      'footer_html' => '<button type="button" class="wui-button wui-button--secondary" data-wui-modal-close>Cancel</button><button type="submit" class="wui-button">Save</button>',
  ]); ?>
  <?php echo Modal::render(['id' => 'nested', 'title' => 'Nested dialog', 'size' => 'small', 'class' => 'consumer-theme',
      'body_html' => '<p>Closing returns focus to Scheduling settings.</p>',
      'footer_html' => '<button type="button" class="wui-button" data-wui-modal-close>Back</button>']); ?>
  <?php echo DeactivationFeedbackDialog::render(['id' => 'feedback', 'title' => 'Feedback example', 'class' => 'consumer-theme',
      'reasons' => ['other' => ['title' => 'Other', 'placeholder' => 'Optional details']],
      'privacy_url' => '/privacy', 'terms_url' => '/terms', 'support_url' => '/support']); ?>
  <script src="/dist/js/modal.js"></script>
  <script src="/dist/js/notice.js"></script>
  <script src="/dist/js/deactivation.js"></script>
  <script>
    document.addEventListener('submit', (event) => {
      event.preventDefault();
      document.getElementById('result').textContent = JSON.stringify(Object.fromEntries(new FormData(event.target)));
      if (event.target.id === 'module-form') WebiliaUI.modal.close('settings');
    });
    WebiliaUI.deactivation.init(document.getElementById('feedback'), {
      submit: async () => { throw new Error('Example failure; no remote submission is made.'); },
      skip: () => WebiliaUI.modal.close('feedback')
    });
  </script>
</body>
</html>
