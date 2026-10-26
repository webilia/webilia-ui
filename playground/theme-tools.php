<?php
spl_autoload_register(static function ($class) {
    $prefix = 'Webilia\\UI\\';
    if (strpos($class, $prefix) !== 0) return;
    $file = dirname(__DIR__) . '/src/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
    if (is_file($file)) require $file;
});
use Webilia\UI\SettingsPanel\Fields;
use Webilia\UI\SettingsPanel\Layout;
use Webilia\UI\DemoImport\Screen;
use Webilia\UI\Html;
$rtl = isset($_GET['rtl']);
$fields = [
    ['id' => 'enabled', 'title' => 'Enabled', 'html' => '<div class="wui-sp-field" data-field-id="enabled">' . Fields::switcher(['name' => 'theme[enabled]', 'id' => 'enabled', 'value' => 1]) . '</div>'],
    ['id' => 'title', 'title' => 'Title', 'html' => '<div class="wui-sp-field" data-field-id="title" data-required="' . Html::escape(json_encode(['enabled', '=', 1])) . '">' . Fields::text(['name' => 'theme[title]', 'id' => 'title', 'value' => 'Starter site']) . '</div>'],
    ['id' => 'rows', 'title' => 'Repeater', 'html' => Fields::repeater(['name' => 'theme[rows]', 'id' => 'rows', 'fields' => ['title' => 'Title'], 'value' => [['title' => 'First']]])],
    ['id' => 'font', 'title' => 'Typography', 'html' => Fields::typography(['name' => 'theme[font]', 'id' => 'font', 'fonts' => ['Poppins' => 'Poppins'], 'value' => ['font-family' => 'Poppins']])],
];
?>
<!doctype html>
<html lang="en" dir="<?php echo $rtl ? 'rtl' : 'ltr'; ?>">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shared theme tools</title>
<?php foreach (['tokens', 'buttons', 'forms', 'surfaces', 'icons', 'modal', 'toast', 'settings-panel', 'demo-import'] as $style): ?>
<link rel="stylesheet" href="../dist/css/<?php echo $style; ?>.css">
<?php endforeach; ?>
<style>body{margin:24px;font-family:Arial,sans-serif}h1{font-size:24px} .legacy-fixture{padding:8px;border:1px solid #ddd}</style>
</head><body>
<div class="legacy-fixture"><div class="webilia-panel"><input id="legacy" value="legacy"></div><div class="js-wdi-page">Legacy importer</div></div>
<?php
echo Layout::render(['config' => ['option_name' => 'theme'], 'header_html' => '<h1>Theme settings</h1>', 'sections' => ['general' => ['title' => 'General', 'has_content' => true, 'fields' => $fields], 'advanced' => ['title' => 'Advanced', 'has_content' => true, 'fields' => [['id' => 'import_export', 'title' => 'Import/export', 'html' => Fields::import_export(['name' => 'theme[import_export]', 'id' => 'import_export', 'value' => ['title' => 'Starter site']])]]]]]);
echo Screen::render(['demos' => [['key' => 'business', 'import_file_name' => 'Business Demo', 'categories' => ['Business']], ['key' => 'creative', 'import_file_name' => 'Creative Demo', 'categories' => ['Creative']]], 'categories' => ['business' => 'Business', 'creative' => 'Creative'], 'ajax_url' => '/mock', 'ajax_nonce' => 'fixture', 'visit_url' => '#site', 'guide_url' => '#guide', 'plugins_by_demo' => [[], []], 'page_title_html' => '<h1>Demo importer</h1>']);
?>
<script src="../node_modules/jquery/dist/jquery.js"></script>
<script src="../dist/js/modal.js"></script><script src="../dist/js/toast.js"></script>
<script src="../dist/js/settings-panel.js"></script><script src="../dist/js/demo-import.js"></script>
<script>
window.matchMedia = window.matchMedia || (() => ({matches:false}));
WebiliaUI.settingsPanel.create({labels:{invalidJson:'Invalid JSON',closeLabel:'Close'}}).app.init();
const demoRoot = document.querySelector('.js-wui-di-page');
const demoOptions = {
    jquery: jQuery,
    labels: {done_title:'Import Complete',done_text:'Ready',error_import_failed:'Import failed',stage_importing_content:'Importing content',log_no_plugins_required:'No plugins required',status_active:'Active'},
    request(config) {
        const deferred = jQuery.Deferred();
        demoRoot.dataset.requests = String(Number(demoRoot.dataset.requests || 0) + 1);
        setTimeout(() => {
            if (demoRoot.dataset.fail) deferred.resolve({error:'Fixture import failure'});
            else if(config.data.action === 'import_demo_data') deferred.resolve({status:'customizerAJAX'});
            else if(config.data.action === 'import_customizer_data') deferred.resolve({status:'afterAllImportAJAX'});
            else deferred.resolve({title:'Import Complete',message:'Ready'});
        }, 0);
        return deferred.promise();
    }
};
WebiliaUI.demoImport.init(demoRoot,demoOptions);
WebiliaUI.demoImport.init(demoRoot,demoOptions);
</script></body></html>
