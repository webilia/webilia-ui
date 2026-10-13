(function (global) {
  global.WebiliaUI = global.WebiliaUI || {};
  if (global.WebiliaUI.modal) return;
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

  // assets/js/modal.js
  var modal_exports = {};
  __export(modal_exports, {
    close: () => close,
    confirm: () => confirm,
    init: () => init,
    open: () => open
  });
  var initializedRoots = /* @__PURE__ */ new WeakSet();
  var openModals = [];
  var previousFocus = /* @__PURE__ */ new WeakMap();
  var focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var savedBodyOverflow = "";
  var confirmSequence = 0;
  function elementFor(target) {
    if (target instanceof Element) return target;
    if (typeof target !== "string") return null;
    return document.getElementById(target.replace(/^#/, ""));
  }
  function focusable(modal) {
    return [...modal.querySelectorAll(focusableSelector)].filter((element) => !element.hidden && element.getClientRects().length > 0);
  }
  function focusFirst(modal) {
    const preferred = modal.querySelector("[autofocus]");
    const first = preferred || focusable(modal)[0] || modal.querySelector(".wui-modal__panel");
    first == null ? void 0 : first.focus();
  }
  function open(target) {
    const modal = elementFor(target);
    if (!(modal == null ? void 0 : modal.matches("[data-wui-modal]"))) return false;
    if (!modal.hidden) return true;
    previousFocus.set(modal, document.activeElement instanceof HTMLElement ? document.activeElement : null);
    if (openModals.length === 0) {
      savedBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    modal.hidden = false;
    for (const trigger of document.querySelectorAll("[data-wui-modal-open][aria-expanded]")) {
      if (trigger.dataset.wuiModalOpen === modal.id) trigger.setAttribute("aria-expanded", "true");
    }
    openModals.push(modal);
    focusFirst(modal);
    modal.dispatchEvent(new CustomEvent("wui:modal:opened", { bubbles: true }));
    return true;
  }
  function close(target) {
    const modal = elementFor(target);
    if (!(modal == null ? void 0 : modal.matches("[data-wui-modal]")) || modal.hidden) return false;
    modal.hidden = true;
    for (const trigger of document.querySelectorAll("[data-wui-modal-open][aria-expanded]")) {
      if (trigger.dataset.wuiModalOpen === modal.id) trigger.setAttribute("aria-expanded", "false");
    }
    const index = openModals.indexOf(modal);
    if (index !== -1) openModals.splice(index, 1);
    if (openModals.length === 0) document.body.style.overflow = savedBodyOverflow;
    const focusTarget = previousFocus.get(modal);
    previousFocus.delete(modal);
    if (openModals.length > 0) {
      const parent = openModals[openModals.length - 1];
      if ((focusTarget == null ? void 0 : focusTarget.isConnected) && parent.contains(focusTarget)) focusTarget.focus();
      else focusFirst(parent);
    } else if (focusTarget == null ? void 0 : focusTarget.isConnected) focusTarget.focus();
    modal.dispatchEvent(new CustomEvent("wui:modal:closed", { bubbles: true }));
    return true;
  }
  function onClick(event) {
    var _a, _b, _c, _d;
    if (event.__wuiModalHandled) return;
    const trigger = (_b = (_a = event.target).closest) == null ? void 0 : _b.call(_a, "[data-wui-modal-open]");
    if (trigger) {
      const target = trigger.getAttribute("data-wui-modal-open");
      if (open(target)) {
        event.__wuiModalHandled = true;
        event.preventDefault();
      }
      return;
    }
    const dismiss = (_d = (_c = event.target).closest) == null ? void 0 : _d.call(_c, "[data-wui-modal-close]");
    const modal = dismiss == null ? void 0 : dismiss.closest("[data-wui-modal]");
    if (modal && close(modal)) {
      event.__wuiModalHandled = true;
      event.preventDefault();
    }
  }
  function onKeydown(event) {
    var _a;
    if (event.__wuiModalHandled || openModals.length === 0) return;
    const modal = openModals[openModals.length - 1];
    if (event.key === "Escape") {
      event.__wuiModalHandled = true;
      event.preventDefault();
      close(modal);
      return;
    }
    if (event.key !== "Tab") return;
    const items = focusable(modal);
    if (items.length === 0) {
      event.preventDefault();
      (_a = modal.querySelector(".wui-modal__panel")) == null ? void 0 : _a.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  }
  function init(root = document) {
    if (initializedRoots.has(root)) return;
    initializedRoots.add(root);
    root.addEventListener("click", onClick);
    root.addEventListener("keydown", onKeydown);
  }
  function confirm(options = {}) {
    const id = `wui-confirm-${++confirmSequence}`;
    const modal = document.createElement("div");
    modal.id = id;
    modal.className = "wui wui-modal wui-modal--small";
    modal.dataset.wuiModal = "";
    modal.hidden = true;
    modal.innerHTML = '<div class="wui-modal__backdrop" data-wui-modal-close></div><div class="wui-modal__panel" role="alertdialog" aria-modal="true" tabindex="-1"><div class="wui-modal__header"><h2></h2><button type="button" class="wui-button wui-button--icon" data-wui-modal-close><span aria-hidden="true">&times;</span></button></div><div class="wui-modal__body"><p></p></div><div class="wui-modal__footer"><button type="button" class="wui-button wui-button--secondary" data-wui-confirm-cancel></button><button type="button" class="wui-button" data-wui-confirm-accept></button></div></div>';
    const title = modal.querySelector("h2");
    title.id = `${id}-title`;
    title.textContent = options.title || "Confirm action";
    modal.querySelector('[role="alertdialog"]').setAttribute("aria-labelledby", title.id);
    modal.querySelector(".wui-modal__body p").textContent = options.message || "";
    modal.querySelector("[data-wui-modal-close] + .wui-modal__panel [data-wui-modal-close]").setAttribute("aria-label", options.closeLabel || "Close dialog");
    modal.querySelector("[data-wui-confirm-cancel]").textContent = options.cancelLabel || "Cancel";
    const accept = modal.querySelector("[data-wui-confirm-accept]");
    accept.textContent = options.confirmLabel || "Confirm";
    if (options.danger) accept.classList.add("wui-button--danger");
    document.body.append(modal);
    return new Promise((resolve) => {
      let accepted = false;
      modal.querySelector("[data-wui-confirm-cancel]").addEventListener("click", () => close(modal));
      accept.addEventListener("click", () => {
        accepted = true;
        close(modal);
      });
      modal.addEventListener("wui:modal:closed", () => {
        modal.remove();
        resolve(accepted);
      }, { once: true });
      open(modal);
    });
  }
  return __toCommonJS(modal_exports);
})();

  global.WebiliaUI.modal = __wuiModule;
  __wuiModule.init(document);
})(window);
