<?php
require __DIR__ . '/bootstrap.php';
echo '<div class="wui">' . \Webilia\UI\Header::render(['title' => 'Example', 'actions' => [
    ['type' => 'button', 'label' => 'Announcements', 'target' => 'center', 'count' => 1],
]]) . '</div>';
echo \Webilia\UI\AnnouncementCenter::render(['id' => 'center', 'active' => [
    ['id' => 'remote:1', 'title' => 'Update', 'description_html' => '<strong>Safe content</strong>'],
]]);
echo \Webilia\UI\DeactivationFeedbackDialog::render(['id' => 'feedback', 'reasons' => [
    'other' => ['title' => 'Other', 'placeholder' => 'Explain'], 'temporary' => ['title' => 'Temporary'],
]]);
