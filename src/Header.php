<?php

namespace Webilia\UI;

final class Header
{
    /** @param array<string, mixed> $props */
    public static function render(array $props): string
    {
        $title = Html::escape($props['title'] ?? '');
        $home = Html::url($props['home_url'] ?? '');
        $mark = (string) ($props['mark_html'] ?? ''); // Trusted HTML supplied by the product.
        $brand = $mark . '<span class="wui-header__title">' . $title . '</span>';
        $brand = $home !== '' ? '<a class="wui-header__brand" href="' . $home . '">' . $brand . '</a>'
            : '<div class="wui-header__brand">' . $brand . '</div>';

        $actions = '';
        foreach ((array) ($props['actions'] ?? []) as $action) {
            if (!is_array($action)) {
                continue;
            }
            $url = Html::url($action['url'] ?? '');
            if ($url === '') {
                continue;
            }
            $variant = (string) ($action['variant'] ?? 'secondary');
            if (!in_array($variant, ['primary', 'secondary', 'tertiary', 'danger'], true)) {
                $variant = 'secondary';
            }
            $external = !empty($action['new_tab']) ? ' target="_blank" rel="noopener noreferrer"' : '';
            $actions .= '<a class="wui-button wui-button--' . $variant . '" href="' . $url . '"' . $external . '>'
                . Html::escape($action['label'] ?? '') . '</a>';
        }

        $nav = '';
        foreach ((array) ($props['nav'] ?? []) as $item) {
            if (!is_array($item)) {
                continue;
            }
            $url = Html::url($item['url'] ?? '');
            if ($url === '') {
                continue;
            }
            $active = !empty($item['active']);
            $nav .= '<a class="wui-header__nav-link' . ($active ? ' is-active' : '') . '" href="' . $url . '"'
                . ($active ? ' aria-current="page"' : '') . '>' . Html::escape($item['label'] ?? '') . '</a>';
        }

        $class = Html::className('wui-header ' . ($props['class'] ?? ''));
        $output = '<header class="' . Html::escape($class) . '"><div class="wui-header__top">' . $brand;
        if ($actions !== '') {
            $output .= '<div class="wui-header__actions">' . $actions . '</div>';
        }
        $output .= '</div>';
        if ($nav !== '') {
            $label = Html::escape($props['nav_label'] ?? 'Section navigation');
            $output .= '<nav class="wui-header__nav" aria-label="' . $label . '">' . $nav . '</nav>';
        }

        return $output . '</header>';
    }
}
