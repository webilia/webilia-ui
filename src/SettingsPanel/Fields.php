<?php
namespace Webilia\UI\SettingsPanel;

use Webilia\UI\Support\Presentation as P;

class Fields
{
    const REQ_HTML = '<span class="wui-sp-required">*</span>';

    protected static function normalize_args(array $args): array
    {
        if (isset($args['option_name'], $args['key']))
        {
            $args['name'] = $args['name'] ?? $args['option_name'] . '[' . $args['key'] . ']';
            $args['id'] = $args['id'] ?? $args['key'];
            if (!array_key_exists('value', $args)) $args['value'] = $args['option'][$args['key']] ?? '';
        }
        return $args;
    }

    protected static function resolve_options(array &$args): array
    {
        return $args['options'] ?? [];
    }

    protected static function attr_string(array $attributes): string
    {
        if (!$attributes) return '';

        $compiled = '';
        foreach ($attributes as $key => $value)
        {
            if (is_array($value)) continue;
            $compiled .= $key . '="' . P::escape($value) . '" ';
        }

        return trim($compiled);
    }

    protected static function customizer_link_attr(array $args): string
    {
        if (empty($args['customizer_link_attr'])) return '';

        return ' ' . trim((string) $args['customizer_link_attr']);
    }

    protected static function wrap_group(string $class, array $rows, string $row_class = 'wui-sp-field-row'): string
    {
        $output = '<div class="' . P::escape($class) . '">';
        foreach ($rows as $row)
        {
            if ($row === '' || $row === null) continue;
            $output .= '<div class="' . P::escape($row_class) . '">' . $row . '</div>';
        }
        $output .= '</div>';

        return $output;
    }

    protected static function wrap_group_with_keys(string $class, array $rows, string $row_class = 'wui-sp-field-row', string $key_prefix = ''): string
    {
        $output = '<div class="' . P::escape($class) . '">';
        foreach ($rows as $key => $row)
        {
            if ($row === '' || $row === null) continue;
            $key_class = $key_prefix ? ' ' . $key_prefix . P::escape($key) : '';
            $output .= '<div class="' . P::escape($row_class) . $key_class . '">' . $row . '</div>';
        }
        $output .= '</div>';

        return $output;
    }

    protected static function label_text($label): string
    {
        if (is_array($label))
        {
            foreach (['label', 'title', 'name', 'alt'] as $key)
            {
                if (isset($label[$key]) && is_scalar($label[$key])) return (string) $label[$key];
            }

            return '';
        }

        return is_scalar($label) ? (string) $label : '';
    }

    protected static function normalize_value($value): string
    {
        if (is_array($value))
        {
            $flat = array_filter($value, 'is_scalar');
            if ($flat) return implode(', ', array_map('strval', $flat));
            return '';
        }

        return is_scalar($value) ? (string) $value : '';
    }

    protected static function is_enabled($value): bool
    {
        if (is_bool($value)) return $value;
        if (is_numeric($value)) return (string) $value === '1';
        if (!is_scalar($value)) return false;

        $normalized = strtolower(trim((string) $value));
        return in_array($normalized, ['1', 'true', 'yes', 'on'], true);
    }

    protected static function is_checked($value, $current): bool
    {
        if (is_array($current))
        {
            if (array_key_exists($value, $current)) return (bool) $current[$value];
            return in_array($value, $current, true);
        }

        return (string) $current === (string) $value || (string) $current === '1';
    }

    public static function label($args = [])
    {
        if (!count($args)) return false;

        $attributes = static::attr_string($args['attributes'] ?? []);

        $required = isset($args['required']) && $args['required'];
        $attributes = trim($attributes);
        $attributes = $attributes ? ' ' . $attributes : '';

        return '<label for="' . (isset($args['for']) ? P::escape($args['for']) : '') . '" class="' . (isset($args['class']) ? P::escape($args['class']) : '') . '"' . $attributes . '>' . P::escape($args['title'] ?? '') . ($required ? ' ' . static::REQ_HTML : '') . '</label>';
    }

    public static function input($args = [], $type = 'text')
    {
        $args = static::normalize_args($args);
        if (!count($args)) return false;

        $attributes = static::attr_string($args['attributes'] ?? []);
        $customizer_link_attr = static::customizer_link_attr($args);

        $required = isset($args['required']) && $args['required'];
        $attributes = $attributes ? ' ' . $attributes : '';
        $value = isset($args['value']) ? static::normalize_value($args['value']) : '';
        return '<input type="' . P::escape($type) . '" name="' . (isset($args['name']) ? P::escape($args['name']) : '') . '" id="' . (isset($args['id']) ? P::escape($args['id']) : '') . '" class="' . (isset($args['class']) ? P::escape($args['class']) : '') . '" value="' . P::escape($value) . '" placeholder="' . (isset($args['placeholder']) ? P::escape($args['placeholder']) : '') . '"' . $attributes . $customizer_link_attr . ' ' . ($required ? 'required' : '') . '>';
    }

    public static function textarea($args = [])
    {
        $args = static::normalize_args($args);
        if (!count($args)) return false;

        $attributes = static::attr_string($args['attributes'] ?? []);
        $customizer_link_attr = static::customizer_link_attr($args);

        $required = isset($args['required']) && $args['required'];
        $attributes = $attributes ? ' ' . $attributes : '';
        $value = isset($args['value']) ? static::normalize_value($args['value']) : '';
        if (empty($args['raw'])) $value = stripslashes($value);
        return '<textarea class="' . (isset($args['class']) ? P::escape($args['class']) : '') .'" name="' . P::escape($args['name']) . '" id="' . (isset($args['id']) ? P::escape($args['id']) : '') . '" placeholder="' . (isset($args['placeholder']) ? P::escape($args['placeholder']) : '') . '" rows="' . (isset($args['rows']) ? P::escape($args['rows']) : '') . '"' . $attributes . $customizer_link_attr . ' ' . ($required ? 'required' : '') . '>' . P::escape($value) . '</textarea>';
    }

    public static function select($args = [])
    {
        $args = static::normalize_args($args);
        if (!count($args)) return false;

        $options = '';
        $args['options'] = static::resolve_options($args);

        if (isset($args['show_empty']) and $args['show_empty'])
        {
            $options .= '<option value="" ' . ((isset($args['value']) and !is_array($args['value']) and $args['value'] == '') ? 'selected="selected"' : '') . '>' . ((isset($args['empty_label']) and trim($args['empty_label'])) ? P::escape($args['empty_label']) : '-----') . '</option>';
        }

        foreach ($args['options'] as $value => $label)
        {
            $selected = (isset($args['value']) and ((!is_array($args['value']) and trim($args['value']) != '' and $args['value'] == $value) or (is_array($args['value']) and in_array($value, $args['value']))));
            $options .= '<option value="' . P::escape($value) . '" ' . ($selected ? 'selected="selected"' : '') . '>' . P::escape(static::label_text($label)) . '</option>';
        }

        $attributes = static::attr_string($args['attributes'] ?? []);
        $customizer_link_attr = static::customizer_link_attr($args);

        $required = isset($args['required']) && $args['required'];
        $multiple = isset($args['multiple']) && $args['multiple'];
        $multiple_attr = $multiple ? ' multiple' : '';
        $attributes = $attributes ? ' ' . $attributes : '';

        $select = '<select name="' . (isset($args['name']) ? P::escape($args['name']) : '') . ($multiple ? '[]' : '') . '" id="' . (isset($args['id']) ? P::escape($args['id']) : '') . '" class="' . (isset($args['class']) ? P::escape($args['class']) : '') . '"' . $attributes . $customizer_link_attr . $multiple_attr . ' ' . ($required ? 'required' : '') . '>'
            . $options .
        '</select>';

        if (!empty($args['webilia_source_label'])) return '<div class="wui-sp-resolved-options">' . $select .'</div>';

        return $select;
    }

