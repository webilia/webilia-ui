<?php

namespace Webilia\UI;

final class AnnouncementCenter
{
    /** Description HTML must already be sanitized by the caller. @param array<string, mixed> $props */
    public static function render(array $props): string
    {
        $id = (string) ($props['id'] ?? '');
        $labels = $props['labels'] ?? [];
        $body = '<div data-wui-announcement-center><div role="tablist" aria-label="'
            . Html::escape($labels['tabs'] ?? 'Announcement status') . '">';
        foreach (['active' => 'Active', 'dismissed' => 'Dismissed'] as $tab => $label) {
            $body .= '<button type="button" class="wui-button wui-button--tertiary" role="tab" id="'
                . Html::escape($id . '-' . $tab . '-tab') . '" aria-controls="' . Html::escape($id . '-' . $tab)
                . '" aria-selected="' . ($tab === 'active' ? 'true' : 'false') . '" tabindex="'
                . ($tab === 'active' ? '0' : '-1') . '" data-wui-announcement-tab="' . $tab . '">'
                . Html::escape($labels[$tab] ?? $label) . '</button>';
        }
        $body .= '</div><p role="status" data-wui-announcement-status></p>';
        foreach (['active', 'dismissed'] as $tab) {
            $body .= '<div role="tabpanel" tabindex="0" id="' . Html::escape($id . '-' . $tab)
                . '" aria-labelledby="' . Html::escape($id . '-' . $tab . '-tab') . '" data-wui-announcement-list="'
                . $tab . '"' . ($tab === 'dismissed' ? ' hidden' : '') . '>';
            $items = $props[$tab] ?? [];
            foreach ($items as $item) {
                $body .= self::card($item, $tab === 'active', $labels);
            }
            $body .= '<p data-wui-announcement-empty' . ($items ? ' hidden' : '') . '>'
                . Html::escape($labels['empty_' . $tab] ?? 'No announcements.') . '</p></div>';
        }
        return Modal::render([
            'id' => $id, 'title' => $props['title'] ?? 'Announcements',
            'close_label' => $labels['close'] ?? 'Close announcements',
            'class' => 'wui-announcements ' . ($props['class'] ?? ''), 'body_html' => $body . '</div>',
        ]);
    }

    /** @param array<string, mixed> $item @param array<string, string> $labels */
    private static function card(array $item, bool $active, array $labels): string
    {
        $severity = $item['severity'] ?? 'info';
        $icons = ['info' => 'inbox', 'success' => 'checkmark-circle', 'warning' => 'alert', 'danger' => 'alert', 'error' => 'alert'];
        if (!isset($icons[$severity])) $severity = 'info';
        $html = '<article class="wui-announcement wui-announcement--' . $severity . '" data-wui-announcement-id="'
            . Html::escape($item['id'] ?? '') . '"><span class="wui-icon wui-icon--' . $icons[$severity]
            . '" aria-hidden="true"></span><h3>' . Html::escape($item['title'] ?? '')
            . '</h3><div class="wui-announcement__description">' . ($item['description_html'] ?? '') . '</div>';
        $html .= '<time datetime="' . Html::escape($item['date'] ?? '') . '" data-wui-announcement-date>'
            . Html::escape($item['date_label'] ?? '') . '</time>';
        $url = Html::url($item['url'] ?? '');
        if ($url !== '' && !empty($item['cta_label'])) {
            $html .= '<a class="wui-button wui-button--secondary" href="' . $url . '">'
                . Html::escape($item['cta_label']) . '</a>';
        }
        if ($active) {
            $html .= '<button type="button" class="wui-button wui-button--tertiary" data-wui-announcement-dismiss>'
                . Html::escape($labels['dismiss'] ?? 'Dismiss') . '</button>';
        }
        return $html . '</article>';
    }
}
