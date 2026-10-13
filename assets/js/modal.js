const initializedRoots = new WeakSet();
const openModals = [];
const previousFocus = new WeakMap();
const formObservers = new WeakMap();
const modalParents = new WeakMap();
const formControls = 'button, input, select, textarea, fieldset, output, object';
const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
let savedBodyOverflow = '';
let confirmSequence = 0;
let formSequence = 0;

function associateForm(modal) {
  const owner = modal.dataset.wuiModalForm;
  if (!owner) return;
  for (const control of modal.querySelectorAll(formControls)) {
    // Nested forms and explicit owners take precedence over the modal owner.
    if (control.hasAttribute('form') || control.closest('form')) continue;
    control.setAttribute('form', owner);
  }
}

function prepareModal(modal) {
  if (!modal.dataset.wuiModalForm) {
    const form = modal.closest('form');
    if (form) {
      if (!form.id) {
        let id;
        do { id = `wui-modal-owner-${++formSequence}`; }
        while (document.getElementById(id));
        form.id = id;
      }
      modal.dataset.wuiModalForm = form.id;
    }
  }
  if (modal.dataset.wuiModalMount === 'body' && modal.parentElement !== document.body) {
    document.body.append(modal);
  }
  associateForm(modal);
  if (modal.dataset.wuiModalForm && !formObservers.has(modal)) {
    const observer = new MutationObserver(() => associateForm(modal));
    observer.observe(modal, { childList: true, subtree: true });
    formObservers.set(modal, observer);
  }
}

function updateLayers() {
  openModals.forEach((modal, index) => modal.style.setProperty('--wui-modal-stack', String(index)));
}

