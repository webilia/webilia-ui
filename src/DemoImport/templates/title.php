<?php
namespace Webilia\UI\DemoImport;
use Webilia\UI\Support\Presentation as P;



/** @var string $text */

$text = $text ?? '';
$fallback = $fallback ?? '';
$logo_url = isset($logo_url) ? (string) $logo_url : '';

$title = trim((string) $text);
if ($title === '') $title = trim((string) $fallback);
if ($title === '') $title = $labels['Demo Importer'] ?? 'Demo Importer';
?>
<div class="wui-di__title-container wui-sp-demo-import-title">
    <?php if ($logo_url !== ''): ?>
        <img class="wui-di__logo" alt="<?php echo P::escape($title); ?>" src="<?php echo P::url($logo_url); ?>">
    <?php endif; ?>
    <h1 class="wui-di__title-container-title"><?php echo P::escape($title); ?></h1>
</div>
