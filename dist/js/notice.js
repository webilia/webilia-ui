(function (global) {
  global.WebiliaUI = global.WebiliaUI || {};
  if (global.WebiliaUI.notice) return;
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

  // assets/js/notice.js
  var notice_exports = {};
  __export(notice_exports, {
    init: () => init
  });
  var initializedRoots = /* @__PURE__ */ new WeakSet();
  function init(root = document) {
    if (initializedRoots.has(root)) return;
    initializedRoots.add(root);
    root.addEventListener("click", (event) => {
      var _a, _b;
      if (event.__wuiNoticeHandled) return;
      const button = (_b = (_a = event.target).closest) == null ? void 0 : _b.call(_a, "[data-wui-notice-dismiss]");
      const notice = button == null ? void 0 : button.closest(".wui-notice");
      if (!notice || !notice.closest(".wui")) return;
      event.__wuiNoticeHandled = true;
      event.preventDefault();
      notice.dispatchEvent(new CustomEvent("wui:notice:dismissed", { bubbles: true }));
      notice.remove();
    });
  }
  return __toCommonJS(notice_exports);
})();

  global.WebiliaUI.notice = __wuiModule;
  __wuiModule.init(document);
})(window);