    public static function checkbox($args = [])
    {
        $args = static::normalize_args($args);
        if (!count($args)) return false;

        $has_options = !empty($args['options']);
        $has_data = isset($args['data']) && ((is_string($args['data']) && $args['data'] !== '') || (is_array($args['data']) && !empty($args['data'])));
        if ($has_options || $has_data || is_array($args['value'] ?? null))
        {
            return static::checkboxes($args);
        }

        $checked = isset($args['value']) && (string) $args['value'] === '1';
        $customizer_link_attr = static::customizer_link_attr($args);
        return '<label><input type="checkbox" name="' . P::escape($args['name']) . '" id="' . (isset($args['id']) ? P::escape($args['id']) : '') . '" value="1"' . $customizer_link_attr . ' ' . ($checked ? 'checked="checked"' : '') . '> ' . P::escape(static::label_text($args['label'] ?? '')) . '</label>';
    }

    public static function checkboxes($args = [])
    {
        $args = static::normalize_args($args);
        if (!count($args)) return false;

        $args['options'] = static::resolve_options($args);
        $customizer_link_attr = '';

        $checkboxes = '';
        foreach ($args['options'] as $value => $label)
        {
            $checked = static::is_checked($value, $args['value'] ?? []);
            $field_name = $args['name'] . '[' . $value . ']';
            $checkboxes .= '<label class="wui-sp-option"><input name="' . P::escape($field_name) . '" type="checkbox" value="1"' . $customizer_link_attr . ' ' . ($checked ? 'checked="checked"' : '') . '> ' . P::escape(static::label_text($label)) . '</label>';
        }

        $class = trim(($args['class'] ?? '') . ' wui-sp-options wui-sp-field-type-checkboxes');
        $content = '<div class="' . P::escape($class) . '">' . $checkboxes . '</div>';
        if (!empty($args['webilia_source_label'])) return '<div class="wui-sp-resolved-options">' . $content .'</div>';

        return $content;
    }

    public static function radio($args = [])
    {
        $args = static::normalize_args($args);
        if (!count($args)) return false;

        $args['options'] = static::resolve_options($args);
        $customizer_link_attr = static::customizer_link_attr($args);

        $radios = '';
        foreach ($args['options'] as $value => $label)
        {
            $checked = isset($args['value']) && (string) $args['value'] === (string) $value;
            $field_id = P::className((string) ($args['id'] ?? $args['name'] ?? 'wui-sp-radio')) . '-' . P::className((string) $value);
            $radios .= '<input type="radio" id="' . P::escape($field_id) . '" name="' . P::escape($args['name']) . '" value="' . P::escape($value) . '"' . $customizer_link_attr . ' ' . ($checked ? 'checked="checked"' : '') . '>';
            $radios .= '<label for="' . P::escape($field_id) . '">' . P::escape(static::label_text($label)) . '</label>';
        }

        $class = trim(($args['class'] ?? '') . ' wui-sp-radio-toggle wui-sp-field-type-radio');
        $content = '<div class="' . P::escape($class) . '">' . trim($radios) . '</div>';
        if (!empty($args['webilia_source_label'])) return '<div class="wui-sp-resolved-options">' . $content . '</div>';

        return $content;
    }

    public static function switcher($args = [])
    {
        $args = static::normalize_args($args);
        if (!count($args)) return false;

        $customizer_link_attr = static::customizer_link_attr($args);
        $checked = static::is_enabled($args['value'] ?? null);
        $hidden = $customizer_link_attr === ''
            ? '<input type="hidden" name="' . P::escape($args['name']) . '" value="0">'
            : '';
        $checkbox_link_attr = $customizer_link_attr;

        return '<label class="wui-sp-switch">
            ' . $hidden . '
            <input type="checkbox" id="' . P::escape($args['id']) . '" name="' . P::escape($args['name']) . '" value="1"' . $checkbox_link_attr . ' ' . ($checked ? 'checked="checked"' : '') . '>
            <span class="wui-sp-slider"></span>
        </label>';
    }

    public static function editor($args = [])
    {
        return static::textarea($args);
    }

    public static function text($args = []) { return static::input($args, 'text'); }
    public static function password($args = []) { return static::input($args, 'password'); }
    public static function date($args = []) { return static::input($args, 'date'); }
    public static function datetime($args = []) { return static::input($args, 'datetime-local'); }
    public static function spinner($args = []) { return static::input($args, 'number'); }
    public static function slider($args = [])
    {
        $args = static::normalize_args($args);
        if (!count($args)) return false;

        $value = isset($args['value']) ? static::normalize_value($args['value']) : '';
        $input = static::input($args, 'range');
        $output = '<span class="wui-sp-slider-value" data-value="' . P::escape($value) . '">' . P::escape($value) . '</span>';

        return '<div class="wui-sp-slider wui-sp-field-type-slider">' . $input . $output . '</div>';
    }

    public static function color($args = [])
    {
        $args['class'] = trim(($args['class'] ?? '') . ' wui-sp-colorpicker');
        $attributes = $args['attributes'] ?? [];
        if (isset($args['default'])) $attributes['data-default'] = $args['default'];
        $args['attributes'] = $attributes;
        return static::input($args, 'text');
    }

    public static function color_rgba($args = [])
    {
        $args['class'] = trim(($args['class'] ?? '') . ' wui-sp-colorpicker-rgba');
        $attributes = $args['attributes'] ?? [];
        if (isset($args['default'])) $attributes['data-default'] = $args['default'];
        $args['attributes'] = $attributes;
        return static::input($args, 'text');
    }

    public static function color_palette($args = [])
    {
        $args = static::normalize_args($args);
        $palette = $args['palette'] ?? [];
        $value = $args['value'] ?? '';

        $items = '';
        foreach ($palette as $color)
        {
            $active = ($value === $color) ? ' wui-sp-color-box-active' : '';
            $items .= '<button type="button" class="wui-sp-color-box' . $active . '" aria-label="' . P::escape($color) . '" aria-pressed="' . ($value === $color ? 'true' : 'false') . '" data-color="' . P::escape($color) . '" style="background-color: ' . P::escape($color) . '"></button>';
        }

        $input = static::input($args, 'hidden');
        return '<div class="wui-sp-color-palette wui-sp-field-type-color-palette" data-for="' . P::escape($args['id'] ?? '') . '">' . $items . $input . '</div>';
    }

