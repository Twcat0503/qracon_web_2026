export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const token = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();
export const ms = (name: string) => parseFloat(token(name)) || 0;
