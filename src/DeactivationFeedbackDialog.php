<?php

namespace Webilia\UI;

final class DeactivationFeedbackDialog
{
    /** @param array<string, mixed> $props */
    public static function render(array $props): string
    {
        $id = (string) ($props['id'] ?? '');
        $labels = $props['labels'] ?? [];
        $body = '<form data-wui-deactivation-feedback><p>' . Html::escape($props['description'] ?? '')
            . '</p><fieldset><legend>' . Html::escape($labels['reason'] ?? 'Reason') . '</legend>';
        foreach (($props['reasons'] ?? []) as $key => $reason) {
            $reasonId = $id . '-reason-' . md5((string) $key);
            $body .= '<div class="wui-deactivation__reason"><label for="' . Html::escape($reasonId)
                . '"><span class="' . Html::escape(Html::className('wui-icon wui-icon--' . ($reason['icon'] ?? 'question')))
                . '" aria-hidden="true"></span><input type="radio" name="reason" id="' . Html::escape($reasonId)
                . '" value="' . Html::escape($key) . '"> ' . Html::escape($reason['title'] ?? '') . '</label>';
            if (!empty($reason['placeholder'])) {
                $body .= '<label class="wui-field" data-wui-reason-details="' . Html::escape($key) . '" hidden>'
                    . '<span class="wui-field__label">' . Html::escape($labels['details'] ?? 'Details (optional)')
                    . '</span><textarea class="wui-textarea" maxlength="4000" name="details_' . Html::escape($key)
                    . '" placeholder="' . Html::escape($reason['placeholder']) . '" disabled></textarea></label>';
            }
            $body .= '</div>';
        }
        $body .= '</fieldset><p>' . Html::escape($props['disclosure'] ?? 'Submitting feedback sends the site URL, selected reason and optional comments to Webilia.') . '</p>';
        foreach (['privacy' => 'Privacy policy', 'support' => 'Support'] as $name => $label) {
            $url = Html::url($props[$name . '_url'] ?? '');
            if ($url !== '') $body .= '<p><a href="' . $url . '" target="_blank" rel="noopener noreferrer">' . Html::escape($labels[$name] ?? $label) . '</a></p>';
        }
        $body .= '<p role="alert" data-wui-feedback-error></p><div class="wui-deactivation__actions">'
            . '<button type="button" class="wui-button wui-button--tertiary" data-wui-feedback-skip>'
            . Html::escape($labels['skip'] ?? 'Skip & Deactivate') . '</button>'
            . '<button type="button" class="wui-button wui-button--secondary" data-wui-modal-close>'
            . Html::escape($labels['cancel'] ?? 'Cancel') . '</button>'
            . '<button type="submit" class="wui-button">' . Html::escape($labels['submit'] ?? 'Submit & Deactivate')
            . '</button></div></form>';
        return Modal::render(['id' => $id, 'title' => $props['title'] ?? 'Deactivation feedback',
            'close_label' => $labels['close'] ?? 'Close dialog', 'class' => 'wui-deactivation', 'body_html' => $body]);
    }
}