    public static function color_gradient($args = [])
    {
        $args = static::normalize_args($args);
        $value = is_array($args['value'] ?? null) ? $args['value'] : [];
        $customizer_link_attr = '';

        $start = $value['start'] ?? '';
        $end = $value['end'] ?? '';

        $start_field = static::color([
            'name' => $args['name'] . '[start]',
            'id' => ($args['id'] ?? '') . '_start',
            'value' => $start,
            'customizer_link_attr' => $customizer_link_attr,
        ]);

        $end_field = static::color([
            'name' => $args['name'] . '[end]',
            'id' => ($args['id'] ?? '') . '_end',
            'value' => $end,
            'customizer_link_attr' => $customizer_link_attr,
        ]);

        $fields = [
            'start' => $start_field,
            'end' => $end_field,
        ];

        return static::wrap_group_with_keys('wui-sp-field-group wui-sp-color-gradient wui-sp-field-type-color-gradient', $fields, 'wui-sp-field-row', 'wui-sp-color-gradient-');
    }

    public static function color_scheme($args = [])
    {
        return static::select($args);
    }

    public static function link_color($args = [])
    {
        $args = static::normalize_args($args);
        $value = is_array($args['value'] ?? null) ? $args['value'] : [];
        $customizer_link_attr = '';

        $fields = [
            'regular' => static::translate('Regular'),
            'hover' => static::translate('Hover'),
            'active' => static::translate('Active'),
        ];

        $rows = [];
        foreach ($fields as $key => $label)
        {
            $rows[$key] = '<span class="wui-sp-field-label">' . P::escape($label) . '</span>'
                . static::color([
                    'name' => $args['name'] . '[' . $key . ']',
                    'id' => ($args['id'] ?? '') . '_' . $key,
                    'value' => $value[$key] ?? '',
                    'customizer_link_attr' => $customizer_link_attr,
                ]);
        }

        return static::wrap_group_with_keys('wui-sp-field-group wui-sp-link-color wui-sp-field-type-link-color', $rows, 'wui-sp-field-row', 'wui-sp-link-color-');
    }

    public static function background($args = [])
    {
        $args = static::normalize_args($args);
        $value = is_array($args['value'] ?? null) ? $args['value'] : [];
        $customizer_link_attr = $args['customizer_link_attr'] ?? '';

        $fields = [
            'color' => static::color([
                'name' => $args['name'] . '[color]',
                'id' => ($args['id'] ?? '') . '_color',
                'value' => $value['color'] ?? '',
                'customizer_link_attr' => $customizer_link_attr,
            ]),
            'image' => static::media([
                'name' => $args['name'] . '[image]',
                'id' => ($args['id'] ?? '') . '_image',
                'value' => $value['image'] ?? '',
                'customizer_link_attr' => $customizer_link_attr,
            ]),
            'repeat' => static::select([
                'name' => $args['name'] . '[repeat]',
                'id' => ($args['id'] ?? '') . '_repeat',
                'options' => [
                    'no-repeat' => static::translate('No Repeat'),
                    'repeat' => static::translate('Repeat'),
                    'repeat-x' => static::translate('Repeat X'),
                    'repeat-y' => static::translate('Repeat Y'),
                ],
                'value' => $value['repeat'] ?? 'no-repeat',
                'customizer_link_attr' => $customizer_link_attr,
            ]),
            'position' => static::text([
                'name' => $args['name'] . '[position]',
                'id' => ($args['id'] ?? '') . '_position',
                'value' => $value['position'] ?? '',
                'placeholder' => 'center center',
                'customizer_link_attr' => $customizer_link_attr,
            ]),
            'size' => static::text([
                'name' => $args['name'] . '[size]',
                'id' => ($args['id'] ?? '') . '_size',
                'value' => $value['size'] ?? '',
                'placeholder' => 'cover',
                'customizer_link_attr' => $customizer_link_attr,
            ]),
            'attachment' => static::select([
                'name' => $args['name'] . '[attachment]',
                'id' => ($args['id'] ?? '') . '_attachment',
                'options' => [
                    'scroll' => static::translate('Scroll'),
                    'fixed' => static::translate('Fixed'),
                ],
                'value' => $value['attachment'] ?? 'scroll',
                'customizer_link_attr' => $customizer_link_attr,
            ]),
        ];

        return static::wrap_group_with_keys('wui-sp-field-group wui-sp-background wui-sp-field-type-background', $fields, 'wui-sp-field-row', 'wui-sp-background-');
    }

    protected static function normalize_number_value($value): string
    {
        if (!is_scalar($value)) return '';
        $value = trim((string) $value);
        if ($value === '') return '';
        if (preg_match('/-?\d*\.?\d+/', $value, $match)) return $match[0];
        return '';
    }

    public static function border($args = [])
    {
        $args = static::normalize_args($args);
        $value = is_array($args['value'] ?? null) ? $args['value'] : [];
        $customizer_link_attr = '';

        $sides = [
            'top' => static::translate('Top'),
            'right' => static::translate('Right'),
            'bottom' => static::translate('Bottom'),
            'left' => static::translate('Left'),
        ];
        $side_inputs = '';
        foreach ($sides as $side => $label)
        {
            $raw = $value['border-' . $side] ?? '';
            $side_inputs .= '<div class="wui-sp-border-side">'
                . '<span class="wui-sp-border-side-label">' . $label . '</span>'
                . static::input([
                    'name' => $args['name'] . '[border-' . $side . ']',
                    'id' => ($args['id'] ?? '') . '_' . $side,
                    'value' => static::normalize_number_value($raw),
                    'class' => 'wui-sp-border-input',
                    'placeholder' => P::escape($label),
                    'attributes' => ['min' => 0, 'step' => 1],
                    'customizer_link_attr' => $customizer_link_attr,
                ], 'number')
                . '</div>';
        }

        $style = static::select([
            'name' => $args['name'] . '[border-style]',
            'id' => ($args['id'] ?? '') . '_style',
            'options' => [
                'none' => static::translate('None'),
                'solid' => static::translate('Solid'),
                'dashed' => static::translate('Dashed'),
                'dotted' => static::translate('Dotted'),
                'double' => static::translate('Double'),
            ],
            'value' => $value['border-style'] ?? 'none',
            'customizer_link_attr' => $customizer_link_attr,
        ]);

        $color = static::color([
            'name' => $args['name'] . '[border-color]',
            'id' => ($args['id'] ?? '') . '_color',
            'value' => $value['border-color'] ?? '',
            'customizer_link_attr' => $customizer_link_attr,
        ]);

        return '<div class="wui-sp-border">'
            . '<div class="wui-sp-border-row">'
            . '<div class="wui-sp-border-sides">' . $side_inputs . '</div>'
            . '<span class="wui-sp-unit">px</span>'
            . '</div>'
            . '<div class="wui-sp-border-row wui-sp-border-rest">' . $style . $color . '</div>'
            . '</div>';
    }

