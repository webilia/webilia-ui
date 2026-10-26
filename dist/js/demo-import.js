(function (global) {
  global.WebiliaUI = global.WebiliaUI || {};
  if (global.WebiliaUI.demoImport) return;
var __wuiModule = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // assets/js/demo-import.js
  var demo_import_exports = {};
  __export(demo_import_exports, {
    init: () => init
  });
  var initialized = /* @__PURE__ */ new WeakSet();
  var pluginControlId = 0;
  function init(root, options = {}) {
    if (!root || initialized.has(root)) return;
    const jq = options.jquery;
    if (!jq) throw new Error("Demo Import UI requires the host jQuery adapter.");
    const $ = (selector) => typeof selector === "string" && !/^\s*</.test(selector) ? jq(root).find(selector).addBack(selector) : jq(selector);
    initialized.add(root);
    "use strict";
    let currentImport = null;
    let isImportRunning = false;
    const i18n = options.labels || {};
    const dom = {
      page: $(".js-wui-di-page"),
      demoContainer: $(".js-wui-sp-demo-container"),
      searchInput: $(".js-wui-sp-demo-search"),
      navLinks: $(".js-wui-sp-demo-nav-link"),
      stepNav: $(".js-wui-di-step-nav"),
      stepPanels: $(".js-wui-di-step-panel"),
      importButtons: $(".js-wui-di-import-button"),
      setupContinueButton: $(".js-wui-di-setup-continue"),
      setupBackButton: $(".js-wui-di-setup-back"),
      pluginRestartButton: $(".js-wui-di-plugin-restart"),
      contentRestartButton: $(".js-wui-di-content-restart"),
      pluginItemTemplate: $(".js-wui-di-setup-plugin-item-template"),
      pluginEmptyTemplate: $(".js-wui-di-setup-plugins-empty-template"),
      setupDemo: $(".js-wui-di-setup-demo"),
      setupPlugins: $(".js-wui-di-setup-plugins"),
      setupPreviewWrap: $(".js-wui-di-setup-preview-wrap"),
      setupPreviewImage: $(".js-wui-di-setup-preview-image"),
      setupDemoName: $(".js-wui-di-setup-demo-name"),
      setupDemoCategories: $(".js-wui-di-setup-demo-categories"),
      pluginLog: $(".js-wui-di-plugin-log"),
      contentLog: $(".js-wui-di-content-log"),
      pluginStageLabel: $(".js-wui-di-plugin-stage-label"),
      contentStageLabel: $(".js-wui-di-content-stage-label"),
      pluginContext: $(".js-wui-di-plugin-context"),
      contentContext: $(".js-wui-di-content-context"),
      doneTitle: $(".js-wui-di-done-title"),
      doneMessage: $(".js-wui-di-done-message"),
      visitSite: $(".js-wui-di-visit-site"),
      guideLink: $(".js-wui-di-guide-link")
    };
    const doneTitleTemplate = dom.doneTitle.html();
    const doneMessageTemplate = dom.doneMessage.html();
    function t(key) {
      return Object.prototype.hasOwnProperty.call(i18n, key) ? i18n[key] : "";
    }
    function formatString(template, replacements) {
      let formatted = (template || "").toString();
      if (!Array.isArray(replacements) || !replacements.length) return formatted;
      replacements.forEach(function(replacement, index) {
        const numberedToken = new RegExp("%" + (index + 1) + "\\$[sd]", "g");
        formatted = formatted.replace(numberedToken, (replacement || "").toString());
      });
      let replacementIndex = 0;
      return formatted.replace(/%[sd]/g, function() {
        const replacement = replacements[replacementIndex];
        replacementIndex += 1;
        return (replacement || "").toString();
      });
    }
    function pluginStatusMeta(status) {
      if (status === "active") return { text: t("status_active"), badgeClass: "wui-di-success" };
      if (status === "installed") return { text: t("status_installed"), badgeClass: "wui-di-success" };
      if (status === "missing") return { text: t("status_missing"), badgeClass: "wui-di-warning" };
      return { text: t("status_unknown"), badgeClass: "wui-di-neutral" };
    }
    function setPageMode(mode) {
      dom.page.attr("data-page-state", mode);
    }
    function getTimelineItem(step) {
      return dom.page.find('.wui-di__timeline-item[data-step="' + step + '"]');
    }
    function getStepPanel(step) {
      return dom.stepPanels.filter('[data-step="' + step + '"]');
    }
    function setTimelineState(step, state) {
      const $item = getTimelineItem(step);
      if (!$item.length) return;
      $item.removeClass("is-active is-done is-error is-disabled");
      if (state === "active") $item.addClass("is-active");
      else if (state === "done") $item.addClass("is-done");
      else if (state === "error") $item.addClass("is-error");
      else if (state === "disabled") $item.addClass("is-disabled");
    }
    function isStepAvailable(step) {
      return !getTimelineItem(step).hasClass("is-disabled");
    }
    function clearProcessingState() {
      dom.page.find(".wui-di__timeline-item").removeClass("is-processing");
      dom.stepPanels.removeClass("is-entering");
    }
    function setProcessingState(step) {
      clearProcessingState();
      getTimelineItem(step).addClass("is-processing");
    }
    function setActiveStep(step) {
      if (!isStepAvailable(step) && step !== "select") return;
      const $panel = getStepPanel(step);
      dom.stepPanels.removeClass("is-active is-entering").hide();
      $panel.css("display", "flex");
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(function() {
          $panel.addClass("is-active is-entering");
        });
      } else {
        $panel.addClass("is-active is-entering");
      }
      window.setTimeout(function() {
        $panel.removeClass("is-entering");
      }, 380);
      dom.page.find(".wui-di__timeline-item.is-active").removeClass("is-active");
      const $item = getTimelineItem(step);
      if (step !== "done" || !$item.hasClass("is-done") && !$item.hasClass("is-error")) {
        $item.addClass("is-active");
      }
      setPageMode(step);
    }
    function resetTimelineForSelection() {
      setTimelineState("select", "active");
      setTimelineState("setup", "disabled");
      setTimelineState("plugins", "disabled");
      setTimelineState("content", "disabled");
      setTimelineState("done", "disabled");
      setActiveStep("select");
    }
    function resetFooterButtons() {
      dom.importButtons.prop("disabled", false);
      dom.setupBackButton.prop("disabled", false);
      dom.setupContinueButton.prop("disabled", false);
    }
    function disableFooterButtons() {
      dom.importButtons.prop("disabled", true);
      dom.setupBackButton.prop("disabled", true);
      dom.setupContinueButton.prop("disabled", true);
    }
    function applyFilters() {
      const $container = dom.demoContainer;
      const $items = $container.find(".js-wui-sp-demo-item");
      const activeCategory = dom.navLinks.closest("li.wui-di-sub-tabs-active").find("a").attr("href") || "#all";
      const search = (dom.searchInput.val() || "").toLowerCase();
      const category = activeCategory.replace("#", "");
      $items.each(function() {
        const $item = $(this);
        const name = ($item.data("name") || "").toString().toLowerCase();
        const categories = ($item.data("categories") || "").toString();
        const categoryMatch = category === "all" || categories.split(",").includes(category);
        const searchMatch = search === "" || name.indexOf(search) !== -1;
        const isVisible = categoryMatch && searchMatch;
        $item.toggleClass("is-hidden-by-filter", !isVisible);
        $item.toggle(isVisible);
      });
    }
    function parsePluginsMap($page) {
      const raw = ($page.attr("data-plugins-by-demo") || "").toString();
      if (raw === "") return {};
      try {
        return JSON.parse(raw);
      } catch (e) {
        return {};
      }
    }
    function renderEmptyPlugins() {
      const $template = dom.pluginEmptyTemplate;
      return $template.length ? $(String($template.html() || "").trim()) : $();
    }
    function createPluginItem(plugin, index) {
      const $template = dom.pluginItemTemplate;
      const $item = $(String($template.html() || "").trim());
      const required = !!plugin.required;
      const checked = required ? true : !!plugin.selected;
      const disabled = required;
      const status = (plugin.status || "unknown").toString();
      $item.find('.wui-di__setup-plugin-check input[type="checkbox"]').attr("data-index", index).attr("id", "wui-di-plugin-toggle-" + ++pluginControlId).attr("aria-label", plugin.name || t("plugin_fallback_name")).prop("checked", checked).prop("disabled", disabled);
      $item.find(".wui-di__setup-plugin-name").text(plugin.name || t("plugin_fallback_name"));
      $item.find(".wui-di__setup-plugin-type").text(required ? t("plugin_type_required") : t("plugin_type_recommended")).addClass(required ? "is-required wui-di-badge wui-di-error" : "is-recommended wui-di-badge wui-di-info");
      const statusMeta = pluginStatusMeta(status);
      $item.find(".js-wui-di-plugin-status").attr("data-slug", plugin.slug || "").text(statusMeta.text).addClass(statusMeta.badgeClass);
      return $item;
    }
    function renderSetupPlugins(plugins) {
      if (!Array.isArray(plugins) || !plugins.length) return renderEmptyPlugins();
      const $list = $(document.createElement("ul")).addClass("wui-di__setup-plugin-list");
      plugins.forEach(function(plugin, index) {
        $list.append(createPluginItem(plugin || {}, index));
      });
      return $list;
    }
    function renderSetupDemoCategories(categories) {
      dom.setupDemoCategories.empty();
      if (!Array.isArray(categories) || !categories.length) return;
      categories.forEach(function(label) {
        const text = (label || "").toString().trim();
        if (text === "") return;
        dom.setupDemoCategories.append(
          $(document.createElement("span")).addClass("wui-di__gl-item-tag").text(text)
        );
      });
    }
    function normalizePlugins(plugins) {
      if (!Array.isArray(plugins)) return [];
      return plugins.map(function(plugin) {
        const next = jq.extend({}, plugin || {});
        const preselected = typeof next.preselected === "undefined" ? !!next.required : !!next.preselected;
        next.selected = !!next.required || preselected || next.status === "active";
        return next;
      });
    }
    function clearLog($target) {
      $target.empty();
    }
    function appendLog($target, message, type) {
      const text = (message || "").toString().trim();
      if (text === "") return;
      const now = /* @__PURE__ */ new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const ss = String(now.getSeconds()).padStart(2, "0");
      const $entry = $(document.createElement("li")).addClass("wui-di__stage-log-item");
      if (typeof type === "string" && type !== "") $entry.addClass("is-" + type);
      $entry.text("[" + hh + ":" + mm + ":" + ss + "] " + text);
      $target.append($entry);
      if ($target.length && $target[0]) {
        $target[0].scrollTop = $target[0].scrollHeight;
      }
    }
    function setStageLabel($target, text, type) {
      if (!$target.length) return;
      $target.removeClass("is-info is-progress is-success is-error");
      if (typeof type === "string" && type !== "") $target.addClass("is-" + type);
      $target.text(text || t("stage_waiting"));
    }
    function updatePluginStatus(slug, status) {
      const $status = $('.js-wui-di-plugin-status[data-slug="' + slug + '"]');
      if (!$status.length) return;
      const statusMeta = pluginStatusMeta((status || "unknown").toString());
      $status.removeClass("is-active is-installed is-missing is-unknown wui-di-success wui-di-info wui-di-warning wui-di-neutral").addClass(statusMeta.badgeClass).text(statusMeta.text);
    }
    function resetResultPanels() {
      clearProcessingState();
      clearLog(dom.pluginLog);
      clearLog(dom.contentLog);
      setStageLabel(dom.pluginStageLabel, t("stage_waiting"), "info");
      setStageLabel(dom.contentStageLabel, t("stage_waiting"), "info");
      dom.pluginRestartButton.hide();
      dom.contentRestartButton.hide();
      dom.doneTitle.html(doneTitleTemplate || "");
      dom.doneMessage.html(doneMessageTemplate || "");
    }
    function showSetup(selected, demoName, demoImage, plugins, categories) {
      currentImport = {
        selected,
        demoName: demoName || "",
        demoImage: demoImage || "",
        categories: Array.isArray(categories) ? categories : [],
        plugins: normalizePlugins(plugins)
      };
      resetResultPanels();
      resetFooterButtons();
      const $label = $(document.createElement("strong"));
      dom.setupDemo.empty().append($label).append(document.createTextNode(": " + currentImport.demoName));
      dom.setupPlugins.empty().append(renderSetupPlugins(currentImport.plugins));
      dom.setupDemoName.text(currentImport.demoName);
      renderSetupDemoCategories(currentImport.categories);
      dom.pluginContext.text(currentImport.demoName);
      dom.contentContext.text(currentImport.demoName);
      if (currentImport.demoImage !== "") {
        dom.setupPreviewImage.attr("src", currentImport.demoImage).show();
        dom.setupPreviewWrap.show();
      } else {
        dom.setupPreviewImage.attr("src", "").hide();
        dom.setupPreviewWrap.hide();
      }
      setTimelineState("select", "done");
      setTimelineState("setup", "active");
      setTimelineState("plugins", "disabled");
      setTimelineState("content", "disabled");
      setTimelineState("done", "disabled");
      setActiveStep("setup");
    }
    function hideSetup() {
      currentImport = null;
      isImportRunning = false;
      resetResultPanels();
      resetFooterButtons();
      resetTimelineForSelection();
    }
    function runPluginInstallAjax(selected, slug, nonce, ajaxUrl, onDone, onFail) {
      options.request({
        method: "POST",
        url: ajaxUrl,
        dataType: "json",
        data: {
          action: "install_plugin",
          security: nonce,
          selected,
          slug
        }
      }).done(function(response) {
        if (response && response.error) {
          onFail(response.error);
          return;
        }
        onDone(response || {});
      }).fail(function(xhr) {
        const responseText = xhr && xhr.responseText ? xhr.responseText : "";
        try {
          const parsed = JSON.parse(responseText);
          if (parsed && parsed.error) {
            onFail(parsed.error);
            return;
          }
        } catch (e) {
        }
        onFail(responseText || t("error_plugin_installation_failed"));
      });
    }
    function runPluginQueue(queue, selected, nonce, ajaxUrl, done, fail) {
      if (!queue.length) {
        appendLog(dom.pluginLog, t("log_no_plugins_required"), "info");
        done();
        return;
      }
      let i = 0;
      function next() {
        if (i >= queue.length) {
          done();
          return;
        }
        const plugin = queue[i];
        const pluginName = plugin.name || plugin.slug || t("plugin_fallback_name");
        setStageLabel(dom.pluginStageLabel, t("stage_installing"), "progress");
        appendLog(dom.pluginLog, formatString(t("log_installing_plugin"), [pluginName, i + 1, queue.length]), "info");
        runPluginInstallAjax(selected, plugin.slug, nonce, ajaxUrl, function(response) {
          const status = response && response.status ? response.status : "active";
          plugin.status = status;
          updatePluginStatus(plugin.slug, status);
          appendLog(dom.pluginLog, formatString(t("log_plugin_ready"), [pluginName]), "success");
          i += 1;
          next();
        }, fail);
      }
      next();
    }
    function runContentImportAjax(payload, nonce, ajaxUrl, state, onDone, onFail) {
      const actionName = payload && payload.action ? payload.action : "";
      if (actionName === "import_demo_data") {
        setStageLabel(dom.contentStageLabel, t("stage_importing_content"), "progress");
        appendLog(dom.contentLog, formatString(t("log_processing_content_batch"), [state.contentBatch]), "info");
      } else if (actionName === "import_customizer_data") {
        setStageLabel(dom.contentStageLabel, t("stage_applying_customizer"), "progress");
        appendLog(dom.contentLog, t("log_applying_customizer"), "info");
      } else if (actionName === "after_import_data") {
        setStageLabel(dom.contentStageLabel, t("stage_finalizing"), "progress");
        appendLog(dom.contentLog, t("log_running_post_import"), "info");
      }
      options.request({
        method: "POST",
        url: ajaxUrl,
        data: payload,
        dataType: "json"
      }).done(function(response) {
        if (response && response.status === "newAJAX") {
          state.contentBatch += 1;
          runContentImportAjax(payload, nonce, ajaxUrl, state, onDone, onFail);
          return;
        }
        if (response && response.status === "customizerAJAX") {
          runContentImportAjax({
            action: "import_customizer_data",
            security: nonce
          }, nonce, ajaxUrl, state, onDone, onFail);
          return;
        }
        if (response && response.status === "afterAllImportAJAX") {
          runContentImportAjax({
            action: "after_import_data",
            security: nonce
          }, nonce, ajaxUrl, state, onDone, onFail);
          return;
        }
        if (response && typeof response.error !== "undefined") {
          appendLog(dom.contentLog, response.error, "error");
          onFail(response.error);
          return;
        }
        if (response && typeof response.message !== "undefined") {
          onDone(response);
          return;
        }
        onFail(t("error_import_failed"));
      }).fail(function(xhr) {
        const responseText = xhr && xhr.responseText ? xhr.responseText : "";
        try {
          const parsed = JSON.parse(responseText);
          if (parsed && typeof parsed.error !== "undefined") {
            onFail(parsed.error);
            return;
          }
        } catch (e) {
        }
        onFail(responseText || t("error_unknown_server"));
      });
    }
    function handlePluginFailure(errorText) {
      isImportRunning = false;
      clearProcessingState();
      setTimelineState("plugins", "error");
      setStageLabel(dom.pluginStageLabel, t("stage_failed"), "error");
      appendLog(dom.pluginLog, formatString(t("log_plugin_failed"), [errorText]), "error");
      dom.pluginRestartButton.show();
      resetFooterButtons();
    }
    function handleContentFailure(errorText) {
      isImportRunning = false;
      clearProcessingState();
      setTimelineState("content", "error");
      setStageLabel(dom.contentStageLabel, t("stage_failed"), "error");
      appendLog(dom.contentLog, formatString(t("log_content_failed"), [errorText]), "error");
      dom.contentRestartButton.show();
      resetFooterButtons();
    }
    function finishImport(response) {
      isImportRunning = false;
      clearProcessingState();
      setTimelineState("content", "done");
      setTimelineState("done", "done");
      setStageLabel(dom.contentStageLabel, t("stage_completed"), "success");
      appendLog(dom.contentLog, t("log_content_success"), "success");
      dom.doneTitle.find(".js-wui-di-done-demo-name").text(currentImport && currentImport.demoName ? currentImport.demoName + " " : "");
      if (response && typeof response.title === "string") dom.doneTitle.text(response.title);
      if (response && typeof response.message === "string") dom.doneMessage.text(response.message);
      resetFooterButtons();
      setActiveStep("done");
    }
    function startImport(selected) {
      const $page = dom.page;
      const ajaxUrl = ($page.data("ajax-url") || "").toString();
      const nonce = ($page.data("ajax-nonce") || "").toString();
      if (ajaxUrl === "" || nonce === "" || !currentImport) return;
      const queue = [];
      currentImport.plugins.forEach(function(plugin) {
        if (!plugin || !plugin.slug) return;
        if (!plugin.selected) return;
        if (plugin.status === "active") return;
        queue.push(plugin);
      });
      isImportRunning = true;
      resetResultPanels();
      disableFooterButtons();
      setTimelineState("select", "done");
      setTimelineState("setup", "done");
      setTimelineState("plugins", "active");
      setTimelineState("content", "disabled");
      setTimelineState("done", "disabled");
      setProcessingState("plugins");
      setActiveStep("plugins");
      appendLog(dom.pluginLog, formatString(t("log_import_started"), [currentImport.demoName]), "info");
      runPluginQueue(queue, selected, nonce, ajaxUrl, function() {
        setTimelineState("plugins", "done");
        setTimelineState("content", "active");
        setStageLabel(dom.pluginStageLabel, t("stage_completed"), "success");
        appendLog(dom.pluginLog, t("log_plugin_step_completed"), "success");
        setProcessingState("content");
        setActiveStep("content");
        appendLog(dom.contentLog, formatString(t("log_content_started"), [currentImport.demoName]), "info");
        runContentImportAjax({
          action: "import_demo_data",
          security: nonce,
          selected
        }, nonce, ajaxUrl, { contentBatch: 1 }, finishImport, handleContentFailure);
      }, handlePluginFailure);
    }
    jq(root).on("click", ".js-wui-sp-demo-nav-link", function(e) {
      e.preventDefault();
      const $li = $(this).closest("li");
      $li.addClass("wui-di-sub-tabs-active").siblings().removeClass("wui-di-sub-tabs-active");
      applyFilters();
    });
    jq(root).on("input", ".js-wui-sp-demo-search", applyFilters);
    jq(root).on("click", ".js-wui-di-step-nav", function(e) {
      e.preventDefault();
      const step = ($(this).attr("href") || "").replace("#", "");
      if (isImportRunning || step === "") return;
      if (!isStepAvailable(step) && step !== "select") return;
      setActiveStep(step);
    });
    jq(root).on("submit", ".js-wui-di-import-form", function(e) {
      const $page = dom.page;
      const ajaxUrl = ($page.data("ajax-url") || "").toString();
      const nonce = ($page.data("ajax-nonce") || "").toString();
      if (ajaxUrl === "" || nonce === "") return;
      e.preventDefault();
      const selected = ($(this).data("selected") || 0).toString();
      const demoName = ($(this).attr("data-demo-name") || "").toString();
      const demoImage = ($(this).attr("data-demo-image") || "").toString();
      const demoCategoriesRaw = ($(this).attr("data-demo-categories") || "").toString();
      let demoCategories = [];
      if (demoCategoriesRaw !== "") {
        try {
          const parsed = JSON.parse(demoCategoriesRaw);
          if (Array.isArray(parsed)) demoCategories = parsed;
        } catch (e2) {
        }
      }
      const pluginsMap = parsePluginsMap($page);
      const plugins = pluginsMap[selected] || [];
      showSetup(selected, demoName, demoImage, plugins, demoCategories);
    });
    jq(root).on("change", '.wui-di__setup-plugin-check input[type="checkbox"]', function() {
      if (!currentImport || !Array.isArray(currentImport.plugins)) return;
      const idx = parseInt(($(this).attr("data-index") || "").toString(), 10);
      if (isNaN(idx) || !currentImport.plugins[idx]) return;
      if (currentImport.plugins[idx].required) {
        $(this).prop("checked", true).prop("disabled", true);
        currentImport.plugins[idx].selected = true;
        return;
      }
      currentImport.plugins[idx].selected = $(this).is(":checked");
    });
    jq(root).on("click", ".js-wui-di-setup-back", function() {
      if (isImportRunning) return;
      hideSetup();
    });
    jq(root).on("click", ".js-wui-di-setup-continue", function() {
      if (isImportRunning || !currentImport || typeof currentImport.selected === "undefined") return;
      startImport((currentImport.selected || 0).toString());
    });
    jq(root).on("click", ".js-wui-di-plugin-restart, .js-wui-di-content-restart", function() {
      if (!currentImport || typeof currentImport.selected === "undefined") return;
      startImport((currentImport.selected || 0).toString());
    });
    resetTimelineForSelection();
    if (typeof moveInlineTitleNotices === "function") moveInlineTitleNotices();
  }
  return __toCommonJS(demo_import_exports);
})();

  global.WebiliaUI.demoImport = __wuiModule;
  
})(window);
