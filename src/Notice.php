<?php

namespace Webilia\UI;

final class Notice
{
    /** @param array<string, mixed> $props */
    public static function render(array $props): string
    {
        $tone = (string) ($props['tone'] ?? 'info');
        if (!in_array($tone, ['info', 'success', 'warning', 'danger'], true)) {
            $tone = 'info';
        }

        $role = in_array($tone, ['warning', 'danger'], true) ? 'alert' : 'status';
        $live = $role === 'alert' ? 'assertive' : 'polite';
        $class = Html::className('wui-notice wui-notice--' . $tone . ' ' . ($props['class'] ?? ''));
        $detail = isset($props['detail']) && $props['detail'] !== ''
            ? '<p class="wui-notice__detail">' . Html::escape($props['detail']) . '</p>'
            : '';

        return '<div class="' . Html::escape($class) . '" role="' . $role . '" aria-live="' . $live . '">'
            . '<p class="wui-notice__message">' . Html::escape($props['message'] ?? '') . '</p>'
            . $detail . '</div>';
    }
}
