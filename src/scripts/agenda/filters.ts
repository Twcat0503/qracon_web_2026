import { initPunches } from '../punches';
import { reducedMotion, ms, token } from './motion';

export function initFilters(sessions: HTMLElement[]) {
  const tools = document.querySelector<HTMLElement>('[data-tt-tools]');
  if (!tools) return;
  tools.hidden = false;

  const typeButtons = [...tools.querySelectorAll<HTMLButtonElement>('[data-filter-type]')];
  const punchedButton = tools.querySelector<HTMLButtonElement>('[data-filter-punched]');
  const countEl = tools.querySelector<HTMLElement>('[data-tt-count]');
  const punchedCount = tools.querySelector<HTMLElement>('[data-punched-count]');
  const clearButton = tools.querySelector<HTMLButtonElement>('[data-filter-clear]');
  let punched = new Set<string>();

  const apply = () => {
    const types = new Set(
      typeButtons
        .filter((b) => b.getAttribute('aria-pressed') === 'true')
        .map((b) => b.dataset.filterType),
    );
    const onlyPunched = punchedButton?.getAttribute('aria-pressed') === 'true';
    let shown = 0;
    let listed = 0;

    for (const el of sessions) {
      const isListed = el.dataset.listed === 'true';
      if (isListed) listed += 1;
      const typeOk = !types.size || types.has(el.dataset.type);
      const punchOk = !onlyPunched || punched.has(el.dataset.id ?? '');
      const match = isListed ? typeOk && punchOk : !types.size && !onlyPunched;
      el.toggleAttribute('data-dim', !match);
      if (match && isListed) shown += 1;
    }

    const filtering = types.size > 0 || onlyPunched;
    let firstVisiblePhase = true;
    for (const phase of document.querySelectorAll<HTMLElement>('[data-phase-start]')) {
      const from = Number(phase.dataset.phaseStart);
      const to = Number(phase.dataset.phaseEnd);
      const empty = !sessions.some(
        (session) =>
          !session.hasAttribute('data-dim') &&
          Number(session.dataset.start) < to &&
          Number(session.dataset.end) > from,
      );
      phase.toggleAttribute('data-empty', empty);
      phase.toggleAttribute('data-first-phase', !empty && firstVisiblePhase);
      if (!empty) firstVisiblePhase = false;
      const option = document.querySelector<HTMLOptionElement>(
        `[data-phase-jump] option[value="${phase.id}"]`,
      );
      if (option) option.disabled = empty;
    }
    const empty = document.querySelector<HTMLElement>('[data-tt-empty]');
    if (empty) empty.hidden = shown > 0;
    const board = document.querySelector<HTMLElement>('[data-timetable-board]');
    if (board) board.hidden = shown === 0;
    const summary = tools
      .closest('[data-agenda-controls]')
      ?.querySelector<HTMLElement>('[data-filter-summary]');
    if (summary)
      summary.textContent =
        [types.size ? `${types.size} 類型` : '', onlyPunched ? '已收藏' : '']
          .filter(Boolean)
          .join('・') || '全部';
    document.dispatchEvent(new Event('agenda:filters-changed'));
    if (clearButton) clearButton.hidden = !filtering;
    if (countEl)
      countEl.textContent = filtering
        ? `符合條件的場次：${shown}／${listed}`
        : `共 ${listed} 個場次`;
  };

  for (const button of typeButtons) {
    button.addEventListener('click', () => {
      button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
      apply();
    });
  }

  punchedButton?.addEventListener('click', () => {
    punchedButton.setAttribute(
      'aria-pressed',
      String(punchedButton.getAttribute('aria-pressed') !== 'true'),
    );
    apply();
  });

  const clear = () => {
    typeButtons.forEach((b) => b.setAttribute('aria-pressed', 'false'));
    punchedButton?.setAttribute('aria-pressed', 'false');
    apply();
    const controls = tools.closest('[data-agenda-controls]');
    const mobileCollapsed =
      window.matchMedia('(max-width: 71.99rem)').matches &&
      !controls?.hasAttribute('data-filters-open');
    if (mobileCollapsed)
      controls
        ?.querySelector<HTMLButtonElement>('[data-filter-toggle]')
        ?.focus({ preventScroll: true });
    else typeButtons[0]?.focus({ preventScroll: true });
  };
  clearButton?.addEventListener('click', clear);
  document.querySelector('[data-filter-reset]')?.addEventListener('click', clear);

  initPunches((set) => {
    punched = set;
    if (punchedCount && punchedCount.textContent !== String(set.size)) {
      const up = set.size > Number(punchedCount.textContent);
      punchedCount.textContent = String(set.size);
      if (!reducedMotion()) {
        punchedCount.animate(
          [
            { transform: `translateY(${up ? '-0.5em' : '0.5em'})`, opacity: 0 },
            { transform: 'none', opacity: 1 },
          ],
          { duration: ms('--dur-fast'), easing: token('--ease-out') },
        );
      }
    }
    apply();
  });
}
