<?php

namespace Webilia\UI;

use InvalidArgumentException;

final class Modal
{
    /** @param array<string, mixed> $props */
    public static function render(array $props): string
    {
        $id = (string) ($props['id'] ?? '');
        if (!preg_match('/^[a-zA-Z][a-zA-Z0-9_-]*$/', $id)) {
            throw new InvalidArgumentException('Modal id must start with a letter and contain only letters, digits, _ or -.');
        }

        $size = (string) ($props['size'] ?? 'medium');
        if (!in_array($size, ['small', 'medium', 'large', 'xl'], true)) {
            $size = 'medium';
        }

        $titleId = $id . '-title';
        $class = Html::className('wui wui-modal wui-modal--' . $size . ' ' . ($props['class'] ?? ''));
        $panelClass = Html::className('wui-modal__panel ' . ($props['panel_class'] ?? ''));
        $bodyClass = Html::className('wui-modal__body ' . ($props['body_class'] ?? ''));
        $escapeClose = !isset($props['escape_close']) || (bool) $props['escape_close'];
        $backdropClose = !isset($props['backdrop_close']) || (bool) $props['backdrop_close'];
        $closeButton = !isset($props['close_button']) || (bool) $props['close_button'];
        $mount = !empty($props['mount_to_body']) ? ' data-wui-modal-mount="body"' : '';
        $formId = (string) ($props['form_id'] ?? '');
        if ($formId !== '' && !preg_match('/^[a-zA-Z][a-zA-Z0-9_-]*$/', $formId)) {
            throw new InvalidArgumentException('Modal form id must be a valid HTML identifier.');
        }
        $owner = $formId !== '' ? ' data-wui-modal-form="' . Html::escape($formId) . '"' : '';
        $formOpen = !empty($props['form']) ? '<form' . self::formAttributes((array) ($props['form_attributes'] ?? [])) . '>' : '';
        $heading = '<h2 id="' . Html::escape($titleId) . '">' . Html::escape($props['title'] ?? '') . '</h2>';
        $describedBy = '';
        if (!empty($props['description'])) {
            $descriptionId = $id . '-description';
            $heading = '<div class="wui-modal__heading">' . $heading . '<p class="wui-modal__description" id="'
                . Html::escape($descriptionId) . '">' . Html::escape($props['description']) . '</p></div>';
            $describedBy = ' aria-describedby="' . Html::escape($descriptionId) . '"';
        }
        $footer = !empty($props['footer_html'])
            ? '<div class="wui-modal__footer">' . (string) $props['footer_html'] . '</div>'
            : '';

        return '<div id="' . Html::escape($id) . '" class="' . Html::escape($class) . '" data-wui-modal data-wui-modal-escape-close="' . ($escapeClose ? '1' : '0') . '"' . $mount . $owner . ' hidden>'
            . '<div class="wui-modal__backdrop"' . ($backdropClose ? ' data-wui-modal-close' : '') . '></div>'
            . '<div class="' . Html::escape($panelClass) . '" role="dialog" aria-modal="true" aria-labelledby="' . Html::escape($titleId) . '"' . $describedBy . ' tabindex="-1">'
            . '<div class="wui-modal__header">' . $heading
            . ($closeButton ? '<button type="button" class="wui-button wui-button--icon wui-modal__close" data-wui-modal-close aria-label="'
                . Html::escape($props['close_label'] ?? 'Close dialog') . '"><span aria-hidden="true">&times;</span></button>' : '') . '</div>'
            . $formOpen . '<div class="' . Html::escape($bodyClass) . '">' . (string) ($props['body_html'] ?? '') . '</div>'
            . $footer . ($formOpen !== '' ? '</form>' : '') . '</div></div>';
    }

    /** @param array<string, mixed> $attributes */
    private static function formAttributes(array $attributes): string
    {
        $html = '';
        foreach ($attributes as $name => $value) {
            if (!is_scalar($value) || !preg_match('/^(id|class|name|method|action|enctype|target|autocomplete|novalidate|aria-[a-z-]+|data-[a-z0-9-]+)$/', (string) $name)) {
                continue;
            }
            if ($name === 'novalidate' && !$value) continue;
            if ($name === 'action') {
                $safe = Html::url($value);
                if ($safe === '') continue;
            } else {
                $safe = Html::escape($value);
            }
            $html .= ' ' . $name . '="' . $safe . '"';
        }
        return $html;
    }
}
