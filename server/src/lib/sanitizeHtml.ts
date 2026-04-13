/** Strip obvious XSS; keep basic formatting tags for rich posts. */
export function sanitizeRichHtml(input: string, maxLen = 50000): string {
  let s = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '')
    .slice(0, maxLen);
  return s;
}
