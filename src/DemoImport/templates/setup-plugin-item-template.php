<?php
namespace Webilia\UI\DemoImport;
use Webilia\UI\Support\Presentation as P;


?>
<li class="wui-di__setup-plugin-item js-wui-di-plugin-item-template">
    <div>
        <div class="wui-di-plugin-details">
        <span class="wui-di__setup-plugin-check">
            <label class="wui-di-switch">
                <input type="hidden" name="wdi_plugin_toggle" value="0">
                <input type="checkbox" id="wui-di-plugin-toggle" name="wdi_plugin_toggle" value="1">
                <span class="wui-di-slider"></span>
            </label>
        </span>
            <span class="wui-di__setup-plugin-name"></span>
        </div>
        <p class="wui-di-admin-description-tiny"><?php print($translate('Directory plugin as the engine of the demos')) ;?></p>
    </div>
    <div class="wui-di-plugin-status">
        <span class="wui-di__setup-plugin-type"></span>
        <span class="wui-di__setup-plugin-status js-wui-di-plugin-status wui-di-badge" data-slug=""></span>
    </div>
</li>
