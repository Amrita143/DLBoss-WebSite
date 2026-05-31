export const HOMEPAGE_MESSAGE_SETTING_KEY = 'homepage_live_intro_html';

export const DEFAULT_HOMEPAGE_MESSAGE_HTML = `
  <p>
    <strong>DLBOSS.Service</strong> is one of the fastest Matka result hubs and welcomes you with full energy.
    Here below you can check quick market updates, trusted result viewing, Jodi and Panel chart access,
    and fast tracking for major Matka markets like Kalyan, Main, Milan, Rajdhani, and more.
    For daily result flow, chart navigation, market watching, and admin-managed updates, DLBOSS keeps everything in one place.
  </p>
`.trim();

export function getHomepageMessageHtml(settingValue: Record<string, unknown> | null | undefined): string {
  const candidate = settingValue && typeof settingValue === 'object' ? settingValue.html : null;
  return typeof candidate === 'string' && candidate.trim() ? candidate : DEFAULT_HOMEPAGE_MESSAGE_HTML;
}
