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
