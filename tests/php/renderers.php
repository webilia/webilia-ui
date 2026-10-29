<?php

require __DIR__ . '/bootstrap.php';

use Webilia\UI\Badge;
use Webilia\UI\Breadcrumb;
use Webilia\UI\Header;
use Webilia\UI\Modal;
use Webilia\UI\Notice;

$badge = Badge::render(['label' => '<script>alert(1)</script>', 'tone' => 'success']);
check(strpos($badge, '<script>') === false, 'Badge must escape text.');
check(strpos($badge, 'wui-badge--success') !== false, 'Badge tone missing.');

$breadcrumb = Breadcrumb::render([
    'aria_label' => 'Page trail',
    'items' => [
        ['label' => 'Automations', 'url' => '/admin.php?page=wibee&section=automation'],
        ['label' => '<Daily Publish>', 'url' => '/should-not-link'],
    ],
]);
check(strpos($breadcrumb, '<nav class="wui-breadcrumb" aria-label="Page trail">') !== false, 'Breadcrumb navigation is missing.');
check(strpos($breadcrumb, 'href="/admin.php?page=wibee&amp;section=automation"') !== false, 'Breadcrumb ancestor link is missing.');
check(strpos($breadcrumb, '&lt;Daily Publish&gt;') !== false, 'Breadcrumb must escape labels.');
check(strpos($breadcrumb, 'aria-current="page"') !== false, 'Breadcrumb current item must be identified.');
check(strpos($breadcrumb, '/should-not-link') === false, 'Breadcrumb current item must not be linked.');
check(strpos(Breadcrumb::render(['items' => [['label' => 'Unsafe', 'url' => 'javascript:alert(1)'], ['label' => 'Current']]]), 'javascript:') === false, 'Breadcrumb must reject unsafe URLs.');
check(Breadcrumb::render(['items' => []]) === '', 'Empty breadcrumb must render nothing.');

$notice = Notice::render(['message' => '<b>Danger</b>', 'tone' => 'danger', 'detail' => 'Try again.']);
check(strpos($notice, '&lt;b&gt;Danger&lt;/b&gt;') !== false, 'Notice must escape text.');
check(strpos($notice, 'role="alert"') !== false, 'Danger notice must use alert role.');
check(strpos($notice, 'wui-icon--alert wui-notice__icon" aria-hidden="true"') !== false, 'Danger notice needs a decorative leading icon.');
check(strpos($notice, 'wui-notice__icon') < strpos($notice, 'wui-notice__content'), 'Notice icon must precede its text.');

$header = Header::render([
    'title' => 'WiBee <Admin>',
    'home_url' => 'javascript:alert(1)',
    'mark_html' => '<span class="mark">W</span>',
    'nav_label' => 'WiBee sections',
    'nav' => [
        ['label' => 'Home', 'url' => '/admin.php?page=wibee', 'active' => true],
        ['label' => 'Bad', 'url' => 'javascript:alert(1)'],
    ],
]);
check(strpos($header, 'WiBee &lt;Admin&gt;') !== false, 'Header must escape title.');
check(strpos($header, 'javascript:') === false, 'Header must reject unsafe URLs.');
check(strpos($header, 'aria-current="page"') !== false, 'Active navigation must be identified.');
check(strpos($header, '<span class="mark">W</span>') !== false, 'Trusted mark slot missing.');

$obfuscated = Header::render(['title' => 'X', 'home_url' => "java\nscript:alert(1)"]);
check(strpos($obfuscated, 'href=') === false, 'Header must reject URL schemes containing controls.');

$modal = Modal::render([
    'id' => 'example-modal',
    'title' => '<Confirm>',
    'body_html' => '<p>Trusted body</p>',
    'footer_html' => '<button type="button">Close</button>',
]);
check(strpos($modal, 'class="wui wui-modal') !== false, 'Modal must be its own scoped root.');
check(strpos($modal, '&lt;Confirm&gt;') !== false, 'Modal title must be escaped.');
check(strpos($modal, '<p>Trusted body</p>') !== false, 'Trusted body slot missing.');
check(strpos($modal, 'aria-labelledby="example-modal-title"') !== false, 'Modal title reference missing.');

try {
    Modal::render(['id' => 'bad id']);
    throw new RuntimeException('Invalid modal id was accepted.');
} catch (InvalidArgumentException $expected) {
    // Expected.
}

echo "PHP renderer checks passed.\n";

$modal = Modal::render([
    'id' => 'settings', 'size' => 'xl', 'form' => true,
    'form_attributes' => ['id' => 'settings-form', 'data-action' => 'save', 'onclick' => 'bad()', 'action' => 'javascript:bad()'],
    'body_html' => '<input name="setting">', 'footer_html' => '<button type="submit">Save</button>',
    'panel_class' => 'product-panel bad/class', 'body_class' => 'product-body',
    'escape_close' => false, 'backdrop_close' => false, 'close_button' => false, 'mount_to_body' => true,
]);
check(strpos($modal, 'wui-modal--xl') !== false, 'XL size must be supported.');
check(strpos($modal, 'data-wui-modal-escape-close="0"') !== false && strpos($modal, 'data-wui-modal-mount="body"') !== false, 'Modal options missing.');
check(strpos($modal, 'data-wui-modal-close') === false, 'Close controls should be omitted.');
check(strpos($modal, 'wui-modal__panel product-panel') !== false && strpos($modal, 'wui-modal__body product-body') !== false, 'Panel/body classes missing.');
check(strpos($modal, 'onclick') === false && strpos($modal, 'javascript:') === false && strpos($modal, 'bad/class') === false, 'Unsafe form attributes/classes accepted.');
check(strpos($modal, '<form id="settings-form" data-action="save">') < strpos($modal, '<input'), 'Form must wrap the body.');
check(strpos($modal, '<button type="submit">Save</button>') < strpos($modal, '</form>'), 'Form must wrap the footer.');
check(strpos(Modal::render(['id' => 'external', 'form_id' => 'owner']), 'data-wui-modal-form="owner"') !== false, 'External owner missing.');

$notice = Notice::render(['message_html' => '<a href="/help">Help</a>', 'dismissible' => true, 'dismiss_label' => '<Close>']);
check(strpos($notice, '<a href="/help">Help</a>') !== false, 'Explicit trusted message slot missing.');
check(strpos($notice, 'aria-label="&lt;Close&gt;"') !== false, 'Dismiss label must be escaped.');
check(strpos(Notice::render(['message' => 'Persistent']), 'data-wui-notice-dismiss') === false, 'Notice must remain persistent by default.');

$header = Header::render(['title' => 'Product', 'version' => '<1.4>', 'page_title' => '<Settings>', 'title_actions' => [
    ['label' => '<Add>', 'url' => '/new'], ['label' => 'Bad', 'url' => 'javascript:bad()'],
]]);
check(strpos($header, '&lt;1.4&gt;') !== false && strpos($header, '&lt;Settings&gt;') !== false && strpos($header, '&lt;Add&gt;') !== false, 'Header metadata must be escaped.');
check(strpos($header, 'javascript:') === false && strpos($header, 'href="/new"') !== false, 'Title actions must use safe links.');
echo "Consumer parity renderer checks passed.\n";
