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
        if (!in_array($size, ['small', 'medium', 'large'], true)) {
            $size = 'medium';
        }

        $titleId = $id . '-title';
        $class = Html::className('wui wui-modal wui-modal--' . $size . ' ' . ($props['class'] ?? ''));
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

        return '<div id="' . Html::escape($id) . '" class="' . Html::escape($class) . '" data-wui-modal hidden>'
            . '<div class="wui-modal__backdrop" data-wui-modal-close></div>'
            . '<div class="wui-modal__panel" role="dialog" aria-modal="true" aria-labelledby="' . Html::escape($titleId) . '"' . $describedBy . ' tabindex="-1">'
            . '<div class="wui-modal__header">' . $heading
            . '<button type="button" class="wui-button wui-button--icon wui-modal__close" data-wui-modal-close aria-label="'
            . Html::escape($props['close_label'] ?? 'Close dialog') . '"><span aria-hidden="true">&times;</span></button></div>'
            . '<div class="wui-modal__body">' . (string) ($props['body_html'] ?? '') . '</div>'
            . $footer . '</div></div>';
    }
}
