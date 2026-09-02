export function createContextMenu({
  container,
  trigger,
  menu,
  onOpen,
} = {}) {
  let isOpen = false;

  function setOpen(nextIsOpen, { restoreFocus = false } = {}) {
    if (isOpen === nextIsOpen) return;

    isOpen = nextIsOpen;
    menu.hidden = !isOpen;
    trigger.setAttribute('aria-expanded', String(isOpen));

    if (isOpen) {
      onOpen?.();
    } else if (restoreFocus) {
      trigger.focus();
    }
  }

  function handleTriggerClick() {
    setOpen(!isOpen);
  }

  function handlePointerDown(event) {
    if (isOpen && !container.contains(event.target)) setOpen(false);
  }

  function handleKeyDown(event) {
    if (event.key !== 'Escape' || !isOpen) return;

    event.preventDefault();
    setOpen(false, { restoreFocus: true });
  }

  trigger.addEventListener('click', handleTriggerClick);
  document.addEventListener('pointerdown', handlePointerDown);
  document.addEventListener('keydown', handleKeyDown);

  return {
    close(options) {
      setOpen(false, options);
    },
    dispose() {
      trigger.removeEventListener('click', handleTriggerClick);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    },
  };
}
