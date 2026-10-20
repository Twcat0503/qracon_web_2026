import { initPunches } from './punches';
import { setFlap } from './flap';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const token = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const ms = (name: string) => parseFloat(token(name)) || 0;

const EVENT_DATE = '2026-12-05';
const TIME_ZONE = 'Asia/Taipei';
const SOON_MINUTES = 30;

type State = 'upcoming' | 'soon' | 'now' | 'past';

const STATUS_TEXT: Record<State, string> = {
  upcoming: '',
  soon: '即將開始',
  now: '進行中',
  past: '已結束',
};

const toMinutes = (hhmm: string) => {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const clock = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

function currentMinutes(): { minutes: number; preview: boolean } | null {
  const query = new URLSearchParams(window.location.search).get('now');
  if (query && /^\d{2}:\d{2}$/.test(query)) return { minutes: toMinutes(query), preview: true };

  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  if (`${parts.year}-${parts.month}-${parts.day}` !== EVENT_DATE) return null;
  return { minutes: Number(parts.hour) * 60 + Number(parts.minute), preview: false };
}

function lightUp(el: HTMLElement) {
  if (reducedMotion()) return;
  const hold = 'steps(1, end)';
  el.animate(
    [
      { opacity: 0.25, offset: 0, easing: hold },
      { opacity: 1, offset: 0.2, easing: hold },
      { opacity: 0.45, offset: 0.34, easing: hold },
      { opacity: 1, offset: 0.5 },
      { opacity: 1, offset: 1 },
    ],
    { duration: ms('--dur-slow') },
  );
}

function initNow(sessions: HTMLElement[]) {
  const board = document.querySelector<HTMLElement>('[data-now-board]');
  const nowList = board?.querySelector<HTMLElement>('[data-now-list]');
  const nextList = board?.querySelector<HTMLElement>('[data-next-list]');
  const clockEl = board?.querySelector<HTMLElement>('[data-now-clock]');
  const previewEl = board?.querySelector<HTMLElement>('[data-now-preview]');

  const render = () => {
    const now = currentMinutes();
    if (!now) return;

    const running: HTMLElement[] = [];
    let nextStart = Infinity;

    for (const el of sessions) {
      const start = Number(el.dataset.start);
      const end = Number(el.dataset.end);
      let state: State = 'upcoming';
      if (now.minutes >= end) state = 'past';
      else if (now.minutes >= start) state = 'now';
      else if (start - now.minutes <= SOON_MINUTES) state = 'soon';
      if (state === 'now' && el.dataset.state !== 'now') lightUp(el);
      el.dataset.state = state;

      const status = el.querySelector<HTMLElement>('[data-status]');
      if (status) {
        status.textContent = STATUS_TEXT[state];
        status.hidden = !STATUS_TEXT[state];
      }
      if (state === 'now' && el.dataset.listed === 'true') running.push(el);
      if (start > now.minutes) nextStart = Math.min(nextStart, start);
    }

    if (!board || !nowList || !nextList || !clockEl) return;
    board.hidden = false;
    const flap = clockEl.querySelector<HTMLElement>('[data-flap-live]');
    if (flap) setFlap(flap, clock(now.minutes));
    else clockEl.textContent = clock(now.minutes);
    clockEl.setAttribute('datetime', `${EVENT_DATE}T${clock(now.minutes)}+08:00`);
    if (previewEl) previewEl.hidden = !now.preview;

    const item = (el: HTMLElement) => {
      const li = document.createElement('li');
      const link = el.querySelector<HTMLAnchorElement>('.s__title a');
      const a = document.createElement('a');
      a.href = link?.href ?? '#';
      a.textContent = link?.textContent ?? '';
      const room = document.createElement('span');
      room.textContent = el.dataset.rooms ?? '';
      li.append(a, room);
      return li;
    };

    nowList.replaceChildren(...running.map(item));
    if (!running.length) {
      const li = document.createElement('li');
      li.textContent = '目前沒有進行中的場次';
      nowList.append(li);
    }

    const upcoming = sessions.filter(
      (el) => Number(el.dataset.start) === nextStart && el.dataset.listed === 'true',
    );
    nextList.replaceChildren(...upcoming.map(item));
    if (!upcoming.length) {
      const li = document.createElement('li');
      li.textContent = '今天的場次都結束了';
      nextList.append(li);
    }
    const nextLabel = board.querySelector<HTMLElement>('[data-next-time]');
    if (nextLabel) nextLabel.textContent = Number.isFinite(nextStart) ? clock(nextStart) : '';
  };

  render();
  if (currentMinutes() && !currentMinutes()?.preview) window.setInterval(render, 60_000);
}

function initMobileControls() {
  const controls = document.querySelector<HTMLElement>('[data-agenda-controls]');
  const agenda = document.querySelector<HTMLElement>('.agenda');
  const toggle = controls?.querySelector<HTMLButtonElement>('[data-filter-toggle]');
  const jump = controls?.querySelector<HTMLSelectElement>('[data-phase-jump]');
  if (!controls || !agenda || !toggle || !jump) return;
  const mobile = window.matchMedia('(max-width: 71.99rem)');
  const phases = [...document.querySelectorAll<HTMLElement>('[data-phase-start]')];
  const setExpanded = (open: boolean) => {
    controls.toggleAttribute('data-filters-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  const measure = () => {
    const height = mobile.matches ? controls.getBoundingClientRect().height : 0;
    agenda.style.setProperty('--agenda-controls-height', `${height}px`);
  };
  new ResizeObserver(measure).observe(controls);
  mobile.addEventListener('change', measure);
  measure();
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    setExpanded(open);
  });
  controls.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !controls.hasAttribute('data-filters-open')) return;
    setExpanded(false);
    toggle.focus({ preventScroll: true });
  });
  jump.addEventListener('change', () => {
    const phase = document.getElementById(jump.value);
    if (!phase || phase.hasAttribute('data-empty')) return;
    setExpanded(false);
    measure();
    const top =
      window.scrollY +
      phase.getBoundingClientRect().top -
      controls.getBoundingClientRect().height -
      16;
    window.scrollTo({ top, behavior: reducedMotion() ? 'instant' : 'smooth' });
    const url = new URL(window.location.href);
    url.hash = phase.id;
    history.replaceState(null, '', url);
  });
  let pending = false;
  const updatePhase = () => {
    pending = false;
    if (!mobile.matches) return;
    const edge = controls.getBoundingClientRect().height + 24;
    const visible = phases.filter((phase) => !phase.hasAttribute('data-empty'));
    const active = visible.findLast((phase) => phase.getBoundingClientRect().top <= edge);
    jump.value = active?.id ?? '';
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!pending) {
        pending = true;
        requestAnimationFrame(updatePhase);
      }
    },
    { passive: true },
  );
  document.addEventListener('agenda:filters-changed', updatePhase);
  updatePhase();
}

