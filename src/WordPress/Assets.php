<?php

namespace Webilia\UI\WordPress;

use InvalidArgumentException;
use Webilia\UI\Version;

final class Assets
{
    private const COMPONENTS = [
        'layout' => ['style' => 'layout'],
        'buttons' => ['style' => 'buttons'],
        'header' => ['style' => 'header', 'requires' => ['buttons']],
        'forms' => ['style' => 'forms'],
        'surfaces' => ['style' => 'surfaces'],
        'badge' => ['style' => 'badge'],
        'notice' => ['style' => 'notice'],
        'feedback' => ['style' => 'feedback'],
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
            self::style($item['style'], $base);
            if (isset($item['script'])) {
                $handle = 'webilia-ui-v1-' . $item['script'];
                wp_enqueue_script($handle, $base . 'js/' . $item['script'] . '.js', [], Version::VALUE, true);
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

    private static function style(string $name, string $base): void
    {
        $handle = 'webilia-ui-v1-' . $name;
        $deps = $name === 'tokens' ? [] : ['webilia-ui-v1-tokens'];
        wp_enqueue_style($handle, $base . 'css/' . $name . '.css', $deps, Version::VALUE);
    }
}
