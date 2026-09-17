
export const hhmm = (iso: string) => iso.slice(11, 16);

export const toMinutes = (time: string) => {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return h * 60 + m;
};

export const minutesOf = (iso: string) => toMinutes(hhmm(iso));

export function durationLabel(startIso: string, endIso: string): string {
  const total = minutesOf(endIso) - minutesOf(startIso);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h && m) return `${h} 小時 ${m} 分`;
  if (h) return `${h} 小時`;
  return `${m} 分鐘`;
}
