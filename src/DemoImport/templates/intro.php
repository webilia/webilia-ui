<?php
namespace Webilia\UI\DemoImport;
use Webilia\UI\Support\Presentation as P;



/** @var string $text */
/** @var string $fallback */
?>
<?php if (trim((string) ($text ?: $fallback)) !== ''): ?>
<div class="wui-di__intro-text">
    <p class="about-description"><?php echo P::escape(trim((string) ($text ?: $fallback))); ?></p>
</div>
<?php endif; ?>
