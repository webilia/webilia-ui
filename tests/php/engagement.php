<?php
require __DIR__ . '/bootstrap.php';
use Webilia\UI\AnnouncementCenter;
use Webilia\UI\DeactivationFeedbackDialog;
use Webilia\UI\Header;
$html = AnnouncementCenter::render(['id' => 'center', 'class' => 'example-brand', 'title' => '<script>bad</script>', 'active' => [
    ['id' => '1" onclick="bad', 'title' => '<img src=x>', 'description_html' => '<strong>Allowed</strong>', 'url' => 'javascript:bad()', 'cta_label' => 'Bad'],
]]);
check(strpos($html, 'wui-announcements example-brand') !== false, 'Drawer must accept a consumer theme class.');
check(strpos($html, '<script>') === false && strpos($html, '<img src=x>') === false, 'Titles must be escaped.');
check(strpos($html, '<strong>Allowed</strong>') !== false, 'Sanitized description slot should retain markup.');
check(strpos($html, 'javascript:') === false, 'Unsafe CTA rejected.');
$header = Header::render(['actions' => [['type' => 'button', 'label' => 'News', 'target' => 'center', 'count' => 0], ['url' => '/settings', 'label' => 'Settings']]]);
check(strpos($header, 'data-wui-announcement-count hidden') !== false && strpos($header, 'href="/settings"') !== false, 'Zero count and legacy links supported.');
$dialog = DeactivationFeedbackDialog::render(['id' => 'dfd', 'description' => '<script>description</script>', 'class' => 'example-brand', 'reasons' => ['other' => ['title' => '<script>bad</script>', 'placeholder' => 'Details']], 'privacy_url' => 'javascript:bad()']);
check(strpos($dialog, 'form="dfd-form"') !== false && strpos($dialog, 'aria-describedby="dfd-description"') !== false, 'Footer submits the associated form and description is accessible.');
check(strpos($dialog, 'wui-deactivation example-brand') !== false, 'Feedback must accept a consumer theme class.');
check(strpos($dialog, '<script>') === false && strpos($dialog, 'javascript:') === false, 'Feedback properties escaped.');
check(strpos($dialog, 'site URL, selected reason and optional comments') !== false, 'Default disclosure must disclose the payload.');
echo "Engagement renderer checks passed.\n";
