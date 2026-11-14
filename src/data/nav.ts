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
  { href: '/team/', label: '團隊' },
  { href: '/coc/', label: '行為準則' },
];

export function isCurrent(itemHref: string, pathname: string): boolean {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  const appPath = basePath && (pathname === basePath || pathname.startsWith(`${basePath}/`))
    ? pathname.slice(basePath.length) || '/'
    : pathname;
  const path = appPath.endsWith('/') ? appPath : `${appPath}/`;
  if (itemHref === '/') return path === '/';
  return path.startsWith(itemHref);
}

