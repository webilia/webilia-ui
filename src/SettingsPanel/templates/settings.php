<?php
namespace Webilia\UI\SettingsPanel;
use Webilia\UI\Support\Presentation as P;

$sections = $props['sections'] ?? [];
$config = $props['config'] ?? [];
$labels = $props['labels'] ?? [];
$translate = static function ($text) use ($labels) { return P::escape($labels[$text] ?? $text); };
$menu_slug = $props['menu_slug'] ?? '';
$nonce = $props['nonce'] ?? '';
$panel_title = $props['panel_title'] ?? '';
$version = $props['version'] ?? '';
$icon_html = $props['icon_html'] ?? '';
$panel_attrs = $props['panel_attrs'] ?? 'class="wui wui-sp-panel"';
$is_customizer = !empty($props['is_customizer']);

$form_tag = $is_customizer ? 'div' : 'form';
$form_attrs = 'class="wui-sp-panel-form" data-wui-sp-opt-name="' . P::escape(($config['option_name'] ?? '')) . '" data-wui-sp-nonce="' . P::escape($nonce) . '"';
if (!$is_customizer) $form_attrs = 'method="post" action="' . P::url($props['post_url'] ?? '') . '" ' . $form_attrs;
?>
<div <?php echo $panel_attrs; ?>>
    <?php echo ($props['header_html'] ?? ''); ?>

    <div class="wui-sp-panel-header">
        <?php if (!empty(($config['dev_mode'] ?? false))) : ?>
            <div class="wui-sp-dev-mode"><?php echo $translate('Developer Mode Enabled'); ?></div>
        <?php endif; ?>

        <?php if (!empty($config['panel_intro']) || !empty($props['panel_intro_html'])) : ?>
            <p class="wui-sp-panel-intro"><?php echo $props['panel_intro_html'] ?? P::escape($config['panel_intro'] ?? ''); ?></p>
        <?php endif; ?>
    </div>
    <div class="wui-sp-admin-main-wrapper">
        <div class="wui-sp-panel-body">

            <?php if ($sections) : ?>
                <?php $tree = []; ?>
                <?php foreach ($sections as $id => $section) : ?>
                    <?php
                    $parent_id = $section['parent_id'] ?? '';
                    if ($parent_id)
                    {
                        if (!isset($tree[$parent_id])) $tree[$parent_id] = ['children' => []];
                        $tree[$parent_id]['children'][$id] = $section;
                    }
                    else
                    {
                        if (!isset($tree[$id])) $tree[$id] = ['children' => []];
                        $tree[$id] = array_merge($tree[$id], $section);
                    }
                    ?>
                <?php endforeach; ?>

                <nav class="wui-sp-panel-nav wui-sp-nav-wrapper">
                    <ul class="wui-sp-panel-nav-list wui-sp-nav-tab-wrapper">
                        <?php foreach ($tree as $id => $node) : ?>
                            <?php
                            $label = $node['title'] ?? ucfirst($id);
                            $has_children = !empty($node['children']);
                            $icon = $node['icon'] ?? '';
                            $has_content = !empty($node['has_content']);
                            ?>
                            <li class="wui-sp-nav-item wui-sp-nav-tab" data-section="<?php echo P::escape($id); ?>" data-has-content="<?php echo $has_content ? '1' : '0'; ?>">
                                <div class="wui-sp-nav-row">
                                    <a class="wui-sp-nav-link wui-sp-nav-link" href="#wui-sp-section-<?php echo P::escape($id); ?>">
                                    <span class="wui-sp-nav-text">
                                        <?php if ($icon !== '') : ?>
                                            <?php if (filter_var($icon, FILTER_VALIDATE_URL)) : ?>
                                                <img class="wui-sp-nav-icon-img" src="<?php echo P::url($icon); ?>" alt="">
                                            <?php else : ?>
                                                <i class="wui-sp-nav-icon <?php echo P::escape(strpos($icon, 'wui-icon--') !== false ? 'wui-icon ' . $icon : $icon); ?>" aria-hidden="true"></i>
                                            <?php endif; ?>
                                        <?php endif; ?>
                                        <span class="wui-sp-nav-label"><?php echo P::escape($label); ?></span>
                                    </span>
                                        <?php if ($has_children) : ?>
                                            <button type="button" class="wui-sp-nav-toggle" aria-label="<?php echo P::escape(sprintf($labels['Toggle %s submenu'] ?? 'Toggle %s submenu', $label)); ?>" aria-expanded="false" aria-controls="wui-sp-subnav-<?php echo P::escape($id); ?>">
                                                <i class="fa fa-plus" aria-hidden="true"></i>
                                                <i class="fa fa-minus" aria-hidden="true"></i>
                                            </button>
                                        <?php endif; ?>
                                    </a>
                                </div>

                                <?php if ($has_children) : ?>
                                    <ul class="wui-sp-subnav wui-sp-nav-sub-tabs" id="wui-sp-subnav-<?php echo P::escape($id); ?>">
                                        <?php foreach ($node['children'] as $child_id => $child) : ?>
                                            <?php
                                            $child_label = $child['title'] ?? ucfirst($child_id);
                                            $child_icon = $child['icon'] ?? '';
                                            $child_has_content = !empty($child['has_content']);
                                            ?>
                                            <li class="wui-sp-subnav-item wui-sp-nav-tab" data-section="<?php echo P::escape($child_id); ?>" data-has-content="<?php echo $child_has_content ? '1' : '0'; ?>">
                                                <a class="wui-sp-nav-link wui-sp-nav-link" href="#wui-sp-section-<?php echo P::escape($child_id); ?>">
                                                <span class="wui-sp-nav-text">
                                                    <?php if ($child_icon !== '') : ?>
                                                        <?php if (filter_var($child_icon, FILTER_VALIDATE_URL)) : ?>
                                                            <img class="wui-sp-nav-icon-img" src="<?php echo P::url($child_icon); ?>" alt="">
                                                        <?php else : ?>
                                                            <i class="wui-sp-nav-icon <?php echo P::escape(strpos($child_icon, 'wui-icon--') !== false ? 'wui-icon ' . $child_icon : $child_icon); ?>" aria-hidden="true"></i>
                                                        <?php endif; ?>
                                                    <?php endif; ?>
                                                    <span class="wui-sp-nav-label"><?php echo P::escape($child_label); ?></span>
                                                </span>
                                                </a>
                                            </li>
                                        <?php endforeach; ?>
                                    </ul>
                                <?php endif; ?>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                </nav>
            <?php endif; ?>

            <div class="wui-sp-panel-content">
                <?php echo '<' . $form_tag . ' ' . $form_attrs . '>'; ?>
                <?php echo $props['hidden_html'] ?? ''; ?>
                <div class="wui-sp-sections-actions">
                    <?php echo ($props['actions_top_html'] ?? Actions::render(['labels' => $labels])); ?>

                    <div class="wui-sp-sections">
                        <?php if ($sections) : ?>
                            <?php foreach ($sections as $id => $section) : ?>
                                <?php $has_content = !empty($section['has_content']); ?>
                                <section class="wui-sp-panel-section" id="wui-sp-section-<?php echo P::escape($id); ?>" data-section="<?php echo P::escape($id); ?>" data-section-title="<?php echo P::escape($section['title'] ?? ''); ?>" data-has-content="<?php echo $has_content ? '1' : '0'; ?>">
                                    <?php echo $section['description_html'] ?? ''; ?>
                                    <?php $fields = ($section['fields'] ?? []); ?>

                                    <div class="wui-sp-panel-fields">
                                        <?php
                                        $field_groups = [];
                                        $current_group_key = 'default';

                                        foreach ($fields as $field)
                                        {
                                            $field_args = $field['args'] ?? [];
                                            $field_type = strtolower(trim((string) ($field_args['type'] ?? '')));

                                            if ($field_type === 'section')
                                            {
                                                $current_group_key = P::key((string) ($field['id'] ?? 'group-' . count($field_groups)));
                                                $field_groups[$current_group_key] = [
                                                    'id' => $current_group_key,
                                                    'title' => $field['title'] ?? '',
                                                    'marker' => $field,
                                                    'fields' => [],
                                                ];
                                                continue;
                                            }

                                            if (!isset($field_groups[$current_group_key]))
                                            {
                                                $field_groups[$current_group_key] = [
                                                    'id' => $current_group_key,
                                                    'title' => '',
                                                    'marker' => null,
                                                    'fields' => [],
                                                ];
                                            }

                                            $field_groups[$current_group_key]['fields'][] = $field;
                                        }

                                        $visible_groups = array_values(array_filter($field_groups, function ($group)
                                        {
                                            return !empty($group['fields']) || !empty($group['marker']);
                                        }));

                                        $has_level_3_menu = count($visible_groups) > 1;
                                        $level_3_class = 'wui-sp-level-3-content-' . P::className($id);

                                        if ($has_level_3_menu) :?>
                                            <ul class="wui-sp-tab-switcher wui-sp-level-3-menu wui-sp-sub-tabs wui-sp-flex wui-sp-mb-4" data-for=".<?php echo P::escape($level_3_class); ?>">
                                                <?php foreach ($visible_groups as $index => $group) : ?>
                                                    <li data-tab="wui-sp-level-3-<?php echo P::escape($id . '-' . $group['id']); ?>" class="<?php echo $index === 0 ? 'wui-sp-sub-tabs-active' : ''; ?>">
                                                        <a href="#"><?php echo P::escape($group['title'] ?: ucfirst(str_replace('-', ' ', $group['id']))); ?></a>
                                                    </li>
                                                <?php endforeach; ?>
                                            </ul>
                                        <?php endif; ?>

                                        <?php foreach ($visible_groups as $index => $group) : ?>
                                            <?php $group_wrapper_classes = $has_level_3_menu ? 'wui-sp-tab-switcher-content ' . $level_3_class . ($index === 0 ? ' wui-sp-tab-switcher-content-active' : '') : ''; ?>
                                            <?php
                                            $has_button_preview = false;
                                            foreach (($group['fields'] ?? []) as $group_field)
                                            {
                                                $group_field_args = $group_field['args'] ?? [];
                                                $group_field_type = strtolower(trim((string) ($group_field_args['type'] ?? '')));
                                                if ($group_field_type === 'button_preview')
                                                {
                                                    $has_button_preview = true;
                                                    break;
                                                }
                                            }
                                            ?>
                                            <div<?php echo $has_level_3_menu ? ' class="' . P::escape($group_wrapper_classes) . '" id="wui-sp-tab-switcher-wui-sp-level-3-' . P::escape($id . '-' . $group['id']) . '-content"' : ''; ?>>
                                                <div class="wui-sp-setting-section">
                                                    <?php if ($has_button_preview) : ?>
                                                        <aside class="wui-sp-setting-section-aside"></aside>
                                                    <?php endif; ?>
                                                    <div class="wui-sp-setting-section-content">
                                                        <?php if (!empty($group['marker'])) : ?>
                                                            <?php
                                                            $marker = $group['marker'];
                                                            $marker_args = $marker['args'] ?? [];
                                                            $marker_type = strtolower(trim((string) ($marker_args['type'] ?? '')));
                                                            $marker_id = P::key((string) ($marker['id'] ?? ''));
                                                            $marker_title = in_array($marker_type, ['info', 'divide', 'raw', 'content', 'section'], true) ? '' : ($marker['title'] ?? '');
                                                            $marker_row_classes = 'wui-sp-panel-field-row is-section-row wui-sp-section-type';
                                                            if ($marker_title === '') $marker_row_classes .= ' is-full-row';
                                                            ?>
                                                            <div class="<?php echo P::escape($marker_row_classes); ?>" style="display: none;">
                                                                <?php if ($marker_title !== '') : ?>
                                                                    <div class="wui-sp-panel-field-label">
                                                                        <label for="<?php echo P::escape($marker_id); ?>"><?php echo P::escape($marker_title); ?></label>
                                                                    </div>
                                                                <?php endif; ?>

                                                                <div class="wui-sp-panel-field-control">
                                                                    <?php echo $marker['html'] ?? ''; ?>
                                                                </div>
                                                            </div>
                                                        <?php endif; ?>
                                                        <?php foreach ($group['fields'] as $field) : ?>
                                                            <?php
                                                            $field_args = $field['args'] ?? [];
                                                            $field_type = strtolower(trim((string) ($field_args['type'] ?? '')));
                                                            $field_id = P::key((string) ($field['id'] ?? ''));
                                                            $field_title = in_array($field_type, ['info', 'divide', 'raw', 'content'], true) ? '' : ($field['title'] ?? '');

                                                            $row_classes = 'wui-sp-panel-field-row';
                                                            if ($field_title === '') $row_classes .= ' is-full-row';
                                                            ?>
                                                            <div class="<?php echo P::escape($row_classes); ?>">
                                                                <?php if ($field_title !== '') : ?>
                                                                    <div class="wui-sp-panel-field-label">
                                                                        <label for="<?php echo P::escape($field_id); ?>"><?php echo P::escape($field_title); ?></label>
                                                                    </div>
                                                                <?php endif; ?>

                                                                <div class="wui-sp-panel-field-control">
                                                                    <?php echo $field['html'] ?? ''; ?>
                                                                </div>
                                                            </div>
                                                        <?php endforeach; ?>
                                                    </div>
                                                </div>
                                            </div>
                                        <?php endforeach; ?>
                                    </div>

                                </section>
                            <?php endforeach; ?>
                        <?php else : ?>
                            <?php echo $props['fallback_html'] ?? ''; ?>
                        <?php endif; ?>
                    </div>
                </div>
                <?php echo ($props['actions_bottom_html'] ?? Actions::render(['bottom' => true, 'labels' => $labels])); ?>
                <?php echo '</' . $form_tag . '>'; ?>
            </div>
        </div>
    </div>
</div>
