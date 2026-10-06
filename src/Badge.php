<?php

namespace Webilia\UI;

final class Badge
{
    /** @param array<string, mixed> $props */
    public static function render(array $props): string
    {
        $tone = (string) ($props['tone'] ?? 'neutral');
        if (!in_array($tone, ['neutral', 'info', 'success', 'warning', 'danger'], true)) {
            $tone = 'neutral';
        }

        $class = Html::className('wui-badge wui-badge--' . $tone . ' ' . ($props['class'] ?? ''));

        return '<span class="' . Html::escape($class) . '">' . Html::escape($props['label'] ?? '') . '</span>';
    }
}
