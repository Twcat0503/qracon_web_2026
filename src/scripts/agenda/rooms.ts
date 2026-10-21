import { reducedMotion } from './motion';

export function initRoomScroll() {
  const board = document.querySelector<HTMLElement>('[data-timetable-board]');
  const track = board?.querySelector<HTMLElement>('[data-room-track]');
  const heads = [...(board?.querySelectorAll<HTMLElement>('.tt__room') ?? [])];
  const jump = document.querySelector<HTMLSelectElement>('[data-room-jump]');
  const previous = document.querySelector<HTMLButtonElement>('[data-room-prev]');
  const next = document.querySelector<HTMLButtonElement>('[data-room-next]');
  const position = document.querySelector<HTMLElement>('[data-room-position]');
  if (!board || !track || !heads.length || !jump || !previous || !next || !position) return;
  let current = 0;
  const columnWidth = () => heads[0]!.getBoundingClientRect().width;
  const go = (index: number) => {
    const target = Math.max(0, Math.min(heads.length - 1, index));
    if (!columnWidth()) return;
    track.scrollTo({
      left: target * columnWidth(),
      behavior: reducedMotion() ? 'instant' : 'smooth',
    });
  };
  const update = () => {
    if (!track.clientWidth || !columnWidth()) {
      previous.disabled = true;
      next.disabled = true;
      return;
    }
    const limit = Math.max(0, track.scrollWidth - track.clientWidth);
    current = Math.min(heads.length - 1, Math.round(track.scrollLeft / columnWidth()));
    jump.value = String(current);
    const label = `${current + 1}／${heads.length}`;
    if (position.textContent !== label) position.textContent = label;
    previous.disabled = track.scrollLeft <= 1;
    next.disabled = track.scrollLeft >= limit - 1;
    board.toggleAttribute('data-scroll-start', previous.disabled);
    board.toggleAttribute('data-scroll-end', next.disabled);
  };
  previous.addEventListener('click', () => go(current - 1));
  next.addEventListener('click', () => go(current + 1));
  jump.addEventListener('change', () => go(Number(jump.value)));
  track.addEventListener('scroll', update, { passive: true });
  // Keep the selected room when rotation changes the width of each column.
  let measuredColumnWidth = columnWidth();
  new ResizeObserver(() => {
    const width = columnWidth();
    if (!width || !track.clientWidth) return;
    if (measuredColumnWidth && Math.abs(width - measuredColumnWidth) > 0.5) {
      track.scrollTo({ left: current * width, behavior: 'instant' });
    }
    measuredColumnWidth = width;
    update();
  }).observe(track);
  document.addEventListener('agenda:filters-changed', () => {
    const matches = [
      ...board.querySelectorAll<HTMLElement>('[data-session][data-listed="true"]:not([data-dim])'),
    ];
    const visible = matches.some((session) => {
      const from = (Number(session.dataset.c0) - 1) * columnWidth();
      const to = (Number(session.dataset.c1) - 1) * columnWidth();
      return from < track.scrollLeft + track.clientWidth && to > track.scrollLeft;
    });
    if (!visible && matches[0]) go(Number(matches[0].dataset.c0) - 1);
    update();
  });
  update();
}