    public static function box_shadow($args = [])
    {
        $args = static::normalize_args($args);
        $value = is_array($args['value'] ?? null) ? $args['value'] : [];
        $customizer_link_attr = $args['customizer_link_attr'] ?? '';

        $fields = [
            'x' => static::text(['name' => $args['name'] . '[x]', 'value' => $value['x'] ?? '', 'customizer_link_attr' => $customizer_link_attr]),
            'y' => static::text(['name' => $args['name'] . '[y]', 'value' => $value['y'] ?? '', 'customizer_link_attr' => $customizer_link_attr]),
            'blur' => static::text(['name' => $args['name'] . '[blur]', 'value' => $value['blur'] ?? '', 'customizer_link_attr' => $customizer_link_attr]),
            'spread' => static::text(['name' => $args['name'] . '[spread]', 'value' => $value['spread'] ?? '', 'customizer_link_attr' => $customizer_link_attr]),
            'color' => static::color(['name' => $args['name'] . '[color]', 'value' => $value['color'] ?? '', 'customizer_link_attr' => $customizer_link_attr]),
        ];

        return static::wrap_group_with_keys('wui-sp-field-group wui-sp-box-shadow wui-sp-field-type-box-shadow', $fields, 'wui-sp-field-row', 'wui-sp-box-shadow-');
    }

    public static function button_set($args = [])
    {
        return static::radio($args);
    }

    public static function button_preview($args = [])
    {
        $args = static::normalize_args($args);
        $button_text = $args['button_text'] ?? static::translate('Button');
        $preview_fields = $args['preview_fields'] ?? [];
        if (!is_array($preview_fields)) $preview_fields = [];

        $base_id = $args['id'] ?? ($args['key'] ?? 'wui-sp-button-preview');
        $preview_id = P::className($base_id . '-preview');
        if ($preview_id === '') $preview_id = 'wui-sp-button-preview';

        $data = [
            'fields' => $preview_fields,
            'preview_id' => $preview_id,
        ];

        $style = '<style type="text/css" data-preview-style="' . P::escape($preview_id) . '"></style>';
        $button = '<button type="button" class="wui-sp-button-preview-button" id="' . P::escape($preview_id) . '">' . P::escape($button_text) . '</button>';
        $surface = '<div class="wui-sp-button-preview-surface">' . $button . '</div>';

        return '<div class="wui-sp-button-preview" data-button-preview="' . P::escape(json_encode($data)) . '" data-button-preview-id="' . P::escape($preview_id) . '">' . $style . $surface . '</div>';
    }

    public static function dimensions($args = [])
    {
        $args = static::normalize_args($args);
        $value = is_array($args['value'] ?? null) ? $args['value'] : [];
        $customizer_link_attr = $args['customizer_link_attr'] ?? '';

        $fields = [
            'width' => static::text([
                'name' => $args['name'] . '[width]',
                'id' => ($args['id'] ?? '') . '_width',
                'value' => $value['width'] ?? '',
                'placeholder' => static::translate('Width'),
                'customizer_link_attr' => $customizer_link_attr,
            ]),
            'height' => static::text([
                'name' => $args['name'] . '[height]',
                'id' => ($args['id'] ?? '') . '_height',
                'value' => $value['height'] ?? '',
                'placeholder' => static::translate('Height'),
                'customizer_link_attr' => $customizer_link_attr,
            ]),
        ];

        return static::wrap_group_with_keys('wui-sp-field-group wui-sp-dimensions wui-sp-field-type-dimensions', $fields, 'wui-sp-field-row', 'wui-sp-dimensions-');
    }

    public static function divide($args = [])
    {
        return '<hr class="' . P::escape($args['class'] ?? '') . '">';
    }

    public static function info($args = [])
    {
        $content = $args['content'] ?? '';
        $class = $args['class'] ?? 'wui-sp-info';
        return '<div class="' . P::escape($class) . '">' . static::trusted_html($content) . '</div>';
    }

    public static function raw($args = [])
    {
        return $args['content'] ?? '';
    }

    public static function content($args = [])
    {
        return $args['content'] ?? '';
    }

    public static function js_button($args = [])
    {
        $id = $args['id'] ?? '';
        $label = $args['label'] ?? '';
        $class = $args['class'] ?? 'button';
        $data = '';

        if (isset($args['data']) && is_array($args['data']))
        {
            foreach ($args['data'] as $key => $value) $data .= ' data-' . P::escape($key) . '="' . P::escape($value) . '"';
        }

        return '<button type="button" id="' . P::escape($id) . '" class="' . P::escape($class) . '"' . $data . '>' . P::escape($label) . '</button>';
    }

    public static function multi_text($args = [])
    {
        $args = static::normalize_args($args);
        $values = isset($args['value']) && is_array($args['value']) ? $args['value'] : [];
        $count = $args['count'] ?? 3;

        $rows = [];
        for ($i = 0; $i < $count; $i++)
        {
            $rows[$i] = static::text([
                'name' => $args['name'] . '[' . $i . ']',
                'id' => ($args['id'] ?? '') . '_' . $i,
                'value' => $values[$i] ?? '',
            ]);
        }

        return static::wrap_group('wui-sp-field-group wui-sp-multi-text wui-sp-field-type-multi-text', $rows);
    }

    public static function palette($args = [])
    {
        return static::color_palette($args);
    }

    public static function media($args = [])
    {
        $args = static::normalize_args($args);
        $value = $args['value'] ?? '';
        $customizer_link_attr = '';
        $attachment_id = '';
        $url_value = '';

        if (is_array($value))
        {
            $attachment_id = $value['id'] ?? '';
            $url_value = $value['url'] ?? '';
            if (!$url_value && $attachment_id)
            {
                $url_value = static::attachment_url($attachment_id) ?: '';
            }
        }
        else
        {
            if (is_numeric($value))
            {
                $attachment_id = $value;
                $url_value = static::attachment_url($attachment_id) ?: '';
            }
            else if (is_string($value) && filter_var($value, FILTER_VALIDATE_URL))
            {
                $url_value = $value;
            }
        }

        $preview = '';
        if ($attachment_id || $url_value)
        {
            $url = $url_value !== '' ? $url_value : static::attachment_url($attachment_id);
            if (is_string($url) && $url !== '')
            {
                $ext = strtolower(pathinfo($url, PATHINFO_EXTENSION));
                $is_image = in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'], true);
                if ($is_image) $preview = '<img class="wui-sp-media-preview-image" src="' . P::url($url) . '" alt="">';
                else $preview = '<a class="wui-sp-media-preview" href="' . P::url($url) . '" target="_blank">' . P::escape($url) . '</a>';
            }
        }

        $rows = [];
        if ($preview) $rows['preview'] = $preview;
        $base_name = $args['name'];
        $base_id = $args['id'] ?? '';

        $input = static::text([
            'name' => $base_name . '[url]',
            'id' => $base_id ? $base_id . '_url' : '',
            'value' => $url_value,
            'class' => 'wui-sp-media-url',
            'placeholder' => static::translate('Media URL'),
            'customizer_link_attr' => $customizer_link_attr,
        ]);

        $hidden_id = '<input type="hidden" class="wui-sp-media-id" name="' . P::escape($base_name . '[id]') . '" id="' . P::escape($base_id ? $base_id . '_id' : '') . '" value="' . P::escape($attachment_id) . '"' . $customizer_link_attr . '>';
        $button = '<button type="button" class="wui-button wui-button--secondary wui-sp-secondary-button wui-sp-media-select" data-target="' . P::escape($args['id'] ?? '') . '">' . static::translate('Select') . '</button>';
        $remove_class = ($url_value || $attachment_id) ? 'wui-sp-media-remove' : 'wui-sp-media-remove is-hidden';
        $remove = '<button type="button" class="' . P::escape(trim($remove_class . ' wui-button wui-button--tertiary wui-sp-text-button')) . '" aria-label="' . static::translate('Remove media') . '" title="' . static::translate('Remove') . '"><span class="dashicons dashicons-trash" aria-hidden="true"></span></button>';
        $rows['input'] = '<div class="wui-sp-media-input-group">' . $input . $hidden_id . $button . $remove . '</div>';

        return static::wrap_group_with_keys('wui-sp-field-group wui-sp-media wui-sp-field-type-media', $rows, 'wui-sp-field-row', 'wui-sp-media-');
    }

