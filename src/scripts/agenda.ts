
import { initPunches } from './punches';
import { setFlap } from './flap';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
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
      typeButtons.filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset.filterType),
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
    if (clearButton) clearButton.hidden = !filtering;
    if (countEl) countEl.textContent = filtering ? `符合條件的場次：${shown}／${listed}` : `共 ${listed} 個場次`;
  };

  for (const button of typeButtons) {
    button.addEventListener('click', () => {
      button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
      apply();
    });
  }

  punchedButton?.addEventListener('click', () => {
    punchedButton.setAttribute('aria-pressed', String(punchedButton.getAttribute('aria-pressed') !== 'true'));
    apply();
  });

  clearButton?.addEventListener('click', () => {
    typeButtons.forEach((b) => b.setAttribute('aria-pressed', 'false'));
    punchedButton?.setAttribute('aria-pressed', 'false');
    apply();
    typeButtons[0]?.focus();
  });

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

  const set = (cell: HTMLElement | null) => {
    if (cell === current) return;
    current = cell;
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

  table.addEventListener('pointerover', (e) => set(cellOf(e.target)));
  table.addEventListener('pointerleave', () => set(null));
  table.addEventListener('focusin', (e) => set(cellOf(e.target)));
  table.addEventListener('focusout', (e) => {
    if (!table.contains(e.relatedTarget as Node | null)) set(null);
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
    band.addEventListener('animationend', () => band.classList.remove('is-arriving'), { once: true });
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

const VT_NAME = 'vt-session';
const VT_KEY = 'qracon2026:vt-session';

function idFromUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  const match = new URL(url, window.location.href).pathname.match(/^\/agenda\/([^/]+)\/?$/);
  return match?.[1] ?? null;
}

function inView(el: Element) {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
}

function remember(id: string | null) {
  try {
    if (id) sessionStorage.setItem(VT_KEY, id);
    else sessionStorage.removeItem(VT_KEY);
  } catch {
  }
}

function initSessionMorph(sessions: HTMLElement[]) {
  let clicked: string | null = null;

  document.addEventListener('click', (e) => {
    const link = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>('a[href]') : null;
    clicked = link ? idFromUrl(link.href) : null;
  });

  window.addEventListener('pageswap', (event) => {
    sessions.forEach((el) => el.style.removeProperty('view-transition-name'));
    if (!event.viewTransition) return;
    const id = idFromUrl(event.activation?.entry?.url) ?? clicked;
    const cell = id ? sessions.find((el) => el.dataset.id === id) : undefined;
    if (!cell || !inView(cell)) {
      remember(null);
      return;
    }
    cell.style.setProperty('view-transition-name', VT_NAME);
    remember(id);
  });
}

export function initAgenda() {
  const sessions = [...document.querySelectorAll<HTMLElement>('[data-session]')];
  if (!sessions.length) return;
  initFilters(sessions);
  initNow(sessions);
  initCrosshair();
  initPhaseArrival();
  initSessionMorph(sessions);
}

