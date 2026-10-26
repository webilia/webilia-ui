<?php
namespace Webilia\UI\DemoImport;
use Webilia\UI\Support\Presentation as P;



/** @var array $demos */
/** @var array $plugins_by_demo */
$demos = $props['demos'] ?? [];
?>
<div class="wui-di-wrap wui-di-settings-wrap wui-di wui js-wui-di-page"
    data-ajax-url="<?php echo P::url(($props['ajax_url'] ?? '')); ?>"
    data-ajax-nonce="<?php echo P::escape(($props['ajax_nonce'] ?? '')); ?>"
    data-plugins-by-demo="<?php echo P::escape(json_encode($props['plugins_by_demo'] ?? [])); ?>"
    data-visit-url="<?php echo P::url(($props['visit_url'] ?? '')); ?>"
    data-guide-url="<?php echo P::url(($props['guide_url'] ?? '')); ?>"
    data-page-state="select">

    <?php echo ($props['page_header_html'] ?? ''); ?>

    <div class="wui-di__panel-header wui-di-admin-main-wrapper">
        <?php if (($props['page_title_html'] ?? '') !== ''): ?>
            <div class="wui-di__panel-title"><?php echo ($props['page_title_html'] ?? ''); ?></div>
        <?php endif; ?>

        <?php if (($props['page_intro_html'] ?? '') !== ''): ?>
            <div class="wui-di__panel-intro"><?php echo ($props['page_intro_html'] ?? ''); ?></div>
        <?php endif; ?>
    </div>

    <div class="wui-di-admin-main-wrapper">
        <?php if (($props['page_notice'] ?? '') !== ''): ?>
            <div class="wui-di__demo-import-notice">
                <p><?php echo P::escape(($props['page_notice'] ?? '')); ?></p>
            </div>
        <?php endif; ?>

        <div class="wui-di-settings-panel wui-di__settings-panel">
            <div class="wui-di-nav-wrapper wui-di__timeline-nav">
                <ul class="wui-di-nav-tab-wrapper">
                    <li class="wui-di__timeline-item is-active" data-step="select">
                        <a href="#select" class="wui-di-nav-tab js-wui-di-step-nav">
                            <i class="wui-icon wui-icon--menu-square-selected wui-di-m-0"></i>
                            <?php print($translate('Select The Demo')); ?>
                        </a>
                    </li>
                    <li class="wui-di__timeline-item is-disabled" data-step="setup">
                        <a href="#setup" class="wui-di-nav-tab js-wui-di-step-nav">
                            <i class="wui-icon wui-icon--toggle-on wui-di-m-0"></i>
                            <?php print($translate('Import Setup')); ?>
                        </a>
                    </li>
                    <li class="wui-di__timeline-item is-disabled" data-step="plugins">
                        <a href="#plugins" class="wui-di-nav-tab js-wui-di-step-nav">
                            <i class="wui-icon wui-icon--plug wui-di-m-0"></i>
                            <?php print($translate('Plugin Install')); ?>
                        </a>
                    </li>
                    <li class="wui-di__timeline-item is-disabled" data-step="content">
                        <a href="#content" class="wui-di-nav-tab js-wui-di-step-nav">
                            <i class="wui-icon wui-icon--file-download wui-di-m-0"></i>
                            <?php print($translate('Content Import')); ?>
                        </a>
                    </li>
                    <li class="wui-di__timeline-item is-disabled" data-step="done">
                        <a href="#done" class="wui-di-nav-tab js-wui-di-step-nav">
                            <i class="wui-icon wui-icon--checkmark-circle wui-di-m-0"></i>
                            <?php print($translate('Done')); ?>
                        </a>
                    </li>
                </ul>
            </div>

            <div class="wui-di-demo-importer-wrap wui-di__content">
                <template class="js-wui-di-setup-plugin-item-template">
                    <?php include __DIR__ . '/setup-plugin-item-template.php'; ?>
                </template>

                <template class="js-wui-di-setup-plugins-empty-template">
                    <?php include __DIR__ . '/setup-plugins-empty.php'; ?>
                </template>

                <section class="wui-di__step-panel is-active js-wui-di-step-panel" data-step="select">
                    <?php if (!$demos): ?>
                        <div class="wui-di__demo-import-notice">
                            <p><?php print($translate('There are no predefined demo imports for currently active theme!')); ?></p>
                        </div>
                    <?php else: ?>
                        <?php $all_demo_categories = ($props['categories'] ?? []); ?>
                        <div class="wui-di__gl-heading wui-di-admin-section-heading">
                            <h3 class="wui-di__gl-heading-title wui-di-admin-title"><?php print($translate('Select The Demo')); ?></h3>
                            <p class="wui-di__gl-heading-text wui-di-admin-description"><?php print($translate('Filter the collections, preview the design, then launch the import with the plugins it needs.')); ?></p>
                        </div>

                        <div class="wui-di__gl-item-wrapper wui-di-settings-group-wrapper">
                            <div class="wui-di-settings-fields-wrapper">
                                <div class="wui-di__gl-header-top">
                                    <nav class="wui-di__gl-navigation">
                                        <ul class="wui-di-level-5-menu wui-di-sub-tabs wui-di-flex wui-di-gap-3 wui-di-mb-0">
                                            <li class="wui-di-sub-tabs-active">
                                                <a href="#all" class="wui-di__gl-navigation-link js-wui-sp-demo-nav-link">
                                                    <?php print($translate('All Demos')); ?>
                                                </a>
                                            </li>
                                            <?php foreach ($all_demo_categories as $key => $label): ?>
                                                <li>
                                                    <a href="#<?php echo P::escape($key); ?>" class="wui-di__gl-navigation-link js-wui-sp-demo-nav-link">
                                                        <?php echo P::escape($label); ?>
                                                    </a>
                                                </li>
                                            <?php endforeach; ?>
                                        </ul>
                                    </nav>

                                    <div class="wui-di__gl-search">
                                        <input type="search" class="wui-di__gl-search-input wui-di-admin-input js-wui-sp-demo-search" value="" placeholder="<?php print($translate('Search')); ?>" aria-label="<?php print($translate('Search')); ?>" autofocus>
                                        <i class="wui-icon wui-icon--search-magnifier wui-di__gl-search-icon"></i>
                                    </div>
                                </div>

                                <div class="wui-di__gl-item-container js-wui-sp-demo-container">
                                    <?php foreach ($demos as $demo_index => $demo): ?>
                                        <?php
                                        if (!is_array($demo)) continue;

                                        $key = isset($demo['key']) ? (string) $demo['key'] : '';
                                        $name = isset($demo['import_file_name']) ? (string) $demo['import_file_name'] : '';
                                        if ($name === '') $name = $translate('Untitled Demo');
                                        $name_lc = strtolower($name);

                                        $preview = isset($demo['import_preview_image_url']) ? (string) $demo['import_preview_image_url'] : '';
                                        $preview_url = isset($demo['preview_url']) ? (string) $demo['preview_url'] : '';

                                        $demo_categories = [];
                                        if (!empty($demo['categories']) && is_array($demo['categories']))
                                        {
                                            foreach ($demo['categories'] as $category)
                                            {
                                                $label = is_scalar($category) ? (string) $category : '';
                                                if ($label === '') continue;
                                                $demo_categories[] = P::key($label);
                                            }
                                        }

                                        $demo_categories_attr = implode(',', $demo_categories);
                                        $demo_category_labels = [];
                                        foreach ($demo_categories as $demo_category)
                                        {
                                            if (!isset($all_demo_categories[$demo_category])) continue;
                                            $demo_category_labels[] = (string) $all_demo_categories[$demo_category];
                                        }
                                        ?>
                                        <div class="wui-di__gl-item js-wui-sp-demo-item" tabindex="0" data-categories="<?php echo P::escape($demo_categories_attr); ?>" data-name="<?php echo P::escape($name_lc); ?>">
                                            <div class="wui-di__gl-item-image-container">
                                                <?php if ($preview !== ''): ?>
                                                    <img class="wui-di__gl-item-image" src="<?php echo P::url($preview); ?>" alt="<?php echo P::escape($name); ?>">
                                                <?php else: ?>
                                                    <div class="wui-di__gl-item-image wui-di__gl-item-image--no-image"><?php print($translate('No preview image.')); ?></div>
                                                <?php endif; ?>

                                                <div class="wui-di__gl-item-buttons">
                                                    <form method="post" action="<?php echo P::url(($props['post_url'] ?? '')); ?>" class="js-wui-di-import-form" data-selected="<?php echo P::escape((string) $demo_index); ?>" data-demo-name="<?php echo P::escape($name); ?>" data-demo-image="<?php echo P::escape($preview); ?>" data-demo-categories="<?php echo P::escape(json_encode($demo_category_labels)); ?>">
                                                        <?php echo $props['nonce_html'] ?? ''; ?>
                                                        <input type="hidden" name="action" value="<?php echo P::escape($props['post_action'] ?? 'start_import'); ?>">
                                                        <input type="hidden" name="demo_key" value="<?php echo P::escape($key); ?>">
                                                        <input type="hidden" name="return_url" value="<?php echo P::url(($props['current_page_url'] ?? '')); ?>">
                                                        <button type="submit" class="wui-button wui-di-primary-button js-wui-di-import-button"><?php print($translate('Import Demo')); ?></button>
                                                    </form>
                                                    <?php if ($preview_url !== ''): ?>
                                                        <a class="wui-button wui-button--secondary wui-di-secondary-button" href="<?php echo P::url($preview_url); ?>" target="_blank" rel="noopener noreferrer"><?php print($translate('Preview')); ?></a>
                                                    <?php endif; ?>
                                                </div>
                                            </div>

                                            <div class="wui-di__gl-item-footer">
                                                <div class="wui-di__gl-item-meta">
                                                    <h4 class="wui-di__gl-item-title"><?php echo P::escape($name); ?></h4>
                                                    <?php if ($demo_categories): ?>
                                                        <div class="wui-di__gl-item-tags">
                                                            <?php foreach ($demo_categories as $demo_category): ?>
                                                                <?php if (isset($all_demo_categories[$demo_category])): ?>
                                                                    <span class="wui-di__gl-item-tag"><?php echo P::escape($all_demo_categories[$demo_category]); ?></span>
                                                                <?php endif; ?>
                                                            <?php endforeach; ?>
                                                        </div>
                                                    <?php endif; ?>
                                                </div>

                                            </div>
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                        </div>
                        <div class="wui-di-spacer-10"></div>
                    <?php endif; ?>
                </section>

                <section class="wui-di__step-panel js-wui-di-step-panel" data-step="setup">
                    <div class="wui-di__gl-heading wui-di-admin-section-heading">
                        <h3 class="wui-di__gl-heading-title wui-di-admin-title"><?php print($translate('Import Progress')); ?></h3>
                    </div>

                    <div class="wui-di-settings-group-wrapper">
                        <div class="wui-di-settings-fields-wrapper">
                            <div class="wui-di-admin-section-heading">
                                <h3 class="wui-di__stage-title wui-di-admin-title"><?php print($translate('Prepare your starter site')); ?></h3>
                                <p class="wui-di__stage-text wui-di-admin-description"><?php print($translate('Select which plugins should be installed before importing this demo.')); ?></p>
                            </div>
                            <div class="wui-di__stage-card">
                                <div class="wui-di__stage-copy">
                                    <div class="wui-di__setup-plugins js-wui-di-setup-plugins"></div>
                                </div>

                                <div class="wui-di__stage-aside js-wui-di-setup-preview-wrap">
                                    <div class="wui-di__setup-preview-frame">
                                        <img class="wui-di__setup-preview-image js-wui-di-setup-preview-image" src="" alt="<?php print($translate('Demo preview')); ?>">
                                    </div>
                                    <div class="wui-di__setup-name-category">
                                        <div class="wui-di__setup-name">
                                            <div class=""><?php echo $translate('Selected Demo'); ?></div>
                                            <h4 class="wui-di__setup-preview-title js-wui-di-setup-demo-name"></h4>
                                        </div>
                                        <div class="wui-di__gl-item-tags js-wui-di-setup-demo-categories"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="wui-di-spacer-10"></div>
                    <div class="wui-di__footer-actions wui-di-settings-submit-wrapper">
                        <button type="button" class="wui-button wui-button--tertiary wui-di-text-button js-wui-di-setup-back"><?php print($translate('Back to Demos')); ?></button>
                        <button type="button" class="wui-button wui-di-primary-button js-wui-di-setup-continue"><?php print($translate('Continue')); ?></button>
                    </div>
                </section>

                <section class="wui-di__step-panel js-wui-di-step-panel" data-step="plugins">
                    <div class="wui-di__gl-heading wui-di-admin-section-heading">
                        <h3 class="wui-di__gl-heading-title wui-di-admin-title"><?php print($translate('Import Progress')); ?></h3>
                    </div>

                    <div class="wui-di-settings-group-wrapper">
                        <div class="wui-di-settings-fields-wrapper">
                            <div class="wui-di__stage-card wui-di__stage-card--single">
                                <div class="wui-di__stage-copy">
                                    <div class="wui-di__stage-status-row wui-di-admin-section-heading">
                                        <h2 class="wui-di__stage-title"><?php print($translate('Importing Plugins')); ?></h2>
                                        <p class="wui-di__stage-text wui-di-admin-description-tiny"><?php print($translate('Required and selected plugins are installed and activated here before content import begins.')); ?></p>
                                    </div>
                                    <ol class="wui-di__stage-log js-wui-di-plugin-log"></ol>
                                </div>
                            </div>

                            <div class="wui-di__footer-actions">
                                <button type="button" class="wui-button wui-button--secondary wui-di-secondary-button js-wui-di-plugin-restart" style="display:none;"><?php print($translate('Start Again')); ?></button>
                            </div>
                        </div>
                    </div>
                    <div class="wui-di-spacer-10"></div>
                </section>

                <section class="wui-di__step-panel js-wui-di-step-panel" data-step="content">
                    <div class="wui-di__gl-heading wui-di-admin-section-heading">
                        <h3 class="wui-di__gl-heading-title wui-di-admin-title"><?php print($translate('Import Progress')); ?></h3>
                    </div>

                    <div class="wui-di-settings-group-wrapper">
                        <div class="wui-di-settings-fields-wrapper">
                            <div class="wui-di__stage-card wui-di__stage-card--single">
                                <div class="wui-di__stage-copy">
                                    <div class="wui-di__stage-status-row wui-di-admin-section-heading">
                                        <h2 class="wui-di__stage-title"><?php print($translate('Importing Content')); ?></h2>
                                        <p class="wui-di__stage-text js-wui-di-content-stage-label wui-di-admin-description"><?php print($translate('The Content of the Demo is importing')); ?></p>
                                    </div>
                                    <ol class="wui-di__stage-log js-wui-di-content-log"></ol>
                                </div>
                            </div>

                            <div class="wui-di__footer-actions">
                                <button type="button" class="wui-button wui-button--secondary wui-di-secondary-button js-wui-di-content-restart" style="display:none;"><?php print($translate('Start Again')); ?></button>
                            </div>
                        </div>
                    </div>
                    <div class="wui-di-spacer-10"></div>
                </section>

                <section class="wui-di__step-panel js-wui-di-step-panel" data-step="done">
                    <div class="wui-di__gl-heading wui-di-admin-section-heading">
                        <h3 class="wui-di__gl-heading-title wui-di-admin-title"><?php print($translate('Import Completed')); ?></h3>
                    </div>
                    <div class="wui-di-settings-group-wrapper">
                        <div class="wui-di-settings-fields-wrapper wui-di__stage-complete">
                            <div class="wui-di__stage-card wui-di__stage-card--single">
                                <div class="wui-di__stage-copy">
                                    <div class="wui-di__done-icon">
                                        <i class="wui-icon wui-icon--checkmark-circle wui-di-m-0" aria-hidden="true"></i>
                                    </div>
                                    <h2 class="wui-di__stage-title js-wui-di-done-title">
                                        <?php print($translate('The')); ?>
                                        <span class="wui-di__done-demo-name js-wui-di-done-demo-name"></span>
                                        <?php print($translate('Demo Imported Successfully')); ?>
                                    </h2>
                                    <div class="wui-di__done-message js-wui-di-done-message">
                                        <p><?php print($translate('You can start exploring the site and customizing it. We have a useful blog post for you that helps you start better:')); ?></p>
                                    </div>
                                </div>
                            </div>

                            <div class="wui-di__footer-actions">
                                <a class="wui-button wui-di-primary-button js-wui-di-guide-link" href="<?php echo P::url(($props['guide_url'] ?? '') ?: ($props['visit_url'] ?? '')); ?>" target="_blank" rel="noopener noreferrer"><?php print($translate('Demo Guide Article')); ?></a>
                                <a class="wui-button wui-button--tertiary wui-di-text-button js-wui-di-visit-site" href="<?php echo P::url(($props['visit_url'] ?? '')); ?>" target="_blank" rel="noopener noreferrer"><?php print($translate('Visit Site')); ?></a>
                            </div>
                        </div>
                    </div>
                    <div class="wui-di-spacer-10"></div>
                </section>
            </div>
        </div>
    </div>
</div>
