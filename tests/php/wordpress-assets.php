<?php

require __DIR__ . '/bootstrap.php';

use Webilia\UI\WordPress\Assets;

$styles = [];
$scripts = [];

function wp_enqueue_style($handle, $source, $deps, $version): void
{
    global $styles;
    if (!isset($styles[$handle])) {
        $styles[$handle] = compact('source', 'deps', 'version');
    }
}

function wp_enqueue_script($handle, $source, $deps, $version, $footer): void
{
    global $scripts;
    if (!isset($scripts[$handle])) {
        $scripts[$handle] = compact('source', 'deps', 'version', 'footer');
    }
}

Assets::enqueue([], 'https://example.com/one/');
check(!$styles && !$scripts, 'Empty selection must enqueue nothing.');

Assets::enqueue(['header', 'forms', 'badge'], 'https://example.com/one/');
check(isset($styles['webilia-ui-v1-tokens'], $styles['webilia-ui-v1-buttons'], $styles['webilia-ui-v1-header'], $styles['webilia-ui-v1-forms'], $styles['webilia-ui-v1-badge']), 'Selected styles or dependencies missing.');
check(!isset($styles['webilia-ui-v1-modal']), 'Unselected modal style was enqueued.');
check(!$scripts, 'Static components must not enqueue scripts.');

Assets::enqueue(['modal', 'busy'], 'https://example.com/one/');
check(isset($styles['webilia-ui-v1-modal'], $styles['webilia-ui-v1-feedback']), 'Interactive styles missing.');
check(isset($scripts['webilia-ui-v1-modal'], $scripts['webilia-ui-v1-busy']), 'Interactive scripts missing.');

$firstSource = $scripts['webilia-ui-v1-modal']['source'];
Assets::enqueue(['modal', 'busy'], 'https://example.com/two/');
check($scripts['webilia-ui-v1-modal']['source'] === $firstSource, 'Second same-version plugin replaced the shared script.');
check(count($scripts) === 2, 'Duplicate scripts were registered.');

echo "WordPress asset checks passed.\n";