    public static function gallery($args = [])
    {
        $args = static::normalize_args($args);
        $value = $args['value'] ?? '';
        $customizer_link_attr = static::customizer_link_attr($args);
        $ids = [];
        if (is_array($value))
        {
            $ids = array_values(array_filter(array_map('strval', $value), 'strlen'));
        }
        elseif (is_string($value) && trim($value) !== '')
        {
            $raw = array_map('trim', explode(',', $value));
            $ids = array_values(array_filter($raw, 'strlen'));
        }

        $items = '';
        foreach ($ids as $id)
        {
            $attachment_id = (int) $id;
            if ($attachment_id <= 0) continue;

            $thumb = static::attachment_image_url($attachment_id, 'thumbnail');
            if (!$thumb) $thumb = static::attachment_url($attachment_id) ?: '';

            $preview = $thumb ? '<img src="' . P::url($thumb) . '" alt="">' : '<span class="wui-sp-gallery-missing">' . static::translate('Missing') . '</span>';
            $items .= '<li data-id="' . P::escape($attachment_id) . '">' . $preview
                . '<button type="button" class="wui-sp-gallery-remove" aria-label="' . static::translate('Remove image') . '" title="' . static::translate('Remove') . '"><span class="dashicons dashicons-no-alt" aria-hidden="true"></span></button>'
                . '</li>';
        }

        $input_id = $args['id'] ?? '';
        $input = '<input type="hidden" class="wui-sp-gallery-input" name="' . P::escape($args['name']) . '" id="' . P::escape($input_id) . '" value="' . P::escape(implode(',', $ids)) . '"' . $customizer_link_attr . '>';
        $list = '<ul class="wui-sp-gallery-items">' . $items . '</ul>';
        $empty = '<p class="wui-sp-gallery-empty">' . static::translate('No images selected.') . '</p>';
        $buttons = '<div class="wui-sp-gallery-actions">'
            . '<button type="button" class="wui-button wui-button--secondary wui-sp-secondary-button wui-sp-gallery-select">' . static::translate('Add Images') . '</button>'
            . '<button type="button" class="wui-button wui-button--tertiary wui-sp-text-button wui-sp-gallery-clear">' . static::translate('Clear') . '</button>'
            . '</div>';

        return '<div class="wui-sp-gallery wui-sp-field-type-gallery">' . $list . $empty . $buttons . $input . '</div>';
    }

    public static function multi_media($args = [])
    {
        return static::gallery($args);
    }

    public static function google_maps($args = [])
    {
        $args = static::normalize_args($args);
        $value = is_array($args['value'] ?? null) ? $args['value'] : [];
        $customizer_link_attr = $args['customizer_link_attr'] ?? '';

        $address = $value['address'] ?? '';
        $lat = $value['lat'] ?? '';
        $lng = $value['lng'] ?? '';

        $fields = [
            'address' => static::text([
                'name' => $args['name'] . '[address]',
                'value' => $address,
                'placeholder' => static::translate('Address'),
                'customizer_link_attr' => $customizer_link_attr,
            ]),
            'lat' => static::text([
                'name' => $args['name'] . '[lat]',
                'value' => $lat,
                'placeholder' => static::translate('Latitude'),
                'customizer_link_attr' => $customizer_link_attr,
            ]),
            'lng' => static::text([
                'name' => $args['name'] . '[lng]',
                'value' => $lng,
                'placeholder' => static::translate('Longitude'),
                'customizer_link_attr' => $customizer_link_attr,
            ]),
        ];

        $query = '';
        if ($lat !== '' && $lng !== '') $query = trim((string) $lat) . ',' . trim((string) $lng);
        elseif ($address !== '') $query = $address;

        $src = $query ? 'https://maps.google.com/maps?q=' . rawurlencode($query) . '&z=14&output=embed' : '';
        $iframe_attrs = ' loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="' . static::translate('Map preview') . '"';
        if ($src) $iframe_attrs = ' src="' . P::url($src) . '"' . $iframe_attrs;

        $preview = '<div class="wui-sp-google-map-preview"' . ($src ? '' : ' data-empty="1"') . '>'
            . '<iframe' . $iframe_attrs . '></iframe>'
            . '</div>';

        $fields['preview'] = $preview;

        return static::wrap_group_with_keys('wui-sp-field-group wui-sp-google-maps wui-sp-field-type-google-maps', $fields, 'wui-sp-field-row', 'wui-sp-google-maps-');
    }

    public static function icon_select($args = [])
    {
        return static::select($args);
    }

    public static function image_select($args = [])
    {
        $args = static::normalize_args($args);
        if (!count($args)) return false;

        $options = $args['options'] ?? [];
        $value = $args['value'] ?? '';
        $customizer_link_attr = static::customizer_link_attr($args);

        $items = '';
        foreach ($options as $key => $option)
        {
            $alt = is_array($option) ? ($option['alt'] ?? $key) : $option;
            $label = is_array($option) ? ($option['label'] ?? $alt) : $option;
            $img = is_array($option) ? ($option['img'] ?? '') : '';
            $checked = (string) $value === (string) $key;

            $items .= '<label class="wui-sp-option wui-sp-image-option">'
                . '<input type="radio" name="' . P::escape($args['name']) . '" value="' . P::escape($key) . '"' . $customizer_link_attr . ' ' . ($checked ? 'checked="checked"' : '') . '>'
                . ($img ? '<img src="' . P::url($img) . '" alt="' . P::escape($alt) . '">' : '')
                . ($label !== '' ? '<span>' . P::escape($label) . '</span>' : '')
                . '</label>';
        }

        $class = trim(($args['class'] ?? '') . ' wui-sp-options wui-sp-image-options wui-sp-field-type-image-select');
        return '<div class="' . P::escape($class) . '">' . $items . '</div>';
    }

    public static function select_image($args = [])
    {
        return static::image_select($args);
    }

