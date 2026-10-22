import { initNow } from './agenda/now';
import { initMobileControls } from './agenda/controls';
import { initFilters } from './agenda/filters';
import { initRoomScroll } from './agenda/rooms';
import { initCrosshair } from './agenda/highlight';
import { initPhaseArrival } from './agenda/phases';

export function initAgenda() {
  const sessions = [...document.querySelectorAll<HTMLElement>('[data-session]')];
  if (!sessions.length) return;
  initFilters(sessions);
  initNow(sessions);
  initCrosshair();
  initPhaseArrival();
  initMobileControls();
  initRoomScroll();
}