function initFilters(sessions: HTMLElement[]) {
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
    for (const group of document.querySelectorAll<HTMLElement>('[data-group-time]')) {
      const time = Number(group.dataset.groupTime);
      group.toggleAttribute(
        'data-empty',
        !sessions.some(
          (session) => !session.hasAttribute('data-dim') && Number(session.dataset.start) === time,
        ),
      );
    }
    let firstVisiblePhase = true;
    for (const phase of document.querySelectorAll<HTMLElement>('[data-phase-start]')) {
      const from = Number(phase.dataset.phaseStart);
      const to = Number(phase.dataset.phaseEnd);
      const empty = !sessions.some(
        (session) =>
          !session.hasAttribute('data-dim') &&
          Number(session.dataset.start) >= from &&
          Number(session.dataset.start) < to,
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

function initCrosshair() {
  const table = document.querySelector<HTMLElement>('.tt');
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

function initPhaseArrival() {
  const arrive = (hash: string) => {
    if (!hash.startsWith('#phase-') || reducedMotion()) return;
    const band = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!band?.classList.contains('tt__phase')) return;
    band.classList.remove('is-arriving');
    void band.offsetWidth;
    band.classList.add('is-arriving');
    band.addEventListener('animationend', () => band.classList.remove('is-arriving'), {
      once: true,
    });
  };

  const afterScroll = (hash: string) => {
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      arrive(hash);
    };
    if ('onscrollend' in window) window.addEventListener('scrollend', go, { once: true });
    window.setTimeout(go, 900);
  };

  window.addEventListener('hashchange', () => afterScroll(window.location.hash));
  if (window.location.hash) arrive(window.location.hash);
}

export function initAgenda() {
  const sessions = [...document.querySelectorAll<HTMLElement>('[data-session]')];
  if (!sessions.length) return;
  initFilters(sessions);
  initNow(sessions);
  initCrosshair();
  initPhaseArrival();
  initMobileControls();
}
