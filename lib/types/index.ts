export type ChartType = 'jodi' | 'panel';
export type ChartDayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface ChartCellStyle {
  textColor?: string | null;
  highlightColor?: string | null;
}

export type ChartCellStyles = Partial<Record<ChartDayKey, ChartCellStyle>>;

export interface Market {
  id: string;
  slug: string;
  name: string;
  status: 'active' | 'inactive';
  sort_order: number;
  open_time: string | null;
  close_time: string | null;
  has_jodi: boolean;
  has_panel: boolean;
  show_sunday: boolean;
  is_highlighted: boolean;
  highlight_color: string;
  created_at: string;
  updated_at: string;
}

export interface ChartRecord {
  id: string;
  market_id: string;
  chart_type: ChartType;
  week_start: string;
  week_end: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  sun: string;
  cell_styles: ChartCellStyles | null;
  source_year_label: string;
  created_at: string;
  updated_at: string;
}

export interface MarketResult {
  id: string;
  market_id: string;
  result_date: string;
  open_panna: string | null;
  open_ank: string | null;
  close_panna: string | null;
  close_ank: string | null;
  jodi: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PageDoc {
  id: string;
  path: string;
  page_type: 'home' | 'chart' | 'content' | 'utility';
  title: string;
  meta_description: string | null;
  meta_keywords: string | null;
  canonical_url: string | null;
  body_blocks: Record<string, unknown> | null;
  raw_html_snapshot: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type AdminRole = 'superadmin' | 'admin';

export interface AdminUser {
  id: string;
  auth_user_id: string;
  login_id: string;
  email: string;
  role: AdminRole;
  created_at: string;
  updated_at: string;
}

export interface AdminSession {
  userId: string;
  loginId: string;
  email: string;
  role: AdminRole;
}

export interface ParsedChartRecord {
  market_slug: string;
  chart_type: ChartType;
  heading: string;
  rows: Array<{
    week_start: string;
    week_end: string;
    mon: string;
    tue: string;
    wed: string;
    thu: string;
    fri: string;
    sat: string;
    source_year_label: string;
  }>;
}
