export function initCrosshair() {
  const table = document.querySelector<HTMLElement>('[data-timetable-board]');
  if (!table) return;
  const heads = [...table.querySelectorAll<HTMLElement>('.tt__room')];
  const marks = [...table.querySelectorAll<HTMLElement>('.tt__mark')];
  let current: HTMLElement | null = null;
  let pointerSuspended = false;

  const set = (cell: HTMLElement | null) => {
    if (cell === current) return;
    current?.removeAttribute('data-hot');
    current = cell;
    current?.setAttribute('data-hot', '');
    const c0 = Number(cell?.dataset.c0);
    const c1 = Number(cell?.dataset.c1);
    const r0 = Number(cell?.dataset.r0);
    const r1 = Number(cell?.dataset.r1);
    for (const h of heads) {
      const col = Number(h.dataset.col);
      h.toggleAttribute('data-hot', !!cell && col >= c0 && col < c1);
    }
    for (const m of marks) {
      const row = Number(m.dataset.row);
      m.toggleAttribute('data-hot', !!cell && row < r1 && row + 2 > r0);
    }
  };

  const cellOf = (target: EventTarget | null) =>
    target instanceof Element ? target.closest<HTMLElement>('[data-session]') : null;

  document.addEventListener('agenda:reset-highlight', () => {
    set(null);
    pointerSuspended = true;
  });
  table.addEventListener('pointerover', (e) => {
    if (!pointerSuspended) set(cellOf(e.target));
  });
  table.addEventListener('pointermove', (e) => {
    pointerSuspended = false;
    set(cellOf(e.target));
  });
  table.addEventListener('pointerleave', () => set(null));
  table.addEventListener('focusin', (e) => {
    if (e.target instanceof HTMLElement && e.target.matches(':focus-visible')) {
      pointerSuspended = false;
      set(cellOf(e.target));
    }
  });
  table.addEventListener('focusout', (e) => {
    set(cellOf(e.relatedTarget));
  });
}
