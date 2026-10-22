import { setFlap } from '../flap';
import { reducedMotion, ms } from './motion';

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

export function initNow(sessions: HTMLElement[]) {
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