    public static function import_export($args = [])
    {
        $args = static::normalize_args($args);
        $value = $args['value'] ?? '';
        if (is_array($value) || is_object($value)) $value = json_encode($value);
        $option_name = $args['option_name'] ?? '';
        $base_id = $args['id'] ?? '';
        $file_id = $base_id ? $base_id . '_file' : '';
        $import_id = $base_id ? $base_id . '_import' : '';
        $export_id = $base_id ? $base_id . '_export' : '';
        $filename = $option_name ? $option_name . '.json' : 'settings.json';

        $rows = [
            'export' => '<label class="wui-sp-field-label">' . static::translate('Export') . '</label>'
                . '<div class="wui-sp-import-export-actions">'
                . '<button type="button" class="wui-button wui-button--secondary wui-sp-secondary-button wui-sp-export-json" data-export-target="' . P::escape($export_id) . '" data-export-filename="' . P::escape($filename) . '">'
                . static::translate('Export JSON') . '</button>'
                . '</div>'
                . static::textarea([
                    'name' => $args['name'] . '[export]',
                    'id' => $export_id,
                    'value' => $value,
                    'raw' => true,
                    'rows' => 8,
                    'attributes' => ['readonly' => 'readonly'],
                ]),
            'import' => '<label class="wui-sp-field-label">' . static::translate('Import') . '</label>'
                . '<div class="wui-sp-import-export-actions">'
                . '<input type="file" class="wui-sp-import-file" id="' . P::escape($file_id) . '" accept="application/json">'
                . '<button type="button" class="wui-button wui-button--secondary wui-sp-secondary-button wui-sp-import-file-button" data-file-target="' . P::escape($file_id) . '">'
                . static::translate('Choose JSON File') . '</button>'
                . '</div>'
                . static::textarea([
                    'name' => $args['name'] . '[import]',
                    'id' => $import_id,
                    'rows' => 8,
                    'attributes' => [
                        'placeholder' => static::translate('Paste JSON here or use the file picker above.'),
                        'data-import-source' => 'file',
                    ],
                ]),
        ];

        return static::wrap_group_with_keys('wui-sp-field-group wui-sp-import-export wui-sp-field-type-import-export', $rows, 'wui-sp-field-row', 'wui-sp-import-export-');
    }

    public static function panel_theme($args = [])
    {
        $args = static::normalize_args($args);
        if (!count($args)) return false;
        $customizer_link_attr = static::customizer_link_attr($args);

        $themes = $args['themes'] ?? [];
        $options = [];
        foreach ($themes as $key => $theme)
        {
            $label = is_array($theme) ? ($theme['label'] ?? $key) : $theme;
            $options[$key] = $label;
        }

        $value = $args['value'] ?? ($args['default'] ?? '');
        $name = $args['name'] ?? '';
        $base_id = $args['id'] ?? ($name ?: 'wui-sp-panel-theme');
        $base_id = P::key($base_id);
        if (!isset($options[$value]))
        {
            $default_theme_key = $args['default'] ?? array_key_first($options);
            if ($default_theme_key && isset($options[$default_theme_key])) $value = $default_theme_key;
            else $value = array_key_first($options) ?: '';
        }

        $items = '';
        foreach ($options as $key => $label)
        {
            $option_id = $base_id . '-' . P::className($key);
            $items .= '<label class="wui-sp-panel-choice-option wui-sp-panel-theme-option" for="' . P::escape($option_id) . '">';
            $items .= '<input type="radio" name="' . P::escape($name) . '" id="' . P::escape($option_id) . '" value="' . P::escape($key) . '"' . $customizer_link_attr . P::checked($value, $key, false) . '>';
            $items .= '<span class="wui-sp-panel-choice-card wui-sp-panel-theme-card">';
            $items .= '<span class="wui-sp-panel-choice-name wui-sp-panel-theme-name">' . P::escape($label) . '</span>';
            $items .= '<span class="wui-sp-panel-theme-preview" data-theme-key="' . P::escape($key) . '"></span>';
            $items .= '</span>';
            $items .= '</label>';
        }

        $class = 'wui-sp-panel-choice-grid wui-sp-panel-theme-control wui-sp-field-type-panel-theme';
        if (!empty($args['class'])) $class .= ' ' . $args['class'];

        return '<div class="' . P::escape($class) . '" data-panel-themes="' . P::escape(json_encode($themes)) . '">' . $items . '</div>';
    }

    public static function panel_nav_position($args = [])
    {
        $args = static::normalize_args($args);
        if (!count($args)) return false;
        $customizer_link_attr = static::customizer_link_attr($args);

        $args['options'] = static::resolve_options($args);
        $value = $args['value'] ?? ($args['default'] ?? '');
        $name = $args['name'] ?? '';
        $base_id = $args['id'] ?? ($name ?: 'wui-sp-panel-nav-position');
        $base_id = P::key($base_id);

        $icons = [
            'left' => 'fa-solid fa-arrow-left',
            'right' => 'fa-solid fa-arrow-right',
            'top' => 'fa-solid fa-arrow-up',
        ];

        $items = '';
        foreach ($args['options'] as $key => $label)
        {
            $option_id = $base_id . '-' . P::className($key);
            $icon = $icons[$key] ?? 'fa-solid fa-circle';
            $items .= '<label class="wui-sp-panel-choice-option wui-sp-panel-nav-position-option" for="' . P::escape($option_id) . '">';
            $items .= '<input type="radio" name="' . P::escape($name) . '" id="' . P::escape($option_id) . '" value="' . P::escape($key) . '"' . $customizer_link_attr . P::checked($value, $key, false) . '>';
            $items .= '<span class="wui-sp-panel-choice-card wui-sp-panel-nav-position-card">';
            $items .= '<span class="wui-sp-panel-choice-name wui-sp-panel-nav-position-name">' . P::escape($label) . '</span>';
            $items .= '<span class="wui-sp-panel-choice-icon"><i class="' . P::escape($icon) . '" aria-hidden="true"></i></span>';
            $items .= '</span>';
            $items .= '</label>';
        }

        $class = 'wui-sp-panel-choice-grid wui-sp-panel-nav-position-control wui-sp-field-type-panel-nav-position';
        if (!empty($args['class'])) $class .= ' ' . $args['class'];

        return '<div class="' . P::escape($class) . '">' . $items . '</div>';
    }

    public static function link_color_scheme($args = [])
    {
        return static::link_color($args);
    }

