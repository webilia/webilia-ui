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
            if (($action['type'] ?? '') === 'button') {
                $target = Html::escape($action['target'] ?? '');
                $count = isset($action['count']) ? max(0, (int) $action['count']) : null;
                $icon = Html::className('wui-icon wui-icon--' . ($action['icon'] ?? 'inbox'));
                $label = (string) ($action['label'] ?? '');
                $countLabel = (string) ($action['count_label'] ?? ($label . ' ({count})'));
                $accessibleLabel = $count !== null ? str_replace('{count}', (string) $count, $countLabel) : $label;
                $iconHtml = ($action['icon'] ?? '') === 'bell'
                    ? '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M9 20h6"/></svg>'
                    : '<span class="' . Html::escape($icon) . '" aria-hidden="true"></span>';
                $actions .= '<button type="button" class="wui-button wui-button--secondary wui-button--icon wui-header__icon-action"'
                    . ' aria-label="' . Html::escape($accessibleLabel) . '" data-wui-count-label="' . Html::escape($countLabel) . '" aria-controls="' . $target
                    . '" aria-expanded="false" data-wui-modal-open="' . $target . '">'
                    . $iconHtml
                    . ($count !== null ? '<span class="wui-badge" data-wui-announcement-count' . ($count === 0 ? ' hidden' : '') . '>' . $count . '</span>' : '')
                    . '</button>';
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
