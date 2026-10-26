<?php
namespace Webilia\UI\DemoImport;
use Webilia\UI\Support\Presentation as P;



?>
<div class="wui-di__import-progress">
    <ol class="wui-di__import-steps">
        <li class="wui-di__import-step is-pending" data-step="plugins">
            <span class="wui-di__import-step-label"><?php print($translate('Installing plugins')); ?></span>
            <span class="wui-di__import-step-note"><?php print($translate('Waiting')); ?></span>
        </li>
        <li class="wui-di__import-step" data-step="content">
            <span class="wui-di__import-step-label"><?php print($translate('Content')); ?></span>
            <span class="wui-di__import-step-note"><?php print($translate('Waiting')); ?></span>
        </li>
        <li class="wui-di__import-step" data-step="customizer">
            <span class="wui-di__import-step-label"><?php print($translate('Customizer')); ?></span>
            <span class="wui-di__import-step-note"><?php print($translate('Waiting')); ?></span>
        </li>
        <li class="wui-di__import-step" data-step="after">
            <span class="wui-di__import-step-label"><?php print($translate('After import')); ?></span>
            <span class="wui-di__import-step-note"><?php print($translate('Waiting')); ?></span>
        </li>
        <li class="wui-di__import-step" data-step="complete">
            <span class="wui-di__import-step-label"><?php print($translate('Completed')); ?></span>
            <span class="wui-di__import-step-note"><?php print($translate('Waiting')); ?></span>
        </li>
    </ol>
    <div class="wui-di__import-result js-wui-di-import-result"></div>
</div>