    public static function repeater($args = [])
    {
        $args = static::normalize_args($args);
        $value = $args['value'] ?? [];
        $customizer_link_attr = static::customizer_link_attr($args);
        if (is_string($value))
        {
            $decoded = json_decode($value, true);
            if (is_array($decoded)) $value = $decoded;
        }
        if (!is_array($value)) $value = [];

        $field_labels = [];
        $field_defs = [];
        $fields = $args['fields'] ?? [];
        if (is_array($fields))
        {
            foreach ($fields as $key => $field)
            {
                if (is_int($key))
                {
                    $field_key = (string) $field;
                    $field_labels[$field_key] = ucfirst(str_replace('_', ' ', $field_key));
                    $field_defs[] = [
                        'key' => $field_key,
                        'label' => $field_labels[$field_key],
                        'type' => 'text',
                    ];
                    continue;
                }

                $field_key = (string) $key;
                if (is_array($field))
                {
                    $field_labels[$field_key] = $field['label'] ?? $field_key;
                    $field_def = [
                        'key' => $field_key,
                        'label' => $field_labels[$field_key],
                        'type' => $field['type'] ?? 'text',
                    ];
                    if (!empty($field['options']) && is_array($field['options'])) $field_def['options'] = $field['options'];
                    $field_defs[] = $field_def;
                }
                else
                {
                    $field_labels[$field_key] = (string) $field;
                    $field_defs[] = [
                        'key' => $field_key,
                        'label' => $field_labels[$field_key],
                        'type' => 'text',
                    ];
                }
            }
        }

        if (!$field_defs)
        {
            $sample = [];
            if (!empty($value[0]) && is_array($value[0]))
            {
                $sample = array_keys($value[0]);
            }
            elseif (!empty($args['default']) && is_array($args['default']) && !empty($args['default'][0]) && is_array($args['default'][0]))
            {
                $sample = array_keys($args['default'][0]);
            }

            foreach ($sample as $key)
            {
                $field_labels[$key] = ucfirst(str_replace('_', ' ', (string) $key));
                $field_defs[] = [
                    'key' => (string) $key,
                    'label' => $field_labels[$key],
                    'type' => 'text',
                ];
            }
        }

        $rows = $args['rows'] ?? 6;
        $data_fields = $field_defs;
        $data_labels = $field_labels;

        $items = '<div class="wui-sp-repeater-items"></div>';
        $actions = '<div class="wui-sp-repeater-actions"><button type="button" class="wui-button wui-button--secondary wui-sp-secondary-button wui-sp-repeater-add">' . static::translate('Add Item') . '</button></div>';
        $textarea = '<textarea class="wui-sp-repeater" name="' . P::escape($args['name']) . '" id="' . P::escape($args['id'] ?? '') . '" rows="' . P::escape($rows) . '" placeholder="' . static::translate('JSON array') . '"' . $customizer_link_attr . '>' . P::escape(json_encode($value)) . '</textarea>';

        return '<div class="wui-sp-repeater-wrapper" data-fields="' . P::escape(json_encode($data_fields)) . '" data-labels="' . P::escape(json_encode($data_labels)) . '">' . $items . $actions . $textarea . '</div>';
    }

    public static function slides($args = [])
    {
        if (empty($args['fields']))
        {
            $args['fields'] = [
                'image' => [
                    'label' => static::translate('Image'),
                    'type' => 'media',
                ],
                'title' => [
                    'label' => static::translate('Title'),
                    'type' => 'text',
                ],
            ];
        }

        return static::repeater($args);
    }

    public static function social_profiles($args = [])
    {
        if (empty($args['fields']))
        {
            $args['fields'] = [
                'icon' => [
                    'label' => static::translate('Icon'),
                    'type' => 'select',
                    'options' => [
                        'fa-brands fa-facebook-f' => static::translate('Facebook'),
                        'fa-brands fa-x-twitter' => static::translate('X / Twitter'),
                        'fa-brands fa-instagram' => static::translate('Instagram'),
                        'fa-brands fa-linkedin-in' => static::translate('LinkedIn'),
                        'fa-brands fa-youtube' => static::translate('YouTube'),
                        'fa-brands fa-pinterest-p' => static::translate('Pinterest'),
                        'fa-brands fa-tiktok' => static::translate('TikTok'),
                        'fa-brands fa-whatsapp' => static::translate('WhatsApp'),
                        'fa-brands fa-telegram' => static::translate('Telegram'),
                        'fa-brands fa-discord' => static::translate('Discord'),
                        'fa-brands fa-github' => static::translate('GitHub'),
                        'fa-solid fa-globe' => static::translate('Website'),
                    ],
                ],
                'url' => [
                    'label' => static::translate('URL'),
                    'type' => 'text',
                ],
            ];
        }

        return static::repeater($args);
    }

    public static function sortable($args = [])
    {
        $args = static::normalize_args($args);
        $args['options'] = static::resolve_options($args);
        $value = isset($args['value']) && is_array($args['value']) ? $args['value'] : array_keys($args['options']);
        $customizer_link_attr = static::customizer_link_attr($args);

        $items = '';
        foreach ($value as $key)
        {
            if (!isset($args['options'][$key])) continue;
            $items .= '<li data-key="' . P::escape($key) . '"><input type="hidden" name="' . P::escape($args['name']) . '[]" value="' . P::escape($key) . '"' . $customizer_link_attr . '>' . P::escape($args['options'][$key]) . '</li>';
        }

        $content = '<ul class="wui-sp-sortable wui-sp-field-type-sortable" id="' . P::escape($args['id'] ?? '') . '">' . $items . '</ul>';
        if (!empty($args['webilia_source_label'])) return '<div class="wui-sp-resolved-options">' . $content . '</div>';

        return $content;
    }

    public static function sorter($args = [])
    {
        return static::sortable($args);
    }

    public static function spacing($args = [])
    {
        $args = static::normalize_args($args);
        $value = is_array($args['value'] ?? null) ? $args['value'] : [];
        $customizer_link_attr = $args['customizer_link_attr'] ?? '';

        $fields = ['top', 'right', 'bottom', 'left'];
        $rows = [];
        foreach ($fields as $field)
        {
            $rows[$field] = static::text([
                'name' => $args['name'] . '[' . $field . ']',
                'id' => ($args['id'] ?? '') . '_' . $field,
                'value' => $value[$field] ?? '',
                'placeholder' => ucfirst($field),
                'customizer_link_attr' => $customizer_link_attr,
            ]);
        }

        return static::wrap_group_with_keys('wui-sp-field-group wui-sp-spacing wui-sp-field-type-spacing', $rows, 'wui-sp-field-row', 'wui-sp-spacing-');
    }

    public static function section($args = [])
    {
        $title = $args['title'] ?? '';
        $subtitle = $args['subtitle'] ?? '';
        $desc = $args['desc'] ?? '';
        $class = trim(($args['class'] ?? 'wui-sp-section-divider') . ' wui-sp-field-type-section');

        $content = '';
        $text = $desc !== '' ? $desc : $subtitle;
        if ($text !== '') $content .= '<div class="wui-sp-section-divider-desc">' . static::trusted_html($text) . '</div>';

        return '<div class="' . P::escape($class) . '">' . $content . '</div>';
    }

    public static function tabbed($args = [])
    {
        $args = static::normalize_args($args);
        $tabs = $args['tabs'] ?? ($args['options'] ?? []);
        if (!is_array($tabs) || !$tabs) return '';

        $group = (string) ($args['tab_group'] ?? ($args['group'] ?? ($args['id'] ?? '')));
        $normalized = [];

        foreach ($tabs as $key => $tab)
        {
            if (is_int($key))
            {
                if (!is_string($tab) || $tab === '') continue;
                $tab_key = $tab;
                $label = ucfirst(str_replace('_', ' ', $tab_key));
            }
            else
            {
                $tab_key = (string) $key;
                if ($tab_key === '') continue;
                if (is_array($tab))
                {
                    $label = $tab['label'] ?? ($tab['title'] ?? $tab_key);
                }
                else
                {
                    $label = (string) $tab;
                }
            }

            $normalized[$tab_key] = [
                'label' => $label !== '' ? $label : $tab_key,
            ];
        }

        if (!$normalized) return '';

        $default = (string) ($args['default'] ?? '');
        if ($default === '' || !isset($normalized[$default]))
        {
            $keys = array_keys($normalized);
            $default = $keys[0] ?? '';
        }

        $buttons = '';
        foreach ($normalized as $key => $tab)
        {
            $buttons .= '<li class="wui-sp-tabbed-item" data-tab="' . P::escape($key) . '" role="presentation">';
            $buttons .= '<a href="#" class="wui-sp-tabbed-link" data-tab="' . P::escape($key) . '" role="tab" aria-selected="false">' . P::escape($tab['label']) . '</a>';
            $buttons .= '</li>';
        }

        $attrs = ' class="wui-sp-tabbed"';
        if ($group !== '') $attrs .= ' data-tab-group="' . P::escape($group) . '"';
        if ($default !== '') $attrs .= ' data-default-tab="' . P::escape($default) . '"';

        return '<div' . $attrs . '><ul class="wui-sp-tabbed-nav lsd-level-5-menu" role="tablist">' . $buttons . '</ul></div>';
    }

