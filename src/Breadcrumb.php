<?php

namespace Webilia\UI;

final class Breadcrumb
{
    /** @param array<string, mixed> $props */
    public static function render(array $props): string
    {
        $items = [];
        foreach ((array) ($props['items'] ?? []) as $item) {
            if (!is_array($item) || trim((string) ($item['label'] ?? '')) === '') {
                continue;
            }
            $items[] = $item;
        }

        if (!$items) {
            return '';
        }

        $last = count($items) - 1;
        $list = '';
        foreach ($items as $index => $item) {
            $label = Html::escape($item['label']);
            $url = $index === $last ? '' : Html::url($item['url'] ?? '');
            $content = $url !== ''
                ? '<a class="wui-breadcrumb__link" href="' . $url . '">' . $label . '</a>'
                : '<span' . ($index === $last ? ' aria-current="page"' : '') . '>' . $label . '</span>';
            $separator = $index === 0 ? '' : '<span class="wui-breadcrumb__separator" aria-hidden="true">/</span>';
            $list .= '<li class="wui-breadcrumb__item">' . $separator . $content . '</li>';
        }

        $class = Html::className('wui-breadcrumb ' . ($props['class'] ?? ''));
        $aria_label = Html::escape($props['aria_label'] ?? 'Breadcrumb');

        return '<nav class="' . Html::escape($class) . '" aria-label="' . $aria_label . '"><ol class="wui-breadcrumb__list">' . $list . '</ol></nav>';
    }
}
