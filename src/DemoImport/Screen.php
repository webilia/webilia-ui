<?php

namespace Webilia\UI\DemoImport;

use InvalidArgumentException;
use Webilia\UI\Support\Presentation as P;

/** Demo definitions and labels are data; *_html and nonce_html are trusted markup. */
final class Screen
{
    public const LABELS = [
        '%s import completed',
        'Active',
        'After import',
        'All Demos',
        'Applying Customizer',
        'Applying customizer data.',
        'Back to Demos',
        'Completed',
        'Congrats, your demo was imported successfully. You can now begin editing your site.',
        'Content',
        'Content Import',
        'Content file was not found.',
        'Content import completed successfully.',
        'Content import failed: %s',
        'Continue',
        'Customizer',
        'Customizer data file is empty.',
        'Customizer data format is invalid.',
        'Customizer file does not match the active theme.',
        'Customizer file was not found.',
        'Demo Guide Article',
        'Demo Import',
        'Demo Imported Successfully',
        'Demo Importer',
        'Demo data imported successfully.',
        'Demo import completed successfully.',
        'Demo import could not be started.',
        'Demo import has been started.',
        'Demo preview',
        'Directory plugin as the engine of the demos',
        'Done',
        'Failed',
        'Filter the collections, preview the design, then launch the import with the plugins it needs.',
        'Finalizing',
        'Import Complete!',
        'Import Completed',
        'Import Demo',
        'Import Progress',
        'Import Setup',
        'Import completed',
        'Import failed.',
        'Import finished',
        'Import started for "%s".',
        'Importing Content',
        'Importing Plugins',
        'Installed',
        'Installed plugin entry point was not found.',
        'Installing',
        'Installing plugin: %1$s (%2$d/%3$d)',
        'Installing plugins',
        'Invalid remote import file URL.',
        'Invalid request.',
        'No content import file was provided for this demo.',
        'No plugin installation is required for this demo.',
        'No plugin requirements defined for this demo.',
        'No preview image.',
        'Not installed',
        'Plugin',
        'Plugin Install',
        'Plugin installation failed.',
        'Plugin installation failed: %s',
        'Plugin installation step completed.',
        'Plugin is not available for selected demo.',
        'Plugin is ready.',
        'Plugin ready: %s',
        'Plugin slug is invalid.',
        'Plugin source is missing.',
        'Prepare your starter site',
        'Preview',
        'Processing content batch %d.',
        'Recommended',
        'Required',
        'Required and selected plugins are installed and activated here before content import begins.',
        'Running post-import tasks.',
        'Search',
        'Select The Demo',
        'Select which plugins should be installed before importing this demo.',
        'Selected Demo',
        'Selected demo is invalid.',
        'Start Again',
        'Starting content import for "%s".',
        'The',
        'The Content of the Demo is importing',
        'There are no predefined demo imports for currently active theme!',
        'Unknown',
        'Unknown server error.',
        'Untitled Demo',
        'Visit Site',
        'Waiting',
        'Widgets data file is empty.',
        'Widgets file format is invalid.',
        'Widgets file was not found.',
        'You are not allowed to activate plugins.',
        'You are not allowed to do this action.',
        'You are not allowed to install plugins.',
        'You can start exploring the site and customizing it. We have a useful blog post for you that helps you start better:',
        'Your demo import has been completed.',
    ];

    public static function render(array $props = [], string $template = 'page.php'): string
    {
        if (!in_array($template, ['page.php', 'title.php', 'intro.php', 'progress-template.php', 'setup-plugin-item-template.php', 'setup-plugins-empty.php'], true))
        {
            throw new InvalidArgumentException('Unknown demo import template.');
        }
        $labels = $props['labels'] ?? [];
        $translate = static function ($text) use ($labels) { return P::escape($labels[$text] ?? $text); };
        $text = $props['text'] ?? '';
        $fallback = $props['fallback'] ?? '';
        $logo_url = $props['logo_url'] ?? '';
        ob_start();
        include __DIR__ . '/templates/' . $template;
        $html = (string) ob_get_clean();
        return $template === 'page.php' ? '<div class="wui wui-di-root">' . $html . '</div>' : $html;
    }
}
