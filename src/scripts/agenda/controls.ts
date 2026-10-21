import { reducedMotion } from './motion';

export function initMobileControls() {
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
      window.scrollY + phase.getBoundingClientRect().top - controls.getBoundingClientRect().height;
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
