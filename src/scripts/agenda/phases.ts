import { reducedMotion } from './motion';

export function initPhaseArrival() {
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
