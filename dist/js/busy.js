(function (global) {
  global.WebiliaUI = global.WebiliaUI || {};
  if (global.WebiliaUI.busy) return;
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

  // assets/js/busy.js
  var busy_exports = {};
  __export(busy_exports, {
    isBusy: () => isBusy,
    setBusy: () => setBusy
  });
  var ownedControls = /* @__PURE__ */ new WeakMap();
  function isBusy(element) {
    return (element == null ? void 0 : element.getAttribute("aria-busy")) === "true";
  }
  function setBusy(element, busy, options = {}) {
    if (!(element instanceof Element)) return;
    const current = ownedControls.get(element);
    if (busy && current) return;
    if (busy) {
      const controls = options.disableControls === false ? [] : [...element.querySelectorAll('button, input:not([type="hidden"]), select, textarea')];
      const owned = controls.filter((control) => !control.disabled);
      owned.forEach((control) => {
        control.disabled = true;
      });
      ownedControls.set(element, owned);
      element.setAttribute("aria-busy", "true");
      element.classList.add("wui-is-loading");
      return;
    }
    if (!current) return;
    current.forEach((control) => {
      control.disabled = false;
    });
    ownedControls.delete(element);
    element.setAttribute("aria-busy", "false");
    element.classList.remove("wui-is-loading");
  }
  return __toCommonJS(busy_exports);
})();

  global.WebiliaUI.busy = __wuiModule;
  
})(window);
