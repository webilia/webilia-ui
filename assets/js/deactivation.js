const instances = new WeakMap();
export function init(modal, options = {}) {
  if (instances.has(modal)) return instances.get(modal);
  const form = modal.querySelector('[data-wui-deactivation-feedback]');
  if (!form) return null;
  const error = form.querySelector('[data-wui-feedback-error]');
  const button = modal.querySelector('[type="submit"]');
  let submitting = false;
  let cancelled = false;
  let generation = 0;
  let terminal = false;
  function emit(action, detail = {}) {
    modal.dispatchEvent(new CustomEvent(`wui:feedback:${action}`, { bubbles: true, detail }));
  }
  form.addEventListener('change', () => {
    const reason = form.querySelector('[name="reason"]:checked')?.value;
    for (const details of form.querySelectorAll('[data-wui-reason-details]')) {
      details.hidden = details.dataset.wuiReasonDetails !== reason;
      details.querySelector('textarea').disabled = details.hidden;
    }
    error.textContent = '';
  });
  modal.querySelector('[data-wui-feedback-skip]').addEventListener('click', () => {
    terminal = true; cancelled = true; generation++; emit('skip'); options.skip?.();
  });
  modal.addEventListener('wui:modal:opened', () => {
    terminal = false; cancelled = false; generation++; submitting = false;
    button.disabled = false; form.removeAttribute('aria-busy'); error.textContent = '';
  });
  modal.addEventListener('wui:modal:closed', () => { cancelled = true; generation++; if (!terminal) { emit('cancel'); options.cancel?.(); } });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting || !options.submit) return;
    const reason = form.querySelector('[name="reason"]:checked')?.value;
    if (!reason) { error.textContent = options.reasonRequired || 'Please select a reason.'; return; }
    const details = [...form.querySelectorAll('[data-wui-reason-details]')].find(element => element.dataset.wuiReasonDetails === reason)?.querySelector('textarea').value || '';
    const started = generation;
    submitting = true;
    button.disabled = true; form.setAttribute('aria-busy', 'true');
    try {
      await options.submit({ reason, details });
      if (!cancelled && started === generation) { terminal = true; emit('submitted', { reason }); options.complete?.(); }
    } catch (failure) { if (!cancelled && started === generation) error.textContent = options.error || failure?.message || 'Could not send feedback. You can skip and deactivate.'; }
    finally {
      if (started === generation) { submitting = false; button.disabled = false; form.removeAttribute('aria-busy'); }
    }
  });
  const api = {}; instances.set(modal, api); return api;
}
