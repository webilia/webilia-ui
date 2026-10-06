(function (global) {
  global.WebiliaUI = global.WebiliaUI || {};
  if (global.WebiliaUI.toast) return;
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

  // assets/js/toast.js
  var toast_exports = {};
  __export(toast_exports, {
    show: () => show
  });
  var tones = /* @__PURE__ */ new Set(["neutral", "info", "success", "warning", "danger", "loading"]);
  var positions = /* @__PURE__ */ new Set(["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"]);
  var icons = {
    neutral: "stars",
    info: "question",
    success: "checkmark-circle",
    warning: "alert",
    danger: "alert",
    loading: "loading"
  };
  function regionFor(root, position) {
    const host = root instanceof Element ? root : document.body;
    let scope = host;
    if (!host.closest(".wui")) {
      scope = [...host.children].find((child) => child.matches(".wui[data-wui-toast-scope]"));
      if (!scope) {
        scope = document.createElement("div");
        scope.className = "wui";
        scope.dataset.wuiToastScope = "";
        host.append(scope);
      }
    }
    let region = [...scope.children].find((child) => child.matches(".wui-toast-region") && child.dataset.wuiToastPosition === position);
    if (!region) {
      region = document.createElement("div");
      region.className = `wui-toast-region wui-toast-region--${position}`;
      region.dataset.wuiToastPosition = position;
      scope.append(region);
    }
    return region;
  }
  function duration(value, fallback) {
    return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : fallback;
  }
  function show(message, options = {}) {
    const tone = tones.has(options.tone) ? options.tone : "neutral";
    const position = positions.has(options.position) ? options.position : "bottom-right";
    const region = regionFor(options.root, position);
    const toast = document.createElement("div");
    const icon = document.createElement("span");
    const text = document.createElement("span");
    const close = document.createElement("button");
    let currentTone = tone;
    let currentDuration = duration(options.durationMs, tone === "loading" ? 0 : 8e3);
    let progress = options.progress !== false;
    let timer = null;
    let startedAt = 0;
    let remaining = currentDuration;
    let hovered = false;
    let focused = false;
    let dismissed = false;
    toast.className = `wui-toast wui-toast--${tone}`;
    toast.setAttribute("role", tone === "danger" || tone === "warning" ? "alert" : "status");
    toast.setAttribute("aria-live", tone === "danger" || tone === "warning" ? "assertive" : "polite");
    icon.className = `wui-toast__icon wui-icon wui-icon--${icons[tone]}`;
    icon.setAttribute("aria-hidden", "true");
    text.className = "wui-toast__message";
    text.textContent = String(message);
    close.className = "wui-toast__close";
    close.type = "button";
    close.setAttribute("aria-label", options.closeLabel || "Dismiss notification");
    close.innerHTML = '<span class="wui-icon wui-icon--cross" aria-hidden="true"></span>';
    toast.append(icon, text, close);
    region.append(toast);
    function stopTimer() {
      if (timer === null) return;
      clearTimeout(timer);
      remaining = Math.max(0, remaining - (Date.now() - startedAt));
      timer = null;
    }
    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      stopTimer();
      toast.remove();
      if (!region.children.length) {
        const scope = region.parentElement;
        region.remove();
        if ((scope == null ? void 0 : scope.hasAttribute("data-wui-toast-scope")) && !scope.children.length) scope.remove();
      }
    }
    function resume() {
      if (dismissed || hovered || focused) return;
      toast.classList.remove("is-paused");
      if (remaining > 0) {
        startedAt = Date.now();
        timer = setTimeout(dismiss, remaining);
      } else if (currentDuration > 0) {
        dismiss();
      }
    }
    function pause() {
      stopTimer();
      toast.classList.add("is-paused");
    }
    function resetProgress() {
      var _a;
      (_a = toast.querySelector(".wui-toast__progress")) == null ? void 0 : _a.remove();
      if (!progress || currentDuration === 0) return;
      const bar = document.createElement("span");
      bar.className = "wui-toast__progress";
      bar.setAttribute("aria-hidden", "true");
      toast.style.setProperty("--wui-toast-duration", `${currentDuration}ms`);
      toast.append(bar);
    }
    function update(nextMessage, nextOptions = {}) {
      if (dismissed) return;
      stopTimer();
      const nextTone = tones.has(nextOptions.tone) ? nextOptions.tone : currentTone;
      const defaultDuration = currentTone === "loading" && nextTone !== "loading" ? 8e3 : currentDuration;
      currentDuration = duration(nextOptions.durationMs, defaultDuration);
      currentTone = nextTone;
      if ("progress" in nextOptions) progress = nextOptions.progress !== false;
      toast.className = `wui-toast wui-toast--${currentTone}`;
      if (hovered || focused) toast.classList.add("is-paused");
      toast.setAttribute("role", currentTone === "danger" || currentTone === "warning" ? "alert" : "status");
      toast.setAttribute("aria-live", currentTone === "danger" || currentTone === "warning" ? "assertive" : "polite");
      icon.className = `wui-toast__icon wui-icon wui-icon--${icons[currentTone]}`;
      text.textContent = String(nextMessage);
      if (nextOptions.closeLabel) close.setAttribute("aria-label", nextOptions.closeLabel);
      remaining = currentDuration;
      resetProgress();
      resume();
    }
    close.addEventListener("click", dismiss);
    toast.addEventListener("mouseenter", () => {
      hovered = true;
      pause();
    });
    toast.addEventListener("mouseleave", () => {
      hovered = false;
      resume();
    });
    toast.addEventListener("focusin", () => {
      focused = true;
      pause();
    });
    toast.addEventListener("focusout", (event) => {
      if (!toast.contains(event.relatedTarget)) {
        focused = false;
        resume();
      }
    });
    resetProgress();
    resume();
    return { element: toast, update, dismiss };
  }
  return __toCommonJS(toast_exports);
})();

  global.WebiliaUI.toast = __wuiModule;
  
})(window);
