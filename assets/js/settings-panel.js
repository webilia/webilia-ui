let instance;

export function create(options = {}) {
    if (instance) return instance;
    const labels = options.labels || {};

    /**
     * Webilia Panel App (modular, no bundler needed)
     * - One bootstrap pipeline: app.initContext(context)
     * - Modules are idempotent (safe to call multiple times)
     * - Panel-only modules skip Customizer
     */

        // ---------------------------
        // Utilities
        // ---------------------------
    const Utils = {
            qs(selector, root) {
                return (root || document).querySelector(selector);
            },
            qsa(selector, root) {
                return Array.prototype.slice.call((root || document).querySelectorAll(selector));
            },
            on(target, event, handler, options) {
                if (!target) return;
                target.addEventListener(event, handler, options || false);
            },
            off(target, event, handler, options) {
                if (!target) return;
                target.removeEventListener(event, handler, options || false);
            },
            cssEscape(value) {
                if (window.CSS && typeof window.CSS.escape === 'function') {
                    return window.CSS.escape(value);
                }
                return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
            },
            normalizeId(raw) {
                if (!raw) return '';
                let v = String(raw).replace(/^#/, '');
                v = v.replace(/^wui-sp-section-/, '');
                return v.trim();
            },
            rafThrottle(fn) {
                let scheduled = false;
                return function (...args) {
                    if (scheduled) return;
                    scheduled = true;
                    requestAnimationFrame(() => {
                        scheduled = false;
                        fn.apply(this, args);
                    });
                };
            }
        };

    function webiliaSettingsToastRoot()
    {
        let root = document.querySelector('[data-wui-sp-settings-toast-root]');
        if (!root)
        {
            root = document.createElement('div');
            root.className = 'wui wui-sp-settings-ui';
            root.dataset.webiliaSettingsToastRoot = '';
            document.body.append(root);
        }

        return root;
    }

    // ---------------------------
    // App
    // ---------------------------
    function WebiliaApp()
    {
        this.isCustomizer = !!options.customizer;
        this.rootPanel = Utils.qs('.wui-sp-panel');
        this.nav = Utils.qs('.wui-sp-panel-nav');
        this.sections = Utils.qsa('.wui-sp-panel-section');
        this.defaultSection = this.rootPanel ? (this.rootPanel.getAttribute('data-wui-sp-default-section') || '') : '';
        this.modules = [];
    }

    WebiliaApp.prototype.register = function (module) {
        if (!module || typeof module.init !== 'function') return;
        this.modules.push(module);
    };

    WebiliaApp.prototype.initContext = function (context) {
        this.modules.forEach((m) => {
            try {
                m.init(context || document, this);
            } catch (e) {
                // keep failures isolated
            }
        });
    };

    WebiliaApp.prototype.init = function () {
        this.initContext(document);

        // panel admin only
        if (!this.isCustomizer) NavModule.initActiveOnce(this);
    };

    // ---------------------------
    // Module: Nav
    // ---------------------------
    const NavModule = (function () {
        let bound = false;

        function isTopNav(app)
        {
            const panel = app.rootPanel || Utils.qs('.wui-sp-panel');
            return panel && panel.getAttribute('data-wui-sp-nav-position') === 'top';
        }

        function setSubnavHeight(app, item, open)
        {
            const nav = app.nav;
            if (!nav || !item) return;
            const subnav = item.querySelector(':scope > .wui-sp-subnav');
            if (!subnav) return;

            subnav.style.maxHeight = '0px';

            if (open)
            {
                const h = subnav.scrollHeight;
                subnav.style.maxHeight = h + 'px';

                subnav.addEventListener(
                    'transitionend',
                    function (e)
                    {
                        if (e.propertyName === 'max-height' && item.classList.contains('is-open')) subnav.style.maxHeight = 'none';
                    },
                    { once: true }
                );
            } else {
                if (getComputedStyle(subnav).maxHeight === 'none') {
                    subnav.style.maxHeight = subnav.scrollHeight + 'px';
                }
                requestAnimationFrame(() => {
                    subnav.style.maxHeight = '0px';
                });
            }
        }

        function closeAll(app, exceptItem) {
            const nav = app.nav;
            if (!nav) return;

            Utils.qsa('.wui-sp-nav-item.is-open', nav).forEach((item) => {
                if (exceptItem && item === exceptItem) return;
                item.classList.remove('is-open');
                setSubnavHeight(app, item, false);
            });

            Utils.qsa('.wui-sp-nav-toggle[aria-expanded="true"]', nav).forEach((btn) => {
                if (exceptItem && exceptItem.contains(btn)) return;
                btn.setAttribute('aria-expanded', 'false');
            });
        }

        function openItem(app, item, forceHeightSync) {
            if (!app.nav || !item) return;

            const alreadyOpen = item.classList.contains('is-open');

            item.classList.add('is-open');

            const btn = item.querySelector(':scope > .wui-sp-nav-row .wui-sp-nav-toggle');
            if (btn) btn.setAttribute('aria-expanded', 'true');

            if (alreadyOpen && !forceHeightSync) return;

            setSubnavHeight(app, item, true);
        }

        function resolveTargetId(app, id) {
            id = Utils.normalizeId(id);
            if (!id) return '';

            const section = Utils.qs('.wui-sp-panel-section[data-section="' + Utils.cssEscape(id) + '"]');
            let hasContent = true;
            if (section) hasContent = section.getAttribute('data-has-content') !== '0';
            if (hasContent) return id;

            if (!app.nav) return id;

            const navItem = app.nav.querySelector('.wui-sp-nav-item[data-section="' + Utils.cssEscape(id) + '"]');
            if (!navItem) return id;

            const firstChildLink = navItem.querySelector('.wui-sp-subnav a[href^="#wui-sp-section-"]');
            if (!firstChildLink) return id;

            const fallback = Utils.normalizeId(firstChildLink.getAttribute('href'));
            return fallback || id;
        }

        function setActiveSection(app, id) {
            id = resolveTargetId(app, id);
            if (!id || !app.sections.length) return;

            let matched = false;
            app.sections.forEach((section) => {
                const isMatch = section.dataset.section === id;
                section.classList.toggle('is-active', isMatch);
                if (isMatch) matched = true;
            });

            if (!matched) return;

            document.dispatchEvent(new CustomEvent('wui-sp:section-change', {
                detail: { sectionId: id }
            }));

            const nav = app.nav;
            if (!nav) return;

            Utils.qsa('a.wui-sp-nav-link.is-active', nav).forEach((a) => a.classList.remove('is-active'));

            const activeLink = nav.querySelector('a.wui-sp-nav-link[href="#wui-sp-section-' + Utils.cssEscape(id) + '"]');
            if (!activeLink) return;

            activeLink.classList.add('is-active');

            const activeParent = activeLink.closest('.wui-sp-nav-item');
            if (activeParent) {
                const parentLink = activeParent.querySelector(':scope > .wui-sp-nav-row > a.wui-sp-nav-link');
                if (parentLink) parentLink.classList.add('is-active');
            }

            if (isTopNav(app)) {
                closeAll(app);
            } else {
                closeAll(app, activeParent);

                if (activeParent && !activeParent.classList.contains('is-open')) openItem(app, activeParent);
            }
        }

        function initActive(app) {
            if (!app.sections.length) return;

            const raw = Utils.normalizeId(window.location.hash);
            let id = raw;

            if (!id && app.defaultSection) id = Utils.normalizeId(app.defaultSection);
            if (!id && app.sections[0]) id = app.sections[0].dataset.section;

            id = resolveTargetId(app, id);
            if (!id) return;

            if (raw && raw !== id) {
                window.location.hash = '#wui-sp-section-' + id;
                return;
            }

            setActiveSection(app, id);
        }

        function initActiveOnce(app) {
            initActive(app);
        }

        function bindNavHandlers(app) {
            if (bound) return;
            bound = true;

            if (app.isCustomizer) return;
            if (!app.nav) return;

            Utils.on(app.nav, 'click', function (e) {
                const nav = app.nav;

                const toggle = e.target.closest('.wui-sp-nav-toggle');
                if (toggle && nav.contains(toggle)) {
                    e.preventDefault();
                    const item = toggle.closest('.wui-sp-nav-item');
                    if (!item) return;

                    const isOpen = item.classList.contains('is-open');
                    closeAll(app);
                    if (!isOpen) openItem(app, item);
                    return;
                }

                const link = e.target.closest('a[href^="#wui-sp-section-"]');
                if (!link || !nav.contains(link)) return;

                const id = Utils.normalizeId(link.getAttribute('href'));
                if (!id) return;

                const item = link.closest('.wui-sp-nav-item');
                const hasChildren = item && item.querySelector(':scope > .wui-sp-subnav');
                const isChildLink = !!link.closest('.wui-sp-subnav');

                if (isTopNav(app) && hasChildren && !isChildLink) {
                    e.preventDefault();
                    const isOpen = item.classList.contains('is-open');
                    closeAll(app);
                    if (!isOpen) openItem(app, item);
                    return;
                }

                e.preventDefault();

                const targetId = resolveTargetId(app, id);
                const newHash = '#wui-sp-section-' + targetId;

                if (window.location.hash !== newHash) {
                    window.location.hash = newHash;
                } else {
                    setActiveSection(app, targetId);
                }

                if (isTopNav(app)) {
                    if (isChildLink) setActiveSection(app, targetId);
                    closeAll(app);
                }
            });

            Utils.on(document, 'click', function (e) {
                if (!isTopNav(app)) return;
                if (app.nav && app.nav.contains(e.target)) return;
                closeAll(app);
            });

            Utils.on(window, 'hashchange', function () {
                initActive(app);
            });

            Utils.qsa('.wui-sp-nav-item.is-open', app.nav).forEach((item) => openItem(app, item, true));
        }

        return {
            name: 'NavModule',
            init(context, app) {
                if (context !== document) return;
                bindNavHandlers(app);
            },
            initActiveOnce
        };
    })();

    // ---------------------------
    // Module: Level 3 Menus
    // ---------------------------
    const Level3MenusModule = (function () {
        let bound = false;

        function mountMenu(section) {
            if (!section) return;

            Utils.qsa('.wui-sp-tab-switcher', section).forEach((menu) => {
                const contentSelector = menu.getAttribute('data-for') || '';
                if (!contentSelector) return;

                const tabs = Utils.qsa('li', menu);
                if (!tabs.length) return;

                let activeTab = menu.querySelector('li.wui-sp-sub-tabs-active');
                if (!activeTab) activeTab = tabs[0];
                if (!activeTab) return;

                const target = activeTab.getAttribute('data-tab') || '';
                if (!target) return;

                tabs.forEach((tab) => {
                    tab.classList.toggle('wui-sp-sub-tabs-active', tab === activeTab);
                });

                Utils.qsa(contentSelector, section).forEach((content) => {
                    content.classList.remove('wui-sp-tab-switcher-content-active');
                });

                const activeContent = Utils.qs('#wui-sp-tab-switcher-' + Utils.cssEscape(target) + '-content', section);
                if (activeContent) activeContent.classList.add('wui-sp-tab-switcher-content-active');
            });
        }

        function bindTabSwitcher() {
            Utils.qsa('.wui-sp-tab-switcher li a').forEach(link => {
                if (link.dataset.wuiTabBound) return;
                link.dataset.wuiTabBound = '1';
                link.addEventListener('click', event => {
                    event.preventDefault();
                    const tab = link.parentElement;
                    const tabs = tab.parentElement;
                    const selector = tabs.getAttribute('data-for');
                    if (!selector) return;
                    tabs.querySelectorAll('li').forEach(item => item.classList.toggle('wui-sp-sub-tabs-active', item === tab));
                    document.querySelectorAll(selector).forEach(item => item.classList.remove('wui-sp-tab-switcher-content-active'));
                    const target = document.getElementById('wui-sp-tab-switcher-' + tab.getAttribute('data-tab') + '-content');
                    if (target) target.classList.add('wui-sp-tab-switcher-content-active');
                });
            });
        }

        function bind() {
            if (bound) return;
            bound = true;

            Utils.on(document, 'wui-sp:section-change', function (e) {
                const sectionId = e.detail && e.detail.sectionId ? e.detail.sectionId : '';
                const section = sectionId ? Utils.qs('.wui-sp-panel-section[data-section="' + Utils.cssEscape(sectionId) + '"]') : null;
                mountMenu(section);
            });
        }

        return {
            name: 'Level3MenusModule',
            init(context) {
                if (context !== document) return;
                bindTabSwitcher();
                mountMenu(Utils.qs('.wui-sp-panel-section.is-active') || Utils.qs('.wui-sp-panel-section'));
                bind();
            }
        };
    })();

    // ---------------------------
    // Module: Conditionals
    // ---------------------------
    const ConditionalsModule = (function () {
        let bound = false;
        let hasRun = false;

        function normalizeScalar(value) {
            if (value === null || value === undefined) return '';
            if (Array.isArray(value)) return value;
            if (typeof value === 'boolean') return value;

            const str = String(value).trim().toLowerCase();
            if (str === 'true' || str === '1') return true;
            if (str === 'false' || str === '0') return false;

            return value;
        }

        function valuesEqual(actual, expected) {
            if (Array.isArray(actual)) {
                return actual.indexOf(expected) !== -1 || actual.indexOf(String(expected)) !== -1;
            }

            const a = normalizeScalar(actual);
            const e = normalizeScalar(expected);

            if (typeof a === 'boolean' || typeof e === 'boolean') {
                return Boolean(a) === Boolean(e);
            }

            return String(a) === String(e);
        }

        function compareValues(actual, operator, expected) {
            let op = String(operator || '=').toLowerCase();
            if (op === 'equals' || op === '=') op = '==';
            if (op === 'not') op = '!=';

            if (op === '==' || op === '!=') {
                const eq = valuesEqual(actual, expected);
                return op === '==' ? eq : !eq;
            }

            if (op === '>' || op === '<' || op === '>=' || op === '<=') {
                const aNum = parseFloat(actual);
                const eNum = parseFloat(expected);
                if (Number.isNaN(aNum) || Number.isNaN(eNum)) return false;
                if (op === '>') return aNum > eNum;
                if (op === '<') return aNum < eNum;
                if (op === '>=') return aNum >= eNum;
                if (op === '<=') return aNum <= eNum;
            }

            if (op === 'contains' || op === 'not_contains') {
                let contains;
                if (Array.isArray(actual)) {
                    contains = actual.indexOf(expected) !== -1 || actual.indexOf(String(expected)) !== -1;
                } else {
                    contains = String(actual).indexOf(String(expected)) !== -1;
                }
                return op === 'contains' ? contains : !contains;
            }

            if (op === 'in' || op === 'not_in') {
                let inList = false;
                if (Array.isArray(expected)) {
                    inList = expected.indexOf(actual) !== -1 || expected.indexOf(String(actual)) !== -1;
                } else if (Array.isArray(actual)) {
                    inList = actual.indexOf(expected) !== -1 || actual.indexOf(String(expected)) !== -1;
                }
                return op === 'in' ? inList : !inList;
            }

            return valuesEqual(actual, expected);
        }

        function getFieldValue(fieldId) {
            const field = Utils.qs('.wui-sp-field[data-field-id="' + Utils.cssEscape(fieldId) + '"]');
            if (!field) return '';

            const radios = field.querySelectorAll('input[type="radio"]');
            if (radios.length) {
                const checked = field.querySelector('input[type="radio"]:checked');
                return checked ? checked.value : '';
            }

            const selects = field.querySelectorAll('select');
            if (selects.length) {
                const select = selects[0];
                if (select.multiple) {
                    return Array.prototype.map.call(select.selectedOptions, (option) => option.value);
                }
                return select.value;
            }

            const checkboxes = field.querySelectorAll('input[type="checkbox"]');
            if (checkboxes.length) {
                if (checkboxes.length === 1) {
                    return checkboxes[0].checked ? '1' : '0';
                }

                const values = [];
                Array.prototype.forEach.call(checkboxes, (checkbox) => {
                    if (!checkbox.checked) return;

                    let val = checkbox.value;
                    if (val === '1' && checkbox.name) {
                        const match = checkbox.name.match(/\[([^\]]+)\]$/);
                        if (match && match[1]) val = match[1];
                    }
                    values.push(val);
                });

                return values;
            }

            const input = field.querySelector('input');
            if (input) return input.value;

            const textarea = field.querySelector('textarea');
            if (textarea) return textarea.value;

            return '';
        }

        function normalizeRequired(rule) {
            if (!Array.isArray(rule)) return [];
            if (rule.length === 3 && !Array.isArray(rule[0])) return [rule];
            if (Array.isArray(rule[0])) return rule;
            return [];
        }

        function evaluateRequired(rule) {
            const conditions = normalizeRequired(rule);
            if (!conditions.length) return true;

            for (let i = 0; i < conditions.length; i++) {
                const condition = conditions[i];
                if (!Array.isArray(condition) || condition.length < 3) continue;

                const fieldId = condition[0];
                const operator = condition[1];
                const expected = condition[2];
                const actual = getFieldValue(fieldId);

                if (!compareValues(actual, operator, expected)) return false;
            }

            return true;
        }

        function triggerRevealAnimation(el) {
            if (!el) return;

            if (el._webiliaAnimTimeout) {
                window.clearTimeout(el._webiliaAnimTimeout);
            }

            el.classList.remove('is-animating');
            el.classList.remove('is-hiding');
            el.offsetHeight; // force reflow
            el.classList.add('is-animating');

            el._webiliaAnimTimeout = window.setTimeout(function () {
                el.classList.remove('is-animating');
            }, 380);
        }

        function triggerHideAnimation(el) {
            if (!el) return;

            if (el.classList.contains('is-hidden') || el.classList.contains('is-hiding')) return;

            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                el.classList.add('is-hidden');
                return;
            }
            el.classList.remove('is-hidden');
            el.classList.add('is-hiding');

            function onEnd(e) {
                if (e.target !== el) return;
                el.classList.add('is-hidden');
                el.classList.remove('is-hiding');
                el.removeEventListener('animationend', onEnd);
            }

            el.addEventListener('animationend', onEnd);
        }

        // Unified toggle for field/wrappers (Customizer li, panel rows, etc.)
        function toggleHiddenState(el, shouldShow, isInitial) {
            if (!el) return;

            const wasHidden = el.classList.contains('is-hidden');

            if (shouldShow) {
                el.classList.remove('is-hidden');
                el.classList.remove('is-hiding');
                if (wasHidden && !isInitial) triggerRevealAnimation(el);
            } else if (wasHidden || isInitial) {
                el.classList.add('is-hidden');
                el.classList.remove('is-hiding');
            } else {
                triggerHideAnimation(el);
            }
        }

        function applyConditionals() {
            const fields = document.querySelectorAll('.wui-sp-field[data-required]');
            const isInitial = !hasRun;

            Array.prototype.forEach.call(fields, (field) => {
                const raw = field.getAttribute('data-required');
                if (!raw) return;

                let rule = null;
                try {
                    rule = JSON.parse(raw);
                } catch (e) {
                    return;
                }

                const shouldShow = evaluateRequired(rule);

                // 1) Toggle the field itself (keeps internal animations if you use them)
                toggleHiddenState(field, shouldShow, isInitial);

                // 2) Customizer: hide the whole <li class="customize-control ..."> so label disappears too
                const customizeControl = field.closest('.customize-control');
                toggleHiddenState(customizeControl, shouldShow, isInitial);

                // 3) If you have a custom wrapper in your control markup
                const webiliaCustomizerControl = field.closest('.wui-sp-customizer-control');
                toggleHiddenState(webiliaCustomizerControl, shouldShow, isInitial);

                // 4) Panel layout wrapper
                const row = field.closest('.wui-sp-panel-field-row');
                toggleHiddenState(row, shouldShow, isInitial);
            });

            hasRun = true;
        }

        const applyConditionalsThrottled = Utils.rafThrottle(applyConditionals);

        function bindGlobalListeners() {
            if (bound) return;
            bound = true;

            Utils.on(document, 'change', applyConditionalsThrottled);
            Utils.on(document, 'input', applyConditionalsThrottled);
        }

        return {
            name: 'ConditionalsModule',
            init(context) {
                if (context !== document) return;
                bindGlobalListeners();
                applyConditionals();
            }
        };
    })();

    // ---------------------------
    // Module: Conditional Level 3 Menus
    // ---------------------------
    const ConditionalLevel3MenusModule = (function () {
        let bound = false;

        function syncTabs() {
            Utils.qsa('.wui-sp-level-3-menu').forEach((menu) => {
                const section = menu.closest('.wui-sp-panel-section');
                if (!section) return;

                Array.prototype.forEach.call(menu.children, (tab) => {
                    const tabId = tab.getAttribute('data-tab');
                    if (!tabId) return;

                    const content = document.getElementById('wui-sp-tab-switcher-' + tabId + '-content');
                    const marker = content ? content.querySelector('.wui-sp-level-3-conditional') : null;
                    const field = marker ? marker.closest('.wui-sp-field') : null;
                    if (!field) return;

                    const hidden = field.classList.contains('is-hidden') || field.classList.contains('is-hiding');
                    tab.hidden = hidden;
                    if (content) content.hidden = hidden;
                });

                const activeTab = menu.querySelector('li.wui-sp-sub-tabs-active');
                if (activeTab && activeTab.hidden) {
                    const fallback = Array.prototype.slice.call(menu.children).find((tab) => !tab.hidden);
                    if (fallback) {
                        const link = fallback.querySelector('a');
                        if (link) link.click();
                    }
                }
            });
        }

        function bind() {
            if (bound) return;
            bound = true;

            Utils.on(document, 'change', syncTabs);
            Utils.on(document, 'input', syncTabs);

            if (typeof MutationObserver === 'function') {
                const observer = new MutationObserver(syncTabs);
                observer.observe(document.body, {subtree: true, attributes: true, attributeFilter: ['class']});
            }
        }

        return {
            name: 'ConditionalLevel3MenusModule',
            init(context) {
                if (context !== document) return;
                bind();
                syncTabs();
            }
        };
    })();

    // ---------------------------
    // Module: Color Pickers
    // ---------------------------


    // ---------------------------
    // Module: Color Inheritance
    // ---------------------------
    const ColorInheritanceModule = (function () {
        let bound = false;
        const originMap = new Map();
        const originValueMap = new Map();

        function addOrigin(origin, field) {
            if (!origin) return;
            if (!originMap.has(origin)) originMap.set(origin, new Set());
            originMap.get(origin).add(field);
        }

        function collectOrigins(root) {
            Utils.qsa('.wui-sp-field[data-wui-sp-color-origin]', root).forEach((field) => {
                const origin = field.getAttribute('data-wui-sp-color-origin') || '';
                if (origin === '') return;
                addOrigin(origin, field);
            });
        }

        function findColorInput(field) {
            if (!field) return null;
            return field.querySelector('input.wui-sp-colorpicker, input.wui-sp-colorpicker-rgba');
        }

        function setColorValue(input, value) {
            if (!input) return;
            const next = value || '';

            if (options.setColor && options.setColor(input, next)) return;

            input.value = next;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }

        function syncOriginValue(origin) {
            if (!origin || originValueMap.has(origin)) return;
            const originField = document.querySelector('.wui-sp-field[data-field-id="' + Utils.cssEscape(origin) + '"]');
            if (!originField) return;
            const originInput = findColorInput(originField);
            if (!originInput) return;
            originValueMap.set(origin, originInput.value || '');
        }

        function syncOriginValues() {
            originMap.forEach((fields, origin) => {
                syncOriginValue(origin);
            });
        }

        function onMasterChange(e) {
            const target = e.target;
            if (!target || !target.classList) return;
            if (!target.classList.contains('wui-sp-colorpicker') && !target.classList.contains('wui-sp-colorpicker-rgba')) return;

            const field = target.closest('.wui-sp-field');
            if (!field) return;

            const masterId = field.getAttribute('data-field-id') || '';
            if (!masterId || !originMap.has(masterId)) return;

            const linkedFields = originMap.get(masterId);
            if (!linkedFields || !linkedFields.size) return;

            const previousValue = originValueMap.has(masterId) ? originValueMap.get(masterId) : (target.value || '');
            const value = target.value || '';
            linkedFields.forEach((linkedField) => {
                if (!linkedField || linkedField === field) return;
                const linkedInput = findColorInput(linkedField);
                if (!linkedInput) return;
                const linkedValue = linkedInput.value || '';
                if (linkedValue !== '' && linkedValue !== previousValue) return;
                setColorValue(linkedInput, value);
            });
            originValueMap.set(masterId, value);
        }

        function init(context) {
            collectOrigins(context || document);
            syncOriginValues();

            if (bound) return;
            bound = true;

            Utils.on(document, 'input', onMasterChange);
            Utils.on(document, 'change', onMasterChange);
        }

        return {
            name: 'ColorInheritanceModule',
            init(context) {
                init(context);
            }
        };
    })();

    // ---------------------------
    // Module: Tabs
    // ---------------------------
    const TabsModule = (function () {
        function initTabbedFields(context) {
            const root = context || document;

            Utils.qsa('.wui-sp-tabbed', root).forEach((wrapper) => {
                const group = wrapper.getAttribute('data-tab-group') || '';
                if (!group) return;

                const buttons = wrapper.querySelectorAll('.wui-sp-tabbed-link');
                if (!buttons.length) return;

                function setActiveTab(tabKey) {
                    if (!tabKey) return;

                    Array.prototype.forEach.call(buttons, (button) => {
                        const isActive = button.getAttribute('data-tab') === tabKey;
                        const item = button.closest('.wui-sp-tabbed-item');
                        if (item) item.classList.toggle('lsd-sub-tabs-active', isActive);
                        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
                        button.setAttribute('tabindex', isActive ? '0' : '-1');
                    });

                    // Customizer, fields are siblings (<li>), so scope must be the section content
                    const scope =
                        wrapper.closest('.accordion-section-content') ||
                        wrapper.closest('.customize-pane-child') ||
                        wrapper.closest('.control-section') ||
                        wrapper.closest('.wui-sp-panel-section') ||
                        document;

                    const selector =
                        '.wui-sp-field[data-wui-sp-tab-group="' +
                        Utils.cssEscape(group) +
                        '"][data-wui-sp-tab]';

                    Utils.qsa(selector, scope).forEach((field) => {
                        const fieldTab = field.getAttribute('data-wui-sp-tab') || '';
                        const shouldShow = fieldTab === tabKey;

                        // Keep your existing behavior
                        field.classList.toggle('is-tab-hidden', !shouldShow);

                        // Customizer: hide the whole control <li>
                        const customizeControl = field.closest('.customize-control');
                        if (customizeControl) {
                            customizeControl.classList.toggle('is-tab-hidden', !shouldShow);
                        }

                        // Optional: also hide your internal wrapper
                        const webiliaControl = field.closest('.wui-sp-customizer-control');
                        if (webiliaControl) {
                            webiliaControl.classList.toggle('is-tab-hidden', !shouldShow);
                        }

                        // Panel
                        const row = field.closest('.wui-sp-panel-field-row');
                        if (row) row.classList.toggle('is-tab-hidden', !shouldShow);
                    });
                }

                const defaultTab = wrapper.getAttribute('data-default-tab') || '';
                let initialTab = '';

                Array.prototype.forEach.call(buttons, (button) => {
                    const item = button.closest('.wui-sp-tabbed-item');
                    if (item && item.classList.contains('lsd-sub-tabs-active')) {
                        initialTab = button.getAttribute('data-tab') || '';
                    }
                });

                if (!initialTab) initialTab = defaultTab || (buttons[0].getAttribute('data-tab') || '');
                setActiveTab(initialTab);

                Array.prototype.forEach.call(buttons, (button) => {
                    button.addEventListener('click', function (event) {
                        event.preventDefault();
                        setActiveTab(button.getAttribute('data-tab') || '');
                    });
                });
            });
        }

        return {
            name: 'TabsModule',
            init(context) {
                initTabbedFields(context);
            }
        };
    })();

    // ---------------------------
    // Module: Sliders
    // ---------------------------
    const SlidersModule = (function () {
        function updateSliderValue(slider) {
            if (!slider) return;
            const wrapper = slider.closest('.wui-sp-slider');
            if (!wrapper) return;
            const output = wrapper.querySelector('.wui-sp-slider-value');
            if (!output) return;
            output.textContent = slider.value;
            output.setAttribute('data-value', slider.value);
        }

        function initSliders(context) {
            const root = context || document;
            Utils.qsa('.wui-sp-slider input[type="range"]', root).forEach((input) => {
                updateSliderValue(input);
                input.addEventListener('input', function () {
                    updateSliderValue(input);
                });
            });
        }

        return {
            name: 'SlidersModule',
            init(context) {
                initSliders(context);
            }
        };
    })();

    // ---------------------------
    // Module: Typography (works in both panel + customizer)
    // ---------------------------
    const TypographyModule = (function () {
        function initTypography(context) {
            const root = context || document;

            Utils.qsa('.wui-sp-typography', root).forEach((wrapper) => {
                ColorPickersModule.initPickers(wrapper);
            });
        }

        return {
            name: 'TypographyModule',
            init(context) {
                initTypography(context);
            }
        };
    })();

    // ---------------------------
    // Module: Sortables (works in both panel + customizer)
    // ---------------------------


    // ---------------------------
    // Module: Media Fields (panel only)
    // ---------------------------


    // ---------------------------
    // Module: Gallery Fields (panel only)
    // ---------------------------


    // ---------------------------
    // Module: Repeaters (panel only)
    // ---------------------------
    const RepeatersModule = (function () {
        function parseJsonArray(value) {
            if (!value) return [];
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                return null;
            }
        }

        function updateRepeaterMediaPreview(input) {
            if (!input) return;
            const wrapper = input.closest('.wui-sp-repeater-media');
            if (!wrapper) return;
            const preview = wrapper.querySelector('.wui-sp-repeater-media-preview img');
            if (!preview) return;

            if (input.value) {
                preview.setAttribute('src', input.value);
                wrapper.classList.add('has-media');
            } else {
                preview.setAttribute('src', '');
                wrapper.classList.remove('has-media');
            }
        }

        function initRepeaters(context, app) {
            if (app.isCustomizer) return;

            const scope = context || document;

            Utils.qsa('.wui-sp-repeater-wrapper', scope).forEach((wrapper) => {
                if (wrapper.classList.contains('is-enhanced')) return;

                const textarea = wrapper.querySelector('textarea.wui-sp-repeater');
                if (!textarea) return;

                const fieldsRaw = wrapper.getAttribute('data-fields') || '';
                const labelsRaw = wrapper.getAttribute('data-labels') || '';

                let fields = [];
                let labels = {};
                let fieldDefs = [];

                try {
                    fields = JSON.parse(fieldsRaw) || [];
                } catch (e) {
                    fields = [];
                }

                try {
                    labels = JSON.parse(labelsRaw) || {};
                } catch (e) {
                    labels = {};
                }

                if (!fields.length) return;

                const data = parseJsonArray(textarea.value);
                if (data === null) return;

                const list = wrapper.querySelector('.wui-sp-repeater-items');
                if (!list) return;

                if (fields.length && typeof fields[0] === 'object' && fields[0] && fields[0].key) {
                    fieldDefs = fields;
                } else {
                    fieldDefs = fields.map(function (key) {
                        const k = String(key);
                        return { key: k, label: labels[k] || k, type: 'text' };
                    });
                }

                if (!fieldDefs.length) return;

                function buildItem(values) {
                    const item = document.createElement('div');
                    item.className = 'wui-sp-repeater-item';

                    const header = document.createElement('div');
                    header.className = 'wui-sp-repeater-item-header';

                    const handle = document.createElement('span');
                    handle.className = 'wui-sp-repeater-handle';
                    handle.innerHTML =
                        '<i class="fas fa-arrows-alt" aria-hidden="true"></i><span class="screen-reader-text">Drag</span>';
                    header.appendChild(handle);

                    const remove = document.createElement('button');
                    remove.type = 'button';
                    remove.className = 'wui-sp-text-button wui-sp-repeater-remove';
                    remove.textContent = 'Remove';
                    header.appendChild(remove);

                    const fieldsWrap = document.createElement('div');
                    fieldsWrap.className = 'wui-sp-repeater-fields';

                    fieldDefs.forEach(function (field) {
                        const key = field.key || '';
                        if (!key) return;

                        const row = document.createElement('div');
                        row.className = 'wui-sp-repeater-field';

                        const label = document.createElement('label');
                        label.textContent = field.label || key;
                        row.appendChild(label);

                        if (field.type === 'select') {
                            const select = document.createElement('select');
                            select.className = 'wui-sp-repeater-select';
                            select.setAttribute('data-field', key);

                            const options = field.options || {};
                            Object.keys(options).forEach(function (optionKey) {
                                const option = document.createElement('option');
                                option.value = optionKey;
                                option.textContent = options[optionKey];
                                select.appendChild(option);
                            });

                            select.value = values && values[key] !== undefined ? String(values[key]) : '';
                            row.appendChild(select);
                        } else if (field.type === 'media') {
                            const mediaWrap = document.createElement('div');
                            mediaWrap.className = 'wui-sp-repeater-media';

                            const mediaPreview = document.createElement('div');
                            mediaPreview.className = 'wui-sp-repeater-media-preview';
                            const previewImg = document.createElement('img');
                            previewImg.setAttribute('alt', '');
                            mediaPreview.appendChild(previewImg);
                            mediaWrap.appendChild(mediaPreview);

                            const mediaInputRow = document.createElement('div');
                            mediaInputRow.className = 'wui-sp-repeater-media-input';

                            const input = document.createElement('input');
                            input.type = 'text';
                            input.className = 'wui-sp-repeater-media-url';
                            input.setAttribute('data-field', key);
                            input.setAttribute('placeholder', 'Image URL');
                            input.value = values && values[key] !== undefined ? String(values[key]) : '';

                            const selectButton = document.createElement('button');
                            selectButton.type = 'button';
                            selectButton.className = 'wui-sp-secondary-button wui-sp-repeater-media-select';
                            selectButton.textContent = 'Select';

                            const removeButton = document.createElement('button');
                            removeButton.type = 'button';
                            removeButton.className = 'wui-sp-text-button wui-sp-repeater-media-remove';
                            removeButton.textContent = 'Remove';

                            mediaInputRow.appendChild(input);
                            mediaInputRow.appendChild(selectButton);
                            mediaInputRow.appendChild(removeButton);

                            mediaWrap.appendChild(mediaInputRow);
                            row.appendChild(mediaWrap);

                            updateRepeaterMediaPreview(input);
                        } else {
                            const text = document.createElement('input');
                            text.type = 'text';
                            text.className = 'wui-sp-repeater-input';
                            text.setAttribute('data-field', key);
                            text.value = values && values[key] !== undefined ? String(values[key]) : '';
                            row.appendChild(text);
                        }

                        fieldsWrap.appendChild(row);
                    });

                    item.appendChild(header);
                    item.appendChild(fieldsWrap);
                    return item;
                }

                function sync() {
                    const items = [];
                    Array.prototype.forEach.call(list.querySelectorAll('.wui-sp-repeater-item'), function (item) {
                        const row = {};
                        Array.prototype.forEach.call(item.querySelectorAll('[data-field]'), function (input) {
                            const key = input.getAttribute('data-field') || '';
                            if (!key) return;
                            row[key] = input.value;
                        });
                        items.push(row);
                    });
                    textarea.value = JSON.stringify(items);
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                }

                list.innerHTML = '';
                data.forEach(function (item) {
                    list.appendChild(buildItem(item));
                });

                wrapper.classList.add('is-enhanced');

                wrapper.addEventListener('input', function (e) {
                    if (!e.target || !e.target.getAttribute('data-field')) return;
                    if (e.target.classList.contains('wui-sp-repeater-media-url')) {
                        updateRepeaterMediaPreview(e.target);
                    }
                    sync();
                });

                wrapper.addEventListener('change', function (e) {
                    if (!e.target || !e.target.getAttribute('data-field')) return;
                    sync();
                });

                wrapper.addEventListener('click', function (e) {
                    const remove = e.target.closest('.wui-sp-repeater-remove');
                    if (remove) {
                        const item = remove.closest('.wui-sp-repeater-item');
                        if (item) item.remove();
                        sync();
                        return;
                    }

                    const mediaSelect = e.target.closest('.wui-sp-repeater-media-select');
                    if (mediaSelect && options.selectMedia) {
                        const mediaWrap = mediaSelect.closest('.wui-sp-repeater-media');
                        const input = mediaWrap && mediaWrap.querySelector('.wui-sp-repeater-media-url');
                        if (!input) return;
                        options.selectMedia({ title: 'Select Image', button: { text: 'Use this image' }, multiple: false }, function (data) {
                            input.value = data.url || '';
                            updateRepeaterMediaPreview(input);
                            sync();
                        });
                        return;
                    }

                    const mediaRemove = e.target.closest('.wui-sp-repeater-media-remove');
                    if (mediaRemove) {
                        const wrap = mediaRemove.closest('.wui-sp-repeater-media');
                        if (!wrap) return;
                        const urlInput = wrap.querySelector('.wui-sp-repeater-media-url');
                        if (!urlInput) return;
                        urlInput.value = '';
                        updateRepeaterMediaPreview(urlInput);
                        sync();
                        return;
                    }

                    const add = e.target.closest('.wui-sp-repeater-add');
                    if (add) {
                        list.appendChild(buildItem({}));
                        sync();
                    }
                });

                if (options.sortable) options.sortable(list, sync);

            });
        }

        return {
            name: 'RepeatersModule',
            init(context, app) {
                initRepeaters(context, app);
            }
        };
    })();

    // ---------------------------
    // Module: Import/Export (panel only)
    // ---------------------------
    const ImportExportModule = (function () {
        let bound = false;

        function initImportExport(app) {
            if (app.isCustomizer) return;
            if (bound) return;
            bound = true;

            document.addEventListener(
                'click',
                function (e) {
                    const button = e.target.closest('.wui-sp-import-file-button');
                    if (!button) return;

                    e.preventDefault();
                    const targetId = button.getAttribute('data-file-target');
                    const input = document.getElementById(targetId);
                    if (input) input.click();
                },
                true
            );

            document.addEventListener('change', function (e) {
                const input = e.target;
                if (!input || !input.classList.contains('wui-sp-import-file')) return;

                const file = input.files && input.files.length ? input.files[0] : null;
                if (!file) return;

                const wrapper = input.closest('.wui-sp-import-export');
                if (!wrapper) return;

                const textarea = wrapper.querySelector('textarea[name*="[import]"]');
                if (!textarea) return;

                const reader = new FileReader();
                reader.onload = function (evt) {
                    textarea.value = evt.target && typeof evt.target.result === 'string' ? evt.target.result : '';
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    textarea.dispatchEvent(new Event('change', { bubbles: true }));
                    input.value = '';
                };

                reader.readAsText(file);
            });

            document.addEventListener(
                'click',
                function (e) {
                    const button = e.target.closest('.wui-sp-export-json');
                    if (!button) return;

                    e.preventDefault();

                    const targetId = button.getAttribute('data-export-target');
                    if (!targetId) return;

                    const textarea = document.getElementById(targetId);
                    let content = textarea ? textarea.value : '';
                    if (!content) content = '{}';

                    try {
                        JSON.parse(content);
                    } catch (err) {
                        const message = labels.invalidJson;
                        if (window.WebiliaUI && window.WebiliaUI.toast) {
                            window.WebiliaUI.toast.show(message, {
                                root: webiliaSettingsToastRoot(),
                                tone: 'danger',
                                position: document.documentElement && document.documentElement.getAttribute('dir') === 'rtl' ? 'bottom-left' : 'bottom-right',
                                durationMs: 7000,
                                progress: true,
                                closeLabel: labels.closeLabel
                            });
                        } else {
                            window.alert(message);
                        }
                        return;
                    }

                    const filename = button.getAttribute('data-export-filename') || 'settings.json';
                    const blob = new Blob([content], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    URL.revokeObjectURL(url);
                },
                true
            );
        }

        return {
            name: 'ImportExportModule',
            init(context, app) {
                if (context !== document) return;
                initImportExport(app);
            }
        };
    })();

    // ---------------------------
    // Module: Panel Themes (panel only)
    // ---------------------------
    const PanelThemesModule = (function () {
        let bound = false;

        function parsePanelThemes(wrapper) {
            if (!wrapper) return null;
            const raw = wrapper.getAttribute('data-panel-themes');
            if (!raw) return null;
            try {
                return JSON.parse(raw);
            } catch (e) {
                return null;
            }
        }

        function applyPanelTheme(wrapper, themeKey) {
            const panel = document.querySelector('.wui-sp-panel');
            if (!panel) return;

            const themes = parsePanelThemes(wrapper);
            if (!themes || !themes[themeKey] || !themes[themeKey].vars) return;
            const vars = themes[themeKey].vars;

            Object.keys(vars).forEach(function (key) {
                panel.style.setProperty(key, String(vars[key]));
            });
        }

        function renderPanelThemePreview(preview, theme) {
            if (!preview || !theme || !theme.vars) return;

            const vars = theme.vars;
            const keys = ['--webilia-panel-bg', '--webilia-panel-card', '--webilia-panel-border', '--webilia-panel-accent', '--webilia-panel-accent-2'];
            const items = keys
            .map(function (key) {
                const value = vars[key] || '';
                if (!value) return '';
                return '<span class="wui-sp-panel-theme-swatch" style="background:' + value + '"></span>';
            })
            .join('');

            preview.innerHTML = items || '';
        }

        function initPanelThemes(app) {
            if (app.isCustomizer) return;

            // render previews + apply selected on load
            Utils.qsa('.wui-sp-field-type-panel_theme', document).forEach((wrapper) => {
                const themes = parsePanelThemes(wrapper);

                Utils.qsa('.wui-sp-panel-theme-preview', wrapper).forEach((preview) => {
                    const themeKey = preview.getAttribute('data-theme-key');
                    if (!themeKey) return;
                    if (!themes || !themes[themeKey]) return;
                    renderPanelThemePreview(preview, themes[themeKey]);
                });

                const selected = wrapper.querySelector('input[type="radio"]:checked');
                const current = selected ? selected.value : '';
                if (current) applyPanelTheme(wrapper, current);
            });

            if (bound) return;
            bound = true;

            document.addEventListener('change', function (e) {
                const input = e.target;
                if (!input || input.type !== 'radio') return;

                const wrapper = input.closest('.wui-sp-field-type-panel_theme');
                if (!wrapper) return;

                applyPanelTheme(wrapper, input.value);
            });
        }

        return {
            name: 'PanelThemesModule',
            init(context, app) {
                if (context !== document) return;
                initPanelThemes(app);
            }
        };
    })();

    // ---------------------------
    // Module: Button Preview (panel + customizer)
    // ---------------------------
    const ButtonPreviewModule = (function () {
        let bound = false;

        function parsePreviewData(wrapper) {
            if (!wrapper) return null;
            if (wrapper._webiliaButtonPreview) return wrapper._webiliaButtonPreview;

            const raw = wrapper.getAttribute('data-button-preview');
            if (!raw) return null;

            let data = null;
            try {
                data = JSON.parse(raw);
            } catch (e) {
                return null;
            }

            if (!data || typeof data !== 'object') return null;

            data.fields = data.fields && typeof data.fields === 'object' ? data.fields : {};
            data.fieldIds = Object.keys(data.fields)
                .map((key) => data.fields[key])
                .filter((value) => typeof value === 'string' && value !== '');

            data.buttonId = wrapper.getAttribute('data-button-preview-id') || '';
            data.buttonEl = wrapper.querySelector('.wui-sp-button-preview-button');
            if (!data.buttonId && data.buttonEl && data.buttonEl.id) data.buttonId = data.buttonEl.id;
            data.styleEl = wrapper.querySelector('style[data-preview-style]');

            wrapper._webiliaButtonPreview = data;
            return data;
        }

        function getFieldWrapper(fieldId) {
            if (!fieldId) return null;
            return document.querySelector('.wui-sp-field[data-field-id="' + Utils.cssEscape(fieldId) + '"]');
        }

        function readSimpleValue(fieldId) {
            const wrapper = getFieldWrapper(fieldId);
            if (!wrapper) return '';

            const radios = wrapper.querySelectorAll('input[type="radio"]');
            if (radios.length) {
                const checked = wrapper.querySelector('input[type="radio"]:checked');
                return checked ? checked.value : '';
            }

            const select = wrapper.querySelector('select');
            if (select) return select.value;

            const input = wrapper.querySelector('input');
            if (input) return input.value;

            const textarea = wrapper.querySelector('textarea');
            if (textarea) return textarea.value;

            return '';
        }

        function readBorderValue(fieldId) {
            const wrapper = getFieldWrapper(fieldId);
            if (!wrapper) return null;

            const border = {
                top: '',
                right: '',
                bottom: '',
                left: '',
                style: '',
                color: ''
            };

            const inputs = wrapper.querySelectorAll('input.wui-sp-border-input');
            Array.prototype.forEach.call(inputs, function (input) {
                const name = input.name || '';
                if (name.indexOf('[border-top]') !== -1) border.top = input.value;
                if (name.indexOf('[border-right]') !== -1) border.right = input.value;
                if (name.indexOf('[border-bottom]') !== -1) border.bottom = input.value;
                if (name.indexOf('[border-left]') !== -1) border.left = input.value;
            });

            const styleSelect = wrapper.querySelector('select');
            if (styleSelect) border.style = styleSelect.value;

            const colorInput = wrapper.querySelector('input.wui-sp-colorpicker, input.wui-sp-colorpicker-rgba');
            if (colorInput) border.color = colorInput.value;

            return border;
        }

        function normalizeSize(value, fallback) {
            if (value === undefined || value === null || value === '') return fallback || '';
            const raw = String(value).trim();
            if (raw === '') return fallback || '';
            if (/[a-z%]+$/i.test(raw)) return raw;
            const num = parseFloat(raw);
            if (Number.isNaN(num)) return fallback || '';
            return num + 'px';
        }

        function borderIsEmpty(border) {
            if (!border) return true;
            return !border.top && !border.right && !border.bottom && !border.left && !border.style && !border.color;
        }

        function buildBorderCss(border) {
            if (!border || borderIsEmpty(border)) return 'border: none;';

            const style = border.style || 'none';
            if (style === 'none') return 'border: none;';

            const color = border.color || 'transparent';
            const top = normalizeSize(border.top, '0px');
            const right = normalizeSize(border.right, top);
            const bottom = normalizeSize(border.bottom, top);
            const left = normalizeSize(border.left, top);

            return 'border-top:' + top + ' ' + style + ' ' + color + ';' +
                'border-right:' + right + ' ' + style + ' ' + color + ';' +
                'border-bottom:' + bottom + ' ' + style + ' ' + color + ';' +
                'border-left:' + left + ' ' + style + ' ' + color + ';';
        }

        function buildBackground(normal, secondary, fallback) {
            const primary = normal || fallback || '';
            const second = secondary || '';
            if (primary && second) {
                return 'linear-gradient(90deg, ' + primary + ' 0%, ' + second + ' 100%)';
            }
            return primary || fallback || '';
        }

        function updatePreview(wrapper) {
            const data = parsePreviewData(wrapper);
            if (!data || !data.buttonId || !data.styleEl) return;

            const fields = data.fields || {};
            const bg = readSimpleValue(fields.bg);
            const bg2 = readSimpleValue(fields.bg2);
            const text = readSimpleValue(fields.text);
            const radius = readSimpleValue(fields.radius);
            const border = readBorderValue(fields.border);

            const hoverBg = readSimpleValue(fields.hover_bg);
            const hoverBg2 = readSimpleValue(fields.hover_bg2);
            const hoverText = readSimpleValue(fields.hover_text);
            const hoverBorder = readBorderValue(fields.hover_border);

            const normalBg = buildBackground(bg, bg2, 'var(--webilia-panel-accent)');
            const hoverBgStyle = buildBackground(hoverBg, hoverBg2, normalBg);

            const normalColor = text || '#ffffff';
            const hoverColor = hoverText || normalColor;

            const normalBorder = buildBorderCss(border);
            const hoverBorderCss = borderIsEmpty(hoverBorder) ? normalBorder : buildBorderCss(hoverBorder);

            const radiusValue = normalizeSize(radius, '8px');
            const cssId = Utils.cssEscape(data.buttonId);

            data.styleEl.textContent =
                '#' + cssId + '{' +
                'background:' + normalBg + ';' +
                'color:' + normalColor + ';' +
                normalBorder +
                'border-radius:' + radiusValue + ';' +
                '}' +
                '#' + cssId + ':hover{' +
                'background:' + hoverBgStyle + ';' +
                'color:' + hoverColor + ';' +
                hoverBorderCss +
                '}';
        }

        function initButtonPreviews(context) {
            const root = context || document;
            Utils.qsa('.wui-sp-button-preview', root).forEach((wrapper) => {
                if (wrapper._webiliaButtonPreviewBound) return;
                wrapper._webiliaButtonPreviewBound = true;
                parsePreviewData(wrapper);
                updatePreview(wrapper);
            });
        }

        function handleFieldChange(e) {
            const target = e.target;
            if (!target) return;

            const field = target.closest('.wui-sp-field');
            if (!field) return;
            const fieldId = field.getAttribute('data-field-id');
            if (!fieldId) return;

            Utils.qsa('.wui-sp-button-preview', document).forEach((wrapper) => {
                const data = parsePreviewData(wrapper);
                if (!data || !data.fieldIds || data.fieldIds.indexOf(fieldId) === -1) return;
                updatePreview(wrapper);
            });
        }

        function bindEvents() {
            if (bound) return;
            bound = true;

            document.addEventListener('input', handleFieldChange);
            document.addEventListener('change', handleFieldChange);
        }

        return {
            name: 'ButtonPreviewModule',
            init(context) {
                initButtonPreviews(context);
                if (context === document) bindEvents();
            }
        };
    })();

    // ---------------------------
    // Module: Button Preview Layout (panel only)
    // ---------------------------
    const ButtonPreviewLayoutModule = (function () {
        let bound = false;

        function buildCard(labelText, fieldEl) {
            const card = document.createElement('div');
            card.className = 'wui-sp-button-preview-card';

            if (labelText) {
                const title = document.createElement('div');
                title.className = 'wui-sp-button-preview-title';
                title.textContent = labelText;
                card.appendChild(title);
            }

            if (fieldEl) card.appendChild(fieldEl);
            return card;
        }

        function applySectionLayout(section) {
            if (!section) return;
            const fieldsContainer = section.querySelector('.wui-sp-panel-fields');
            if (fieldsContainer) {
                let sections = Array.prototype.slice.call(fieldsContainer.querySelectorAll(':scope > .wui-sp-setting-section'));

                if (!sections.length) {
                    sections = Array.prototype.slice.call(fieldsContainer.querySelectorAll(':scope > .wui-sp-tab-switcher-content > .wui-sp-setting-section'));
                }

                if (!sections.length) {
                    const fallbackSection = document.createElement('div');
                    fallbackSection.className = 'wui-sp-setting-section';
                    const fallbackAside = document.createElement('aside');
                    fallbackAside.className = 'wui-sp-setting-section-aside';
                    const fallbackContent = document.createElement('div');
                    fallbackContent.className = 'wui-sp-setting-section-content';
                    fieldsContainer.parentNode.insertBefore(fallbackSection, fieldsContainer);
                    fallbackSection.appendChild(fallbackAside);
                    fallbackSection.appendChild(fallbackContent);
                    fallbackContent.appendChild(fieldsContainer);
                    sections = [fallbackSection];
                }

                sections.forEach((sectionBlock) => {
                    const content = sectionBlock.querySelector(':scope > .wui-sp-setting-section-content');
                    if (!content) return;

                    const previewRows = Array.prototype.slice.call(content.querySelectorAll('.wui-sp-panel-field-row')).filter((row) => {
                        return !!row.querySelector('.wui-sp-field-type-button_preview');
                    });
                    if (!previewRows.length) return;

                    let aside = sectionBlock.querySelector(':scope > .wui-sp-setting-section-aside');
                    if (!aside) {
                        aside = document.createElement('aside');
                        aside.className = 'wui-sp-setting-section-aside';
                        sectionBlock.insertBefore(aside, sectionBlock.firstChild);
                    }

                    previewRows.forEach((row) => {
                        const field = row.querySelector('.wui-sp-field-type-button_preview');
                        if (!field) return;

                        const labelEl = row.querySelector('.wui-sp-panel-field-label');
                        const label = labelEl ? labelEl.textContent.trim() : '';
                        const card = buildCard(label, field);
                        aside.appendChild(card);
                        row.parentNode.removeChild(row);
                    });
                });

                return;
            }

            return;
        }

        function initLayout(app) {
            if (app.isCustomizer) return;
            if (bound) return;
            bound = true;

            Utils.qsa('.wui-sp-panel-section', document).forEach((section) => applySectionLayout(section));
        }

        return {
            name: 'ButtonPreviewLayoutModule',
            init(context, app) {
                if (context !== document) return;
                initLayout(app);
            }
        };
    })();

    // ---------------------------
    // Module: Nav Position (panel only)
    // ---------------------------
    const NavPositionModule = (function () {
        let bound = false;

        function initNavPosition(app) {
            if (app.isCustomizer) return;
            if (bound) return;
            bound = true;

            function animateNavPosition(panel, value) {
                if (!panel) return;

                const current = panel.getAttribute('data-wui-sp-nav-position') || '';
                if (current === value) return;

                const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                const nav = panel.querySelector('.wui-sp-panel-nav');
                const content = panel.querySelector('.wui-sp-panel-content');

                if (!nav || !content || prefersReduced) {
                    panel.setAttribute('data-wui-sp-nav-position', value);
                    return;
                }

                const items = [nav, content];
                const first = items.map((item) => item.getBoundingClientRect());

                panel.setAttribute('data-wui-sp-nav-position', value);

                const last = items.map((item) => item.getBoundingClientRect());

                items.forEach((item, index) => {
                    const dx = first[index].left - last[index].left;
                    const dy = first[index].top - last[index].top;
                    if (!dx && !dy) return;

                    if (item._webiliaNavAnim) item._webiliaNavAnim.cancel();

                    item.style.willChange = 'transform';
                    const anim = item.animate(
                        [{ transform: 'translate(' + dx + 'px, ' + dy + 'px)' }, { transform: 'translate(0, 0)' }],
                        { duration: 300, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
                    );

                    item._webiliaNavAnim = anim;

                    anim.addEventListener('finish', function () {
                        item.style.willChange = '';
                        if (item._webiliaNavAnim === anim) item._webiliaNavAnim = null;
                    });
                    anim.addEventListener('cancel', function () {
                        item.style.willChange = '';
                        if (item._webiliaNavAnim === anim) item._webiliaNavAnim = null;
                    });
                });
            }

            function applyPosition(value) {
                const panel = document.querySelector('.wui-sp-panel');
                if (!panel) return;
                animateNavPosition(panel, value);
            }

            document.addEventListener('change', function (e) {
                const select = e.target;
                if (!select || select.tagName !== 'SELECT') return;

                if (select.name && select.name.indexOf('[panel_nav_position]') !== -1) {
                    applyPosition(select.value);
                    return;
                }

                const field = select.closest('.wui-sp-field');
                if (!field) return;

                const fieldId = field.getAttribute('data-field-id');
                if (fieldId && fieldId === 'panel_nav_position') {
                    applyPosition(select.value);
                }
            });

            document.addEventListener('change', function (e) {
                const input = e.target;
                if (!input || input.type !== 'radio') return;

                if (input.name && input.name.indexOf('[panel_nav_position]') !== -1) {
                    applyPosition(input.value);
                    return;
                }

                const field = input.closest('.wui-sp-field');
                if (!field) return;

                const fieldId = field.getAttribute('data-field-id');
                if (fieldId && fieldId === 'panel_nav_position') {
                    applyPosition(input.value);
                }
            });
        }

        return {
            name: 'NavPositionModule',
            init(context, app) {
                if (context !== document) return;
                initNavPosition(app);
            }
        };
    })();

    // ---------------------------
    // Module: Ajax Actions (panel save/reset, panel only)
    // ---------------------------


    // ---------------------------
    // Module: Google Maps (works in both panel + customizer)
    // ---------------------------
    const GoogleMapsModule = (function () {
        function initGoogleMaps(context) {
            const root = context || document;

            Utils.qsa('.wui-sp-google-maps', root).forEach((wrapper) => {
                const address = wrapper.querySelector('input[name$="[address]"]');
                const lat = wrapper.querySelector('input[name$="[lat]"]');
                const lng = wrapper.querySelector('input[name$="[lng]"]');
                const preview = wrapper.querySelector('.wui-sp-google-map-preview iframe');

                if (!preview) return;

                function update() {
                    let query = '';
                    const latVal = lat ? lat.value.trim() : '';
                    const lngVal = lng ? lng.value.trim() : '';
                    const addressVal = address ? address.value.trim() : '';

                    if (latVal && lngVal) {
                        query = latVal + ',' + lngVal;
                    } else if (addressVal) {
                        query = addressVal;
                    }

                    if (!query) {
                        preview.removeAttribute('src');
                        if (preview.parentElement) preview.parentElement.setAttribute('data-empty', '1');
                        return;
                    }

                    preview.setAttribute('src', 'https://maps.google.com/maps?q=' + encodeURIComponent(query) + '&z=14&output=embed');
                    if (preview.parentElement) preview.parentElement.removeAttribute('data-empty');
                }

                update();
                if (address) address.addEventListener('input', update);
                if (lat) lat.addEventListener('input', update);
                if (lng) lng.addEventListener('input', update);
            });
        }

        return {
            name: 'GoogleMapsModule',
            init(context) {
                initGoogleMaps(context);
            }
        };
    })();

    // ---------------------------
    // Module: Customizer Bindings (shared init pipeline, no duplicate manual calls)
    // ---------------------------


    // ---------------------------
    // Module: Customizer Structured Fields (border)
    // ---------------------------


    // ---------------------------
    // Bootstrap + Module registration
    // ---------------------------
    const app = new WebiliaApp();

    // Core modules
    app.register(NavModule);
    app.register(Level3MenusModule);
    app.register(ConditionalsModule);
    app.register(ConditionalLevel3MenusModule);
    app.register(ColorInheritanceModule);
    app.register(TabsModule);
    app.register(SlidersModule);
    app.register(TypographyModule);
    app.register(GoogleMapsModule);
    app.register(RepeatersModule);
    app.register(ImportExportModule);
    app.register(PanelThemesModule);
    app.register(ButtonPreviewModule);
    app.register(ButtonPreviewLayoutModule);
    app.register(NavPositionModule);

    instance = { app, Utils, webiliaSettingsToastRoot };
    return instance;
}
