<?php

namespace Webilia\UI\Support;

use Webilia\UI\Html;

/** Internal helpers shared by the extracted renderers. */
final class Presentation
{
    public static function escape($value): string { return Html::escape($value); }
    public static function url($value): string { return Html::url($value); }
    public static function key($value): string { return preg_replace('/[^a-z0-9_-]/', '', strtolower((string) $value)); }
    public static function className($value): string { return preg_replace('/[^A-Za-z0-9_-]/', '', (string) $value); }
    public static function checked($value, $current, $echo = true): string
    {
        $html = (string) $value === (string) $current ? ' checked="checked"' : '';
        if ($echo) echo $html;
        return $html;
    }
}