function elementFor(target) {
  if (target instanceof Element) return target;
  if (typeof target !== 'string') return null;
  return document.getElementById(target.replace(/^#/, ''));
}

function focusable(modal) {
  return [...modal.querySelectorAll(focusableSelector)].filter((element) => !element.hidden && element.getClientRects().length > 0);
}

function focusFirst(modal) {
  const preferred = modal.querySelector('[autofocus]');
  const first = preferred || focusable(modal)[0] || modal.querySelector('.wui-modal__panel');
  first?.focus();
}

export function open(target) {
  const modal = elementFor(target);
  if (!modal?.matches('[data-wui-modal]')) return false;
  if (!modal.hidden) return true;

  previousFocus.set(modal, document.activeElement instanceof HTMLElement ? document.activeElement : null);
  const parent = openModals[openModals.length - 1];
  if (parent && (parent.contains(modal) || parent.contains(document.activeElement))) modalParents.set(modal, parent);
  prepareModal(modal);
  if (openModals.length === 0) {
    savedBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  modal.hidden = false;
  for (const trigger of document.querySelectorAll('[data-wui-modal-open][aria-expanded]')) {
    if (trigger.dataset.wuiModalOpen.replace(/^#/, '') === modal.id) trigger.setAttribute('aria-expanded', 'true');
  }
  openModals.push(modal);
  updateLayers();
  focusFirst(modal);
  modal.dispatchEvent(new CustomEvent('wui:modal:opened', { bubbles: true }));
  return true;
}

export function close(target) {
  const modal = elementFor(target);
  if (!modal?.matches('[data-wui-modal]') || modal.hidden) return false;

  for (const child of [...openModals].reverse()) {
    if (child !== modal && (modal.contains(child) || modalParents.get(child) === modal)) close(child);
  }

  modal.hidden = true;
  for (const trigger of document.querySelectorAll('[data-wui-modal-open][aria-expanded]')) {
    if (trigger.dataset.wuiModalOpen.replace(/^#/, '') === modal.id) trigger.setAttribute('aria-expanded', 'false');
  }
  const index = openModals.indexOf(modal);
  if (index !== -1) openModals.splice(index, 1);
  formObservers.get(modal)?.disconnect();
  formObservers.delete(modal);
  modalParents.delete(modal);
  modal.style.removeProperty('--wui-modal-stack');
  updateLayers();
  if (openModals.length === 0) document.body.style.overflow = savedBodyOverflow;

  const focusTarget = previousFocus.get(modal);
  previousFocus.delete(modal);
  if (openModals.length > 0) {
    const parent = openModals[openModals.length - 1];
    if (focusTarget?.isConnected && parent.contains(focusTarget)) focusTarget.focus();
    else focusFirst(parent);
  }
  else if (focusTarget?.isConnected) focusTarget.focus();

  modal.dispatchEvent(new CustomEvent('wui:modal:closed', { bubbles: true }));
  return true;
}

function onClick(event) {
  if (event.__wuiModalHandled) return;
  const trigger = event.target.closest?.('[data-wui-modal-open]');
  if (trigger) {
    const target = trigger.getAttribute('data-wui-modal-open');
    if (open(target)) {
      event.__wuiModalHandled = true;
      event.preventDefault();
    }
    return;
  }

  const dismiss = event.target.closest?.('[data-wui-modal-close]');
  const modal = dismiss?.closest('[data-wui-modal]');
  if (modal && close(modal)) {
    event.__wuiModalHandled = true;
    event.preventDefault();
  }
}

function onKeydown(event) {
  if (event.__wuiModalHandled || openModals.length === 0) return;
  const modal = openModals[openModals.length - 1];

  if (event.key === 'Escape') {
    event.__wuiModalHandled = true;
    event.preventDefault();
    if (modal.dataset.wuiModalEscapeClose !== '0') close(modal);
    return;
  }
  if (event.key !== 'Tab') return;

  const items = focusable(modal);
  if (items.length === 0) {
    event.preventDefault();
    modal.querySelector('.wui-modal__panel')?.focus();
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

export function init(root = document) {
  if (initializedRoots.has(root)) return;
  initializedRoots.add(root);
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKeydown);
  root.addEventListener('submit', () => {
    for (const modal of document.querySelectorAll('[data-wui-modal-form]')) associateForm(modal);
  }, true);
}

export function confirm(options = {}) {
  const id = `wui-confirm-${++confirmSequence}`;
  const modal = document.createElement('div');
  modal.id = id;
  modal.className = 'wui wui-modal wui-modal--small';
  modal.dataset.wuiModal = '';
  modal.hidden = true;
  modal.innerHTML = '<div class="wui-modal__backdrop" data-wui-modal-close></div><div class="wui-modal__panel" role="alertdialog" aria-modal="true" tabindex="-1"><div class="wui-modal__header"><h2></h2><button type="button" class="wui-button wui-button--icon" data-wui-modal-close><span aria-hidden="true">&times;</span></button></div><div class="wui-modal__body"><p></p></div><div class="wui-modal__footer"><button type="button" class="wui-button wui-button--secondary" data-wui-confirm-cancel></button><button type="button" class="wui-button" data-wui-confirm-accept></button></div></div>';
  const title = modal.querySelector('h2');
  title.id = `${id}-title`;
  title.textContent = options.title || 'Confirm action';
  modal.querySelector('[role="alertdialog"]').setAttribute('aria-labelledby', title.id);
  modal.querySelector('.wui-modal__body p').textContent = options.message || '';
  modal.querySelector('[data-wui-modal-close] + .wui-modal__panel [data-wui-modal-close]').setAttribute('aria-label', options.closeLabel || 'Close dialog');
  modal.querySelector('[data-wui-confirm-cancel]').textContent = options.cancelLabel || 'Cancel';
  const accept = modal.querySelector('[data-wui-confirm-accept]');
  accept.textContent = options.confirmLabel || 'Confirm';
  if (options.danger) accept.classList.add('wui-button--danger');
  document.body.append(modal);

  return new Promise((resolve) => {
    let accepted = false;
    modal.querySelector('[data-wui-confirm-cancel]').addEventListener('click', () => close(modal));
    accept.addEventListener('click', () => { accepted = true; close(modal); });
    modal.addEventListener('wui:modal:closed', () => { modal.remove(); resolve(accepted); }, { once: true });
    open(modal);
  });
}
