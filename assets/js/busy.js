const ownedControls = new WeakMap();

export function isBusy(element) {
  return element?.getAttribute('aria-busy') === 'true';
}

export function setBusy(element, busy, options = {}) {
  if (!(element instanceof Element)) return;
  const current = ownedControls.get(element);
  if (busy && current) return;

  if (busy) {
    const controls = options.disableControls === false ? []
      : [...(options.controls || element.querySelectorAll('button, input:not([type="hidden"]), select, textarea'))]
        .filter((control) => control instanceof Element && 'disabled' in control);
    const owned = controls.filter((control) => !control.disabled);
    owned.forEach((control) => { control.disabled = true; });
    ownedControls.set(element, owned);
    element.setAttribute('aria-busy', 'true');
    element.classList.add('wui-is-loading');
    return;
  }

  if (!current) return;
  current.forEach((control) => { control.disabled = false; });
  ownedControls.delete(element);
  element.setAttribute('aria-busy', 'false');
  element.classList.remove('wui-is-loading');
}
