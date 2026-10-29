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
        $icons = ['info' => 'inbox', 'success' => 'checkmark-circle', 'warning' => 'alert', 'danger' => 'alert'];
        $icon = '<span class="wui-icon wui-icon--' . $icons[$tone] . ' wui-notice__icon" aria-hidden="true"></span>';
        $detail = isset($props['detail']) && $props['detail'] !== ''
            ? '<p class="wui-notice__detail">' . Html::escape($props['detail']) . '</p>'
            : '';

        // This explicit slot accepts only trusted, consumer-sanitized HTML.
        $message = array_key_exists('message_html', $props)
            ? '<div class="wui-notice__message">' . (string) $props['message_html'] . '</div>'
            : '<p class="wui-notice__message">' . Html::escape($props['message'] ?? '') . '</p>';
        $dismiss = !empty($props['dismissible'])
            ? '<button type="button" class="wui-button wui-button--icon wui-notice__dismiss" data-wui-notice-dismiss aria-label="'
                . Html::escape($props['dismiss_label'] ?? 'Dismiss notice') . '"><span aria-hidden="true">&times;</span></button>'
            : '';
        return '<div class="' . Html::escape($class) . '" role="' . $role . '" aria-live="' . $live . '">'
            . $icon . '<div class="wui-notice__content">' . $message . $detail . '</div>' . $dismiss . '</div>';
    }
}
