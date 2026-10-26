<?php

namespace Webilia\UI\WordPress;

use InvalidArgumentException;
use Webilia\UI\Version;

final class Assets
{
    private const COMPONENTS = [
        'settings-panel' => [
            'style' => 'settings-panel', 'script' => 'settings-panel',
            'requires' => ['forms', 'buttons', 'surfaces', 'icons'],
            'vendors' => [
                'settings-fontawesome' => 'vendor/settings-panel/font-awesome/css/font-awesome.min.css',
                'settings-elusive' => 'vendor/settings-panel/elusive-icons/css/elusive-icons.min.css',
            ],
        ],
        'settings-customizer' => ['style' => 'settings-customizer'],
        'demo-import' => ['style' => 'demo-import', 'script' => 'demo-import', 'requires' => ['forms', 'buttons', 'surfaces', 'icons']],
        'announcements' => ['style' => 'announcements', 'script' => 'announcements', 'requires' => ['modal', 'icons', 'badge']],
        'deactivation' => ['style' => 'deactivation', 'script' => 'deactivation', 'requires' => ['modal', 'forms', 'icons']],
        'layout' => ['style' => 'layout'],
        'buttons' => ['style' => 'buttons'],
        'header' => ['style' => 'header', 'requires' => ['buttons', 'icons']],
        'breadcrumb' => ['style' => 'breadcrumb'],
        'forms' => ['style' => 'forms'],
        'surfaces' => ['style' => 'surfaces'],
        'badge' => ['style' => 'badge'],
        'notice' => ['style' => 'notice'],
        'notice-dismiss' => ['style' => 'notice', 'script' => 'notice', 'requires' => ['buttons']],
        'feedback' => ['style' => 'feedback'],
        'icons' => ['style' => 'icons'],
        'toast' => ['style' => 'toast', 'script' => 'toast', 'requires' => ['icons']],
        'busy' => ['style' => 'feedback', 'script' => 'busy'],
        'modal' => ['style' => 'modal', 'script' => 'modal', 'requires' => ['buttons']],
    ];

    /**
     * Enqueue only selected modules. $packageUrl points to this package's root URL.
     *
     * @param string[] $components
     */
    public static function enqueue(array $components, string $packageUrl): void
    {
        if (!$components) {
            return;
        }

        $selected = [];
        foreach ($components as $component) {
            self::collect($component, $selected);
        }

        $base = rtrim($packageUrl, '/') . '/dist/';
        self::style('tokens', $base);
        foreach (array_keys($selected) as $component) {
            $item = self::COMPONENTS[$component];
            $vendorHandles = [];
            foreach ($item['vendors'] ?? [] as $name => $path) {
                $handle = 'webilia-ui-v1-' . $name;
                wp_enqueue_style($handle, $base . $path, [], Version::VALUE);
                $vendorHandles[] = $handle;
            }
            self::style($item['style'], $base, $vendorHandles);
            if (isset($item['script'])) {
                $handle = 'webilia-ui-v1-' . $item['script'];
                $deps = in_array($item['script'], ['announcements', 'deactivation'], true) ? ['webilia-ui-v1-modal'] : [];
                wp_enqueue_script($handle, $base . 'js/' . $item['script'] . '.js', $deps, Version::VALUE, true);
            }
        }
    }

    /** @param array<string, bool> $selected */
    private static function collect(string $component, array &$selected): void
    {
        if (!isset(self::COMPONENTS[$component])) {
            throw new InvalidArgumentException('Unknown Webilia UI component: ' . $component);
        }
        if (isset($selected[$component])) {
            return;
        }
        foreach (self::COMPONENTS[$component]['requires'] ?? [] as $dependency) {
            self::collect($dependency, $selected);
        }
        $selected[$component] = true;
    }

    /** @param string[] $extraDependencies */
    private static function style(string $name, string $base, array $extraDependencies = []): void
    {
        $handle = 'webilia-ui-v1-' . $name;
        $deps = array_merge($name === 'tokens' ? [] : ['webilia-ui-v1-tokens'], $extraDependencies);
        wp_enqueue_style($handle, $base . 'css/' . $name . '.css', $deps, Version::VALUE);
    }
}
