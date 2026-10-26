<?php
require __DIR__ . '/bootstrap.php';

use Webilia\UI\SettingsPanel\Fields;
use Webilia\UI\SettingsPanel\Layout;
use Webilia\UI\SettingsPanel\Actions;
use Webilia\UI\DemoImport\Screen;

set_error_handler(static function ($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});
$defaults = ['name' => 'theme[value]', 'id' => 'value', 'value' => '', 'options' => ['a' => '<Alpha>', 'b' => 'Beta']];
foreach (['text', 'password', 'date', 'datetime', 'spinner', 'slider', 'textarea', 'select', 'checkbox', 'checkboxes', 'radio', 'switcher', 'editor', 'color', 'color_rgba', 'color_palette', 'color_gradient', 'color_scheme', 'link_color', 'background', 'border', 'box_shadow', 'button_set', 'button_preview', 'dimensions', 'divide', 'info', 'raw', 'content', 'js_button', 'multi_text', 'palette', 'media', 'gallery', 'multi_media', 'google_maps', 'icon_select', 'image_select', 'select_image', 'import_export', 'panel_theme', 'panel_nav_position', 'link_color_scheme', 'repeater', 'slides', 'social_profiles', 'sortable', 'sorter', 'spacing', 'section', 'tabbed', 'typography', 'custom_fonts', 'customizer', 'taxonomy_metaboxes', 'user_profile_metaboxes', 'widget_areas'] as $type) {
    $args = $defaults;
    if (in_array($type, ['typography', 'background', 'border', 'box_shadow', 'dimensions', 'spacing', 'link_color', 'link_color_scheme', 'color_gradient', 'google_maps', 'repeater', 'slides', 'social_profiles'], true)) $args['value'] = [];
    $html = Fields::$type($args);
    check(is_string($html), 'Field must render without WordPress: ' . $type);
}
$text = Fields::text(['name' => 'theme[title]', 'value' => '"><script>bad()</script>']);
check(strpos($text, '<script>') === false && strpos($text, '&lt;script&gt;') !== false, 'Input escaping.');
$media = Fields::media(['name' => 'theme[image]', 'id' => 'image', 'value' => ['id' => 7, 'url' => 'https://example.test/image.png']]);
check(strpos($media, 'https://example.test/image.png') !== false && strpos($media, 'theme[image][id]') !== false, 'Prepared media data shape.');
$typography = Fields::typography(['name' => 'theme[font]', 'id' => 'font', 'fonts' => ['Poppins' => 'Poppins'], 'value' => ['font-family' => 'Poppins', 'font-size' => '16px']]);
check(strpos($typography, 'theme[font][font-size]') !== false && strpos($typography, '16px') !== false, 'Typography shape.');
$repeater = Fields::repeater(['name' => 'theme[rows]', 'fields' => ['title' => 'Title'], 'value' => [['title' => '<One>']]]);
check(strpos($repeater, 'data-fields=') !== false && strpos($repeater, '&lt;One&gt;') !== false, 'Repeater JSON escaping.');
$layout = Layout::render(['config' => ['option_name' => 'theme'], 'sections' => ['general' => ['title' => '<General>', 'has_content' => true, 'fields' => [['id' => 'title', 'title' => 'Title', 'html' => $text]]]], 'hidden_html' => '<input name="nonce" value="trusted">']);
check(strpos($layout, '&lt;General&gt;') !== false && strpos($layout, 'value="trusted"') !== false, 'Layout text and trusted HTML.');
check(strpos($layout, 'class="webilia-') === false && strpos($layout, 'wui-sp-panel') !== false, 'Isolated layout selectors.');
$screen = Screen::render(['demos' => [['key' => 'one', 'import_file_name' => '<Demo>', 'preview_url' => 'javascript:bad()', 'categories' => ['Business']]], 'categories' => ['business' => 'Business'], 'labels' => ['Select The Demo' => 'Choose a demo']]);
check(strpos($screen, '&lt;Demo&gt;') !== false && strpos($screen, 'javascript:') === false, 'Demo text/URL escaping.');
check(strpos($screen, 'Choose a demo') !== false && strpos($screen, 'js-wdi-') === false, 'Translated labels and isolated demo selectors.');
check(strpos(Screen::render([], 'progress-template.php'), 'data-step="customizer"') !== false, 'Progress template.');
check(strpos(Actions::render(), 'wui-button') !== false, 'Existing button primitives.');
check(!function_exists('get_option') && !class_exists('WP_Customize_Control'), 'UI must remain WordPress-independent.');
echo "Theme-tools renderer checks passed.\n";

$binding = 'data-customize-setting-link="theme[enabled]"';
$boundSwitch = Fields::switcher(['name' => 'theme[enabled]', 'id' => 'enabled', 'value' => 1, 'customizer_link_attr' => $binding]);
check(strpos($boundSwitch, $binding) !== false && strpos($boundSwitch, 'type="hidden"') === false, 'Native Customizer switch binding remains on the checkbox.');
check(strpos(Fields::switcher(['name' => 'enabled', 'id' => 'enabled']), 'type="hidden"') !== false, 'Plain switches retain their unchecked fallback.');
$exportValue = ['title' => 'Starter 雪', 'nested' => ['enabled' => true, 'rows' => [1, 2]]];
$export = Fields::import_export(['name' => 'theme[import_export]', 'id' => 'tools', 'value' => $exportValue]);
preg_match('/<textarea[^>]*id="tools_export"[^>]*>(.*?)<\/textarea>/s', $export, $match);
check(json_decode(html_entity_decode($match[1], ENT_QUOTES, 'UTF-8'), true) === $exportValue, 'Array exports are structured JSON, including nested values.');
$introText = '<script>alert("intro")</script><strong>Intro</strong>';
$intro = Layout::render(['config' => ['option_name' => 'theme', 'panel_intro' => $introText]]);
check(strpos($intro, '<script>') === false && strpos($intro, '&lt;script&gt;') !== false, 'Panel intro is escaped text.');
$intro = Layout::render(['config' => ['option_name' => 'theme'], 'panel_intro_html' => '<strong>Trusted intro</strong>']);
check(strpos($intro, '<strong>Trusted intro</strong>') !== false, 'Explicit panel-intro HTML remains available to adapters.');
$nested = Layout::render(['config' => ['option_name' => 'theme'], 'sections' => ['parent' => ['title' => 'Parent', 'has_content' => false], 'child' => ['title' => 'Child', 'parent_id' => 'parent', 'has_content' => true]], 'labels' => ['Toggle %s submenu' => 'Open %s children']]);
check(strpos($nested, 'aria-label="Open Parent children"') !== false && strpos($nested, 'aria-expanded="false"') !== false, 'Submenu toggle has a translated accessible name and expanded state.');
echo "Round-one renderer regression checks passed.\n";
