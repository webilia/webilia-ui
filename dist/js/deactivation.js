(function (global) {
  global.WebiliaUI = global.WebiliaUI || {};
  if (global.WebiliaUI.deactivation) return;
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

  // assets/js/deactivation.js
  var deactivation_exports = {};
  __export(deactivation_exports, {
    init: () => init
  });
  var instances = /* @__PURE__ */ new WeakMap();
  function init(modal, options = {}) {
    if (instances.has(modal)) return instances.get(modal);
    const form = modal.querySelector("[data-wui-deactivation-feedback]");
    if (!form) return null;
    const error = form.querySelector("[data-wui-feedback-error]");
    let submitting = false;
    let cancelled = false;
    let generation = 0;
    let terminal = false;
    function emit(action, detail = {}) {
      modal.dispatchEvent(new CustomEvent(`wui:feedback:${action}`, { bubbles: true, detail }));
    }
    form.addEventListener("change", () => {
      var _a;
      const reason = (_a = form.querySelector('[name="reason"]:checked')) == null ? void 0 : _a.value;
      for (const details of form.querySelectorAll("[data-wui-reason-details]")) {
        details.hidden = details.dataset.wuiReasonDetails !== reason;
        details.querySelector("textarea").disabled = details.hidden;
      }
      error.textContent = "";
    });
    modal.querySelector("[data-wui-feedback-skip]").addEventListener("click", () => {
      var _a;
      terminal = true;
      cancelled = true;
      generation++;
      emit("skip");
      (_a = options.skip) == null ? void 0 : _a.call(options);
    });
    modal.addEventListener("wui:modal:opened", () => {
      terminal = false;
      cancelled = false;
      generation++;
      error.textContent = "";
    });
    modal.addEventListener("wui:modal:closed", () => {
      var _a;
      cancelled = true;
      generation++;
      if (!terminal) {
        emit("cancel");
        (_a = options.cancel) == null ? void 0 : _a.call(options);
      }
    });
    form.addEventListener("submit", async (event) => {
      var _a, _b, _c;
      event.preventDefault();
      if (submitting || !options.submit) return;
      const reason = (_a = form.querySelector('[name="reason"]:checked')) == null ? void 0 : _a.value;
      if (!reason) {
        error.textContent = options.reasonRequired || "Please select a reason.";
        return;
      }
      const details = ((_b = [...form.querySelectorAll("[data-wui-reason-details]")].find((element) => element.dataset.wuiReasonDetails === reason)) == null ? void 0 : _b.querySelector("textarea").value) || "";
      const started = generation;
      submitting = true;
      const button = modal.querySelector('[type="submit"]');
      button.disabled = true;
      form.setAttribute("aria-busy", "true");
      try {
        await options.submit({ reason, details });
        if (!cancelled && started === generation) {
          terminal = true;
          emit("submitted", { reason });
          (_c = options.complete) == null ? void 0 : _c.call(options);
        }
      } catch (failure) {
        if (!cancelled && started === generation) error.textContent = options.error || (failure == null ? void 0 : failure.message) || "Could not send feedback. You can skip and deactivate.";
      } finally {
        submitting = false;
        button.disabled = false;
        form.removeAttribute("aria-busy");
      }
    });
    const api = {};
    instances.set(modal, api);
    return api;
  }
  return __toCommonJS(deactivation_exports);
})();

  global.WebiliaUI.deactivation = __wuiModule;
  
})(window);
