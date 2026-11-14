const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const basePrefix = basePath ? `${basePath}/` : '/';

/** Prefix an internal URL with the deployment path while preserving external URLs. */
export function sitePath(path: string): string {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#|\?)/i.test(path)) return path;

  const match = path.match(/^([^?#]*)(.*)$/);
  const pathname = match?.[1] ?? path;
  const suffix = match?.[2] ?? '';
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;

  if (!basePath) return `${normalizedPath}${suffix}`;
  if (normalizedPath === basePath || normalizedPath.startsWith(`${basePath}/`)) {
    return `${normalizedPath}${suffix}`;
  }

  if (normalizedPath === '/') return `${basePrefix}${suffix}`;
  return `${basePrefix}${normalizedPath.slice(1)}${suffix}`;
}
