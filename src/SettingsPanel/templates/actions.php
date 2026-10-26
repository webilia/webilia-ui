<?php
namespace Webilia\UI\SettingsPanel;
use Webilia\UI\Support\Presentation as P;

$is_bottom = !empty($props['bottom']);
$labels = $props['labels'] ?? [];
$translate = static function ($text) use ($labels) { return P::escape($labels[$text] ?? $text); };

/** @var bool $is_bottom */
?>
<div class="<?php echo $is_bottom ? 'wui-sp-panel-actions wui-sp-panel-actions-bottom' : 'wui-sp-panel-actions wui-sp-panel-actions-top'; ?>">
    <div class="wui-sp-panel-actions-left">
        <?php if (!$is_bottom) : ?>
            <div class="wui-sp-panel-section-heading">
                <h2 class="wui-sp-panel-section-title"></h2>
                <button type="button" class="wui-sp-action-reset-section-icon" data-action="reset_section" data-loading-text="<?php echo $translate('Resetting...'); ?>" title="<?php echo $translate('Reset section'); ?>" aria-label="<?php echo $translate('Reset section'); ?>">
                    <i class="wui-icon wui-icon--reset" aria-hidden="true"></i>
                </button>
                <span class="wui-sp-panel-actions-message" aria-live="polite"></span>
            </div>
        <?php endif; ?>
        <div class="wui-sp-action-buttons">
            <button type="button" class="wui-button wui-sp-primary-button wui-sp-action-save" data-action="save" data-loading-text="<?php echo $translate('Saving...'); ?>">
                <span class="wui-sp-button-label"><?php echo $translate('Save Settings'); ?></span>
                <i class="wui-icon wui-icon--checkmark-circle" aria-hidden="true"></i>
            </button>
            <button type="button" class="wui-button wui-button--secondary wui-sp-secondary-button wui-sp-action-reset-all" data-action="reset_all" data-loading-text="<?php echo $translate('Resetting...'); ?>">
                <span class="wui-sp-button-label"><?php echo $translate('Reset All'); ?></span>
                <i class="wui-icon wui-icon--cross" aria-hidden="true"></i>
            </button>
        </div>
    </div>
</div>
