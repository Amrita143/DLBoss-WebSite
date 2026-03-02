export function normalizeContentPath(pathname: string): string {
  if (!pathname.startsWith('/')) {
    return `/${pathname}`;
  }

  if (pathname !== '/' && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

export function phpPathFromSegments(segments: string[]): string {
  const joined = segments.join('/');
  return `/${joined}.php`;
}
