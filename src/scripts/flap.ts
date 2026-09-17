
const POOL_DIGIT = '0123456789';
const POOL_LATIN = 'ABCDEFGHJKLMNOPRSTUVWXYZ';
const POOL_CJK = '量子年會臺南院區車票觀測干涉疊加坍縮波粒報到開幕閉幕午餐時刻場次月台剪孔';
const FLIP_MS = 70;

const pick = (pool: string) => pool.charAt(Math.floor(Math.random() * pool.length));

function poolFor(ch: string): string | null {
  if (/\d/.test(ch)) return POOL_DIGIT;
  if (/[A-Za-z]/.test(ch)) return POOL_LATIN;
  if (/[㐀-鿿]/.test(ch)) return POOL_CJK;
  return null;
}

function settle(board: HTMLElement) {
  const chars = [...board.querySelectorAll<HTMLElement>('.flap__char')];
  chars.forEach((el, i) => {
    const target = el.textContent ?? '';
    const pool = poolFor(target);
    if (!pool) return;
    let remaining = 3 + i * 2 + Math.floor(Math.random() * 3);
    const tick = () => {
      el.classList.remove('is-flipping');
      void el.offsetWidth;
      el.classList.add('is-flipping');
      if (remaining > 0) {
        el.textContent = pick(pool);
        remaining -= 1;
        window.setTimeout(tick, FLIP_MS);
      } else {
        el.textContent = target;
      }
    };
    window.setTimeout(tick, i * 40);
  });
}

const tileChars = (text: string) => [...text].filter((ch) => poolFor(ch) !== null);

export function setFlap(board: HTMLElement, text: string) {
  const hidden = board.nextElementSibling;
  if (hidden?.classList.contains('visually-hidden')) hidden.textContent = text;

  const targets = tileChars(text);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  board.querySelectorAll<HTMLElement>('.flap__char').forEach((el, i) => {
    const target = targets[i];
    if (target === undefined || el.textContent === target) return;
    const pool = poolFor(target);
    if (reduce || !pool) {
      el.textContent = target;
      return;
    }
    let remaining = 1 + Math.floor(Math.random() * 2);
    const tick = () => {
      el.classList.remove('is-flipping');
      void el.offsetWidth;
      el.classList.add('is-flipping');
      el.textContent = remaining > 0 ? pick(pool) : target;
      remaining -= 1;
      if (remaining >= 0) window.setTimeout(tick, FLIP_MS);
    };
    window.setTimeout(tick, i * 40);
  });
}

let started = false;

function settleOnValidation() {
  const boards = document.querySelectorAll<HTMLElement>('[data-flap-observed]');
  if (!boards.length) return;
  document.addEventListener('qracon:validated', () => boards.forEach(settle), { once: true });
}

export function settleFlaps() {
  if (started) return;
  started = true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  settleOnValidation();
  if (!('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.unobserve(entry.target);
        settle(entry.target as HTMLElement);
      }
    },
    { threshold: 0.75 },
  );
  document.querySelectorAll<HTMLElement>('[data-flap]').forEach((el) => io.observe(el));
}

