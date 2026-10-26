<?php

namespace Webilia\UI\SettingsPanel;

use Webilia\UI\Support\Presentation as P;

/** Layout HTML slots and panel_attrs are trusted markup prepared by the caller. */
final class Actions
{
    public static function render(array $props = []): string
    {
        ob_start();
        include __DIR__ . '/templates/actions.php';
        return (string) ob_get_clean();
    }
}
