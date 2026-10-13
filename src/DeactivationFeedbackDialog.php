<?php

namespace Webilia\UI;

final class DeactivationFeedbackDialog
{
    /** @param array<string, mixed> $props */
    public static function render(array $props): string
    {
        $id = (string) ($props['id'] ?? '');
        $formId = $id . '-form';
        $labels = $props['labels'] ?? [];
        $body = '<form id="' . Html::escape($formId) . '" data-wui-deactivation-feedback>'
            . '<fieldset class="wui-deactivation__reasons"><legend class="wui-deactivation__legend">'
            . Html::escape($labels['reason'] ?? 'Reason') . '</legend>';
        $details = '';
        foreach (($props['reasons'] ?? []) as $key => $reason) {
            $reasonId = $id . '-reason-' . md5((string) $key);
            $body .= '<label class="wui-deactivation__choice" for="' . Html::escape($reasonId) . '">'
                . '<input type="radio" name="reason" id="' . Html::escape($reasonId) . '" value="' . Html::escape($key) . '">'
                . '<span class="wui-deactivation__icon ' . Html::escape(Html::className('wui-icon wui-icon--' . ($reason['icon'] ?? 'question')))
                . '" aria-hidden="true"></span><span class="wui-deactivation__reason-title">'
                . Html::escape($reason['title'] ?? '') . '</span></label>';
            if (!empty($reason['placeholder'])) {
                $details .= '<label class="wui-field wui-deactivation__details" data-wui-reason-details="' . Html::escape($key) . '" hidden>'
                    . '<span class="wui-field__label">' . Html::escape($labels['details'] ?? 'Details (optional)')
                    . '</span><textarea class="wui-textarea" maxlength="4000" name="details_' . Html::escape($key)
                    . '" placeholder="' . Html::escape($reason['placeholder']) . '" disabled></textarea></label>';
            }
        }
        $body .= '</fieldset>' . $details . '<p class="wui-deactivation__disclosure">'
            . Html::escape($props['disclosure'] ?? 'Submitting feedback sends the site URL, selected reason and optional comments to Webilia.') . '</p>';
        $links = '';
        foreach (['privacy' => 'Privacy policy', 'support' => 'Support'] as $name => $label) {
            $url = Html::url($props[$name . '_url'] ?? '');
            if ($url !== '') $links .= '<a href="' . $url . '" target="_blank" rel="noopener noreferrer">'
                . Html::escape($labels[$name] ?? $label) . '</a>';
        }
        if ($links !== '') $body .= '<div class="wui-deactivation__links">' . $links . '</div>';
        $body .= '<p role="alert" data-wui-feedback-error></p></form>';
        $footer = '<button type="button" class="wui-button wui-button--tertiary" data-wui-feedback-skip>'
            . Html::escape($labels['skip'] ?? 'Skip & Deactivate') . '</button>'
            . '<div class="wui-deactivation__submit-actions"><button type="button" class="wui-button wui-button--secondary" data-wui-modal-close>'
            . Html::escape($labels['cancel'] ?? 'Cancel') . '</button>'
            . '<button type="submit" class="wui-button" form="' . Html::escape($formId) . '">'
            . Html::escape($labels['submit'] ?? 'Submit & Deactivate') . '</button></div>';
        return Modal::render(['id' => $id, 'title' => $props['title'] ?? 'Deactivation feedback',
            'description' => $props['description'] ?? '', 'close_label' => $labels['close'] ?? 'Close dialog',
            'class' => 'wui-deactivation ' . ($props['class'] ?? ''), 'body_html' => $body, 'footer_html' => $footer]);
    }
}
