(function ($) {
    'use strict';
    const root = document.querySelector('.js-wui-di-page');
    if (!root) return;
    window.WebiliaUI.demoImport.init(root, {
        jquery: $,
        labels: window.webiliaWPImportLabels || {},
        request(config) {
            return $.ajax(Object.assign({}, config, {
                data: Object.assign({}, config.data, { action: 'webilia_wp_demo_' + config.data.action })
            })).then(response => {
                if (!response || typeof response.message !== 'string') return response;
                // WP's legacy completion fields contain escaped text and paragraph markup.
                // Template contents are inert; pass only their text to the shared renderer.
                const plainText = value => {
                    const template = document.createElement('template');
                    template.innerHTML = value;
                    return template.content.textContent;
                };
                const prepared = Object.assign({}, response, { message: plainText(response.message) });
                if (typeof response.title === 'string') prepared.title = plainText(response.title);
                return prepared;
            });
        }
    });
})(jQuery);
