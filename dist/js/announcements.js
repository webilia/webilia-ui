(function (global) {
  global.WebiliaUI = global.WebiliaUI || {};
  if (global.WebiliaUI.announcements) return;
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

  // assets/js/announcements.js
  var announcements_exports = {};
  __export(announcements_exports, {
    init: () => init
  });
  var instances = /* @__PURE__ */ new WeakMap();
  var iconNames = { info: "inbox", success: "checkmark-circle", warning: "alert", danger: "alert", error: "alert" };
  function safeUrl(value) {
    try {
      const url = new URL(value, document.baseURI);
      return ["http:", "https:", "mailto:"].includes(url.protocol) ? url.href : "";
    } catch (e) {
      return "";
    }
  }
  function init(modal, options = {}) {
    if (instances.has(modal)) return instances.get(modal);
    const root = modal.querySelector("[data-wui-announcement-center]");
    if (!root) return null;
    const labels = { dismiss: "Dismiss", loading: "Loading\u2026", error: "Announcements are unavailable. Try again later.", empty_active: "No active announcements.", empty_dismissed: "No dismissed announcements.", ...options.labels };
    let items = options.items || [];
    let tab = "active";
    const status = root.querySelector("[data-wui-announcement-status]");
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const lists = [...root.querySelectorAll("[data-wui-announcement-list]")];
    let loading = false;
    function dates() {
      for (const time of root.querySelectorAll("[data-wui-announcement-date]")) {
        const timestamp = Date.parse(time.dateTime);
        if (!Number.isFinite(timestamp)) continue;
        const days = Math.round((timestamp - Date.now()) / 864e5);
        time.textContent = typeof Intl.RelativeTimeFormat === "function" ? new Intl.RelativeTimeFormat(options.locale || void 0, { numeric: "auto" }).format(days, "day") : new Date(timestamp).toLocaleDateString(options.locale || void 0);
      }
    }
    function select(name, focus = false) {
      tab = name;
      tabs.forEach((button) => {
        const active = button.dataset.wuiAnnouncementTab === name;
        button.setAttribute("aria-selected", String(active));
        button.tabIndex = active ? 0 : -1;
        if (focus && active) button.focus();
      });
      lists.forEach((list) => {
        list.hidden = list.dataset.wuiAnnouncementList !== name;
      });
    }
    function paint() {
      for (const list of lists) {
        list.replaceChildren();
        const selected = items.filter((item) => item.state === list.dataset.wuiAnnouncementList);
        for (const item of selected) {
          const card = document.createElement("article");
          card.className = `wui-announcement wui-announcement--${iconNames[item.severity] ? item.severity : "info"}`;
          card.dataset.wuiAnnouncementId = item.id;
          const icon = document.createElement("span");
          icon.className = `wui-icon wui-icon--${iconNames[item.severity] || "inbox"}`;
          icon.setAttribute("aria-hidden", "true");
          const title = document.createElement("h3");
          title.textContent = item.title;
          const description = document.createElement("div");
          description.className = "wui-announcement__description";
          description.innerHTML = item.description_html || "";
          const time = document.createElement("time");
          time.dateTime = item.date || "";
          time.dataset.wuiAnnouncementDate = "";
          time.textContent = item.date_label || "";
          card.append(icon, title, description, time);
          const url = safeUrl(item.url || "");
          if (item.url && url && item.cta_label) {
            const cta = document.createElement("a");
            cta.className = "wui-button wui-button--secondary";
            cta.href = url;
            cta.textContent = item.cta_label;
            card.append(cta);
          }
          if (item.state === "active") {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "wui-button wui-button--tertiary";
            button.dataset.wuiAnnouncementDismiss = "";
            button.textContent = labels.dismiss;
            card.append(button);
          }
          list.append(card);
        }
        if (!selected.length) {
          const empty = document.createElement("p");
          empty.textContent = labels[`empty_${list.dataset.wuiAnnouncementList}`];
          list.append(empty);
        }
      }
      const count = items.filter((item) => item.state === "active").length;
      for (const button of document.querySelectorAll("[data-wui-modal-open]")) {
        if (button.dataset.wuiModalOpen !== modal.id) continue;
        const badge = button.querySelector("[data-wui-announcement-count]");
        if (badge) {
          badge.textContent = String(count);
          badge.hidden = count === 0;
        }
        if (button.dataset.wuiCountLabel) button.setAttribute("aria-label", button.dataset.wuiCountLabel.replace("{count}", String(count)));
      }
      dates();
      select(tab);
    }
    async function refresh() {
      if (!options.load || loading) return;
      loading = true;
      root.setAttribute("aria-busy", "true");
      status.textContent = labels.loading;
      try {
        const result = await options.load();
        items = result.items;
        paint();
        status.textContent = result.unavailable ? labels.error : "";
      } catch (e) {
        status.textContent = labels.error;
      } finally {
        loading = false;
        root.removeAttribute("aria-busy");
      }
    }
    root.addEventListener("click", async (event) => {
      var _a;
      const button = event.target.closest("[data-wui-announcement-tab]");
      if (button) {
        select(button.dataset.wuiAnnouncementTab);
        return;
      }
      const dismiss = event.target.closest("[data-wui-announcement-dismiss]");
      if (!dismiss || !options.dismiss || dismiss.disabled) return;
      const id = dismiss.closest("[data-wui-announcement-id]").dataset.wuiAnnouncementId;
      dismiss.disabled = true;
      try {
        await options.dismiss(id);
        document.dispatchEvent(new CustomEvent("wui:announcement:dismissed", { detail: { id, scope: options.scope || modal.id } }));
        status.textContent = "";
        (_a = tabs.find((button2) => button2.dataset.wuiAnnouncementTab === tab)) == null ? void 0 : _a.focus();
      } catch (e) {
        status.textContent = labels.error;
        dismiss.disabled = false;
      }
    });
    root.addEventListener("keydown", (event) => {
      const current = tabs.indexOf(event.target);
      if (current < 0 || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const rtl = getComputedStyle(root).direction === "rtl";
      const step = (event.key === "ArrowRight" ? 1 : -1) * (rtl ? -1 : 1);
      const index = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (current + step + tabs.length) % tabs.length;
      select(tabs[index].dataset.wuiAnnouncementTab, true);
    });
    document.addEventListener("wui:announcement:dismissed", (event) => {
      if (event.detail.scope !== (options.scope || modal.id)) return;
      items = items.map((item) => item.id === event.detail.id ? { ...item, state: "dismissed" } : item);
      paint();
    });
    for (const kind of ["opened", "closed"]) modal.addEventListener(`wui:modal:${kind}`, () => {
      for (const button of document.querySelectorAll("[data-wui-modal-open]")) {
        if (button.dataset.wuiModalOpen === modal.id) button.setAttribute("aria-expanded", String(kind === "opened"));
      }
      if (kind === "opened") refresh();
    });
    const api = { refresh };
    instances.set(modal, api);
    if (options.items) paint();
    else dates();
    if (options.unavailable) status.textContent = labels.error;
    return api;
  }
  return __toCommonJS(announcements_exports);
})();

  global.WebiliaUI.announcements = __wuiModule;
  
})(window);
