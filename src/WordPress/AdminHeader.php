<?php

namespace Webilia\UI\WordPress;

use Webilia\UI\Header;
use Webilia\UI\Html;

final class AdminHeader
{
    /**
     * Render a product header before WordPress prints admin notices.
     *
     * @param callable(): array<string, mixed> $props Product-owned header properties.
     */
    public static function register(string $screenId, callable $props, string $wrapperClass = ''): void
    {
        add_action('in_admin_header', static function () use ($screenId, $props, $wrapperClass): void {
            $screen = get_current_screen();
            if (!$screen || $screen->id !== $screenId) {
                return;
            }

            $classes = Html::className('wui wui-admin-header ' . $wrapperClass);
            echo '<div class="' . Html::escape($classes) . '">';
            echo Header::render($props());
            echo '</div>';
        });
    }
}
