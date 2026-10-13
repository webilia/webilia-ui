const initializedRoots = new WeakSet();

export function init(root = document) {
  if (initializedRoots.has(root)) return;
  initializedRoots.add(root);
  root.addEventListener('click', (event) => {
    if (event.__wuiNoticeHandled) return;
    const button = event.target.closest?.('[data-wui-notice-dismiss]');
    const notice = button?.closest('.wui-notice');
    if (!notice || !notice.closest('.wui')) return;
    event.__wuiNoticeHandled = true;
    event.preventDefault();
    notice.dispatchEvent(new CustomEvent('wui:notice:dismissed', { bubbles: true }));
    notice.remove();
  });
}