    public static function typography($args = [])
    {
        $args = static::normalize_args($args);
        $value = $args['value'] ?? [];
        $customizer_link_attr = '';
        if (is_string($value))
        {
            $decoded = json_decode($value, true);
            if (is_array($decoded)) $value = $decoded;
        }
        if (!is_array($value)) $value = [];

        $defaults = $args['default'] ?? [];
        if (!is_array($defaults)) $defaults = [];
        if ($defaults)
        {
            foreach ($defaults as $key => $default)
            {
                if (!array_key_exists($key, $value) || $value[$key] === '') $value[$key] = $default;
            }
        }

        $families = $args['fonts'] ?? [];
        if (!$families)
        {
            $families = ($args['fonts'] ?? ['inherit' => static::translate('Inherit')]);
        }

        $font_family = $value['font-family'] ?? 'inherit';
        if ($font_family && !isset($families[$font_family]))
        {
            $families = [$font_family => $font_family] + $families;
        }

        $with_label = function (string $label, string $field): string
        {
            return '<span class="wui-sp-field-label">' . P::escape($label) . '</span>' . $field;
        };

        $color_attributes = [];
        if (!empty($args['color_origin']))
        {
            $color_attributes['data-wui-sp-color-origin'] = $args['color_origin'];
        }

        $rows = [
            'font-family' => $families
                ? $with_label(static::translate('Font Family'), static::select([
                    'name' => $args['name'] . '[font-family]',
                    'id' => ($args['id'] ?? '') . '_font_family',
                    'options' => $families,
                    'value' => $font_family,
                    'customizer_link_attr' => $customizer_link_attr,
                ]))
                : $with_label(static::translate('Font Family'), static::text([
                    'name' => $args['name'] . '[font-family]',
                    'id' => ($args['id'] ?? '') . '_font_family',
                    'value' => $font_family,
                    'placeholder' => static::translate('Font Family'),
                    'customizer_link_attr' => $customizer_link_attr,
                ])),
            'font-size' => $with_label(static::translate('Font Size'), static::text([
                'name' => $args['name'] . '[font-size]',
                'id' => ($args['id'] ?? '') . '_font_size',
                'value' => $value['font-size'] ?? '',
                'placeholder' => static::translate('Font Size'),
                'customizer_link_attr' => $customizer_link_attr,
            ])),
            'font-weight' => $with_label(static::translate('Font Weight'), static::text([
                'name' => $args['name'] . '[font-weight]',
                'id' => ($args['id'] ?? '') . '_font_weight',
                'value' => $value['font-weight'] ?? '',
                'placeholder' => static::translate('Font Weight'),
                'customizer_link_attr' => $customizer_link_attr,
            ])),
            'line-height' => $with_label(static::translate('Line Height'), static::text([
                'name' => $args['name'] . '[line-height]',
                'id' => ($args['id'] ?? '') . '_line_height',
                'value' => $value['line-height'] ?? '',
                'placeholder' => static::translate('Line Height'),
                'customizer_link_attr' => $customizer_link_attr,
            ])),
            'text-align' => $with_label(static::translate('Text Align'), static::select([
                'name' => $args['name'] . '[text-align]',
                'id' => ($args['id'] ?? '') . '_text_align',
                'options' => [
                    'inherit' => static::translate('Inherit'),
                    'left' => static::translate('Left'),
                    'right' => static::translate('Right'),
                    'center' => static::translate('Center'),
                    'justify' => static::translate('Justify'),
                ],
                'value' => $value['text-align'] ?? 'inherit',
                'customizer_link_attr' => $customizer_link_attr,
            ])),
            'font-style' => $with_label(static::translate('Font Style'), static::select([
                'name' => $args['name'] . '[font-style]',
                'id' => ($args['id'] ?? '') . '_font_style',
                'options' => [
                    'normal' => static::translate('Normal'),
                    'italic' => static::translate('Italic'),
                    'inherit' => static::translate('Inherit'),
                ],
                'value' => $value['font-style'] ?? 'normal',
                'customizer_link_attr' => $customizer_link_attr,
            ])),
            'text-decoration' => $with_label(static::translate('Text Decoration'), static::select([
                'name' => $args['name'] . '[text-decoration]',
                'id' => ($args['id'] ?? '') . '_text_decoration',
                'options' => [
                    'none' => static::translate('None'),
                    'underline' => static::translate('Underline'),
                    'overline' => static::translate('Overline'),
                    'line-through' => static::translate('Line Through'),
                    'inherit' => static::translate('Inherit'),
                ],
                'value' => $value['text-decoration'] ?? 'none',
                'customizer_link_attr' => $customizer_link_attr,
            ])),
            'color' => $with_label(static::translate('Color'), static::color([
                'name' => $args['name'] . '[color]',
                'id' => ($args['id'] ?? '') . '_color',
                'value' => $value['color'] ?? '',
                'attributes' => $color_attributes,
                'customizer_link_attr' => $customizer_link_attr,
            ])),
        ];

        $fields = static::wrap_group_with_keys('wui-sp-field-group wui-sp-typography-fields wui-sp-field-type-typography-fields', $rows, 'wui-sp-field-row', 'wui-sp-typography-');

        return '<div class="wui-sp-typography wui-sp-field-type-typography">' . $fields . '</div>';
    }

    public static function custom_fonts($args = [])
    {
        return static::textarea($args);
    }

    public static function customizer($args = [])
    {
        $label = $args['label'] ?? static::translate('Open Customizer');
        $url = $args['url'] ?? '';
        return '<a class="button" href="' . P::url($url) . '">' . P::escape($label) . '</a>';
    }

    public static function taxonomy_metaboxes($args = [])
    {
        return static::select($args);
    }

    public static function user_profile_metaboxes($args = [])
    {
        return static::select($args);
    }

    public static function widget_areas($args = [])
    {
        return static::select($args);
    }
    /** Labels are plain text; callers may override this method for localization. */
    protected static function translate(string $text): string { return P::escape($text); }
    /** HTML in info/raw/content/section definitions is explicitly trusted caller markup. */
    protected static function trusted_html($html): string { return (string) $html; }
    protected static function attachment_url($id): string { return ''; }
    protected static function attachment_image_url($id, $size): string { return ''; }
}
