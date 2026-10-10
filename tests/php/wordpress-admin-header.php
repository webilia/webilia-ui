<?php

require __DIR__ . '/bootstrap.php';

use Webilia\UI\WordPress\AdminHeader;

$actions = [];
$screen = null;
$propsCalls = 0;

function add_action($hook, $callback): void
{
    global $actions;
    $actions[$hook][] = $callback;
}

function get_current_screen()
{
    global $screen;
    return $screen;
}

AdminHeader::register('toplevel_page_example', static function () use (&$propsCalls): array {
    ++$propsCalls;
    return ['title' => 'Example', 'home_url' => 'https://example.com'];
}, 'product-admin invalid/class');

check(count($actions['in_admin_header']) === 1, 'Header should register on the early WordPress hook.');

ob_start();
$actions['in_admin_header'][0]();
check(ob_get_clean() === '', 'Header must not render without a screen.');

$screen = (object) ['id' => 'dashboard'];
ob_start();
$actions['in_admin_header'][0]();
check(ob_get_clean() === '', 'Header must not render on other screens.');
check($propsCalls === 0, 'Other screens must not resolve product header properties.');

$screen = (object) ['id' => 'toplevel_page_example'];
ob_start();
$actions['in_admin_header'][0]();
$html = ob_get_clean();
check(strpos($html, 'class="wui wui-admin-header product-admin"') !== false, 'Header wrapper must keep only safe classes.');
check(strpos($html, 'class="wui-header"') !== false, 'Header renderer was not used.');
check(strpos($html, 'Example') !== false, 'Product title is missing.');
check($propsCalls === 1, 'Header properties should resolve only on the intended screen.');

echo "WordPress admin header checks passed.\n";
