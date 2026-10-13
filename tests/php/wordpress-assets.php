<?php

require __DIR__ . '/bootstrap.php';

use Webilia\UI\WordPress\Assets;
use Webilia\UI\Version;

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

Assets::enqueue(['header'], 'https://example.com/one/');
check(isset($styles['webilia-ui-v1-icons']), 'Header icon buttons require the icon stylesheet even without announcements.');

Assets::enqueue(['header', 'breadcrumb', 'forms', 'badge'], 'https://example.com/one/');
check(isset($styles['webilia-ui-v1-tokens'], $styles['webilia-ui-v1-buttons'], $styles['webilia-ui-v1-header'], $styles['webilia-ui-v1-breadcrumb'], $styles['webilia-ui-v1-forms'], $styles['webilia-ui-v1-badge']), 'Selected styles or dependencies missing.');
check(!isset($styles['webilia-ui-v1-modal']), 'Unselected modal style was enqueued.');
check(!$scripts, 'Static components must not enqueue scripts.');

Assets::enqueue(['icons'], 'https://example.com/one/');
check(isset($styles['webilia-ui-v1-icons']), 'Icon font style missing.');
check(!isset($styles['webilia-ui-v1-toast']), 'Icons must not load toast CSS.');
check(!$scripts, 'Icons must not load JavaScript.');

Assets::enqueue(['modal', 'busy', 'toast'], 'https://example.com/one/');
check(isset($styles['webilia-ui-v1-modal'], $styles['webilia-ui-v1-feedback']), 'Interactive styles missing.');
check(isset($styles['webilia-ui-v1-toast'], $styles['webilia-ui-v1-icons']), 'Toast styles or icon dependency missing.');
check(isset($scripts['webilia-ui-v1-modal'], $scripts['webilia-ui-v1-busy'], $scripts['webilia-ui-v1-toast']), 'Interactive scripts missing.');

$firstSource = $scripts['webilia-ui-v1-modal']['source'];
$firstToastSource = $scripts['webilia-ui-v1-toast']['source'];
Assets::enqueue(['modal', 'busy', 'toast'], 'https://example.com/two/');
check($scripts['webilia-ui-v1-modal']['source'] === $firstSource, 'Second same-version plugin replaced the shared script.');
check($scripts['webilia-ui-v1-toast']['source'] === $firstToastSource, 'Second same-version plugin replaced the shared toast script.');
check(count($scripts) === 3, 'Duplicate scripts were registered.');

Assets::enqueue(['announcements', 'deactivation'], 'https://example.com/one/');
check($scripts['webilia-ui-v1-announcements']['deps'] === ['webilia-ui-v1-modal'], 'Announcement script must wait for modal.');
check($scripts['webilia-ui-v1-deactivation']['deps'] === ['webilia-ui-v1-modal'], 'Feedback script must wait for modal.');
check(isset($styles['webilia-ui-v1-forms'], $styles['webilia-ui-v1-icons'], $styles['webilia-ui-v1-badge']), 'Engagement dependencies missing.');

echo "WordPress asset checks passed.\n";
Assets::enqueue(['notice-dismiss'], 'https://example.com/one/');
check(isset($scripts['webilia-ui-v1-notice'], $styles['webilia-ui-v1-buttons']), 'Dismissible notice dependencies missing.');
$metadata = json_decode(file_get_contents(dirname(__DIR__, 2) . '/package.json'), true);
check($metadata['version'] === Version::VALUE, 'Build and PHP release versions must match.');
check($scripts['webilia-ui-v1-modal']['version'] !== '1.4.0', 'Changed assets must not reuse the version already shipped in v1.3.0.');
check($scripts['webilia-ui-v1-modal']['version'] === Version::VALUE && $styles['webilia-ui-v1-header']['version'] === Version::VALUE, 'Shared scripts/styles must use the current release cache version.');
