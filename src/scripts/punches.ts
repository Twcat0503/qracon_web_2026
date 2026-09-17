
const KEY = 'qracon2026:punched';
let fallback = new Set<string>();

export function readPunched(): Set<string> {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((x): x is string => typeof x === 'string'));
    }
  } catch {
  }
  return new Set(fallback);
}

function writePunched(set: Set<string>) {
  fallback = new Set(set);
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...set]));
  } catch {
  }
}

function sync(set: Set<string>) {
  document.querySelectorAll<HTMLButtonElement>('[data-punch]').forEach((button) => {
    button.setAttribute('aria-pressed', String(set.has(button.dataset.punch ?? '')));
  });
}

export function initPunches(onChange?: (set: Set<string>) => void) {
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-punch]');
  buttons.forEach((button) => {
    button.hidden = false;
    button.addEventListener('click', () => {
      const id = button.dataset.punch;
      if (!id) return;
      const next = readPunched();
      const punching = !next.has(id);
      if (punching) next.add(id);
      else next.delete(id);
      writePunched(next);
      sync(next);
      button.classList.remove('is-punching');
      if (punching) {
        void button.offsetWidth;
        button.classList.add('is-punching');
        const done = (event: AnimationEvent) => {
          if (event.pseudoElement !== '::after') return;
          button.classList.remove('is-punching');
          button.removeEventListener('animationend', done);
        };
        button.addEventListener('animationend', done);
      }
      onChange?.(next);
    });
  });

  window.addEventListener('storage', (event) => {
    if (event.key !== KEY) return;
    const next = readPunched();
    sync(next);
    onChange?.(next);
  });

  const initial = readPunched();
  sync(initial);
  onChange?.(initial);
}

