export interface NavItem {
  href: string;
  label: string;
}

export const nav: NavItem[] = [
  { href: '/', label: '首頁' },
  { href: '/agenda/', label: '議程' },
  { href: '/venue/', label: '會場交通' },
  { href: '/about/', label: '關於' },
  { href: '/sponsors/', label: '贊助' },
  { href: '/cfp/', label: '投稿' },
  { href: '/team/', label: '團隊' },
  { href: '/coc/', label: '行為準則' },
];

export function isCurrent(itemHref: string, pathname: string): boolean {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`;
  if (itemHref === '/') return path === '/';
  return path.startsWith(itemHref);
}

