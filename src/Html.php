<?php

namespace Webilia\UI;

final class Html
{
    public static function escape($value): string
    {
        return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    public static function className($value): string
    {
        $names = preg_split('/\s+/', trim((string) $value)) ?: [];
        $safe = [];

        foreach ($names as $name) {
            if (preg_match('/^[a-zA-Z_][a-zA-Z0-9_-]*$/', $name)) {
                $safe[] = $name;
            }
        }

        return implode(' ', $safe);
    }

    public static function url($value): string
    {
        $url = trim((string) $value);
        if ($url === '' || preg_match('/[\x00-\x20\x7f]/', $url)) {
            return '';
        }
        $scheme = parse_url($url, PHP_URL_SCHEME);

        if ($scheme !== null && $scheme !== false && !in_array(strtolower($scheme), ['http', 'https', 'mailto'], true)) {
            return '';
        }

        return self::escape($url);
    }
}
