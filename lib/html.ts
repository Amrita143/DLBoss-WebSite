const CF_CHALLENGE_REGEX = /<script>\(function\(\)\{function c\(\)[\s\S]*?<\/script>/gi;

export function stripCloudflareChallenge(html: string): string {
  return html.replace(CF_CHALLENGE_REGEX, '');
}

export function extractBodyInnerHtml(html: string): string {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!match) {
    return html;
  }
  return match[1];
}

export function extractHeadMeta(html: string) {
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? '';
  const description = html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["'][^>]*>/i)?.[1] ?? '';
  const keywords = html.match(/<meta\s+name=["']keywords["']\s+content=["']([\s\S]*?)["'][^>]*>/i)?.[1] ?? '';
  return { title, description, keywords };
}
